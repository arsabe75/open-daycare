"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { createClient } from "@/utils/supabase/server";
import { buildInvitationEmailHtml } from "@/lib/emails/invitation-email";
import {
  generateInviteCode,
  getFirstName,
  isValidEmail,
  toDbRelationship,
} from "@/lib/parent-utils";
import type { ParentRelation } from "@/lib/child-types";

export type InvitationState = {
  error?: string;
  ok?: boolean;
};

const MAX_CODE_RETRIES = 3;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function createInvitation(
  _prevState: InvitationState,
  formData: FormData,
): Promise<InvitationState> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const name = (formData.get("name") as string | null) ?? "";
  const email = (formData.get("email") as string | null) ?? "";
  const relation = (formData.get("relation") as ParentRelation | null) ?? "mom";
  const childId = (formData.get("childId") as string | null) ?? "";
  const candidateCode = (formData.get("code") as string | null) ?? "";

  // Server-side validation
  if (!name.trim()) {
    return { error: "El nombre es obligatorio" };
  }

  if (!email.trim()) {
    return { error: "El email es obligatorio" };
  }

  if (!isValidEmail(email)) {
    return { error: "Ingresá un email válido" };
  }

  if (!childId) {
    return { error: "No se encontró el niño" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Fetch child + room details for the email and RLS/validation checks.
  const { data: child, error: childError } = await supabase
    .from("children")
    .select("id, full_name, rooms(name)")
    .eq("id", childId)
    .single();

  if (childError || !child) {
    return { error: "No se encontró el niño" };
  }

  // Check if this email is already actively linked to the child.
  const { data: existingLink } = await supabase
    .from("parent_children")
    .select("id, users!inner(email)")
    .eq("child_id", childId)
    .eq("users.email", normalizedEmail)
    .maybeSingle();

  if (existingLink) {
    return { error: "Este email ya está vinculado activamente a este niño" };
  }

  // Cancel any previous pending invitation for the same child + email.
  await supabase
    .from("invitations")
    .update({ status: "cancelled" })
    .eq("child_id", childId)
    .eq("email", normalizedEmail)
    .eq("status", "pending");

  const dbRelationship = toDbRelationship(relation);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  const staffUser = await supabase.auth.getUser();

  if (!staffUser.data.user) {
    return { error: "No hay sesión de staff activa" };
  }

  // Try to insert with the candidate code; retry on unique violation.
  let finalCode = candidateCode.toUpperCase();
  let insertedId: string | null = null;

  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt += 1) {
    const { data, error } = await supabase
      .from("invitations")
      .insert({
        child_id: childId,
        invited_by: staffUser.data.user.id,
        full_name: name.trim(),
        email: normalizedEmail,
        relationship: dbRelationship,
        code: finalCode,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (!error && data) {
      insertedId = data.id;
      break;
    }

    const isUniqueViolation =
      error?.code === "23505" ||
      error?.message?.toLowerCase().includes("duplicate key");

    if (isUniqueViolation && attempt < MAX_CODE_RETRIES - 1) {
      finalCode = generateInviteCode();
      continue;
    }

    if (error) {
      return { error: `No se pudo crear la invitación: ${error.message}` };
    }
  }

  if (!insertedId) {
    return { error: "No se pudo crear la invitación después de varios intentos" };
  }

  // Send the email.
  const apiKey = process.env.RESEND_API_KEY;
  const origin = (await headers()).get("origin") ?? "";

  if (!apiKey) {
    await supabase
      .from("invitations")
      .update({ status: "cancelled" })
      .eq("id", insertedId);
    return { error: "Falta configurar RESEND_API_KEY; la invitación fue cancelada" };
  }

  const childRoomName = child.rooms?.name ?? "";
  const activateUrl = `${origin}/activate-account?code=${encodeURIComponent(finalCode)}`;

  try {
    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from: "OpenDayCare <onboarding@resend.dev>",
      to: normalizedEmail,
      subject: `Invitación para seguir a ${getFirstName(child.full_name)} en OpenDayCare`,
      html: buildInvitationEmailHtml({
        parentName: name.trim(),
        childFirstName: getFirstName(child.full_name),
        code: finalCode,
        activateUrl,
      }),
    });

    if (sendError) {
      throw sendError;
    }
  } catch (err) {
    await supabase
      .from("invitations")
      .update({ status: "cancelled" })
      .eq("id", insertedId);

    const message = err instanceof Error ? err.message : "Error al enviar el correo";
    return { error: `No se pudo enviar el correo: ${message}` };
  }

  revalidatePath(`/kids/${childId}`);
  revalidatePath("/kids");

  return { ok: true };
}
