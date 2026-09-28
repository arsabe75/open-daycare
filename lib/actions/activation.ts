"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { isValidEmail } from "@/lib/parent-utils";

export type ActivationState = {
  error?: string;
};

export async function activateAccount(
  _prevState: ActivationState,
  formData: FormData,
): Promise<ActivationState> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const code = ((formData.get("code") as string | null) ?? "")
    .trim()
    .toUpperCase();
  const email = ((formData.get("email") as string | null) ?? "")
    .trim()
    .toLowerCase();
  const password = (formData.get("password") as string | null) ?? "";

  if (code.length !== 5) {
    return { error: "El código de invitación debe tener 5 caracteres" };
  }

  if (!email || !isValidEmail(email)) {
    return { error: "El email no es válido" };
  }

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const { data: invitation, error: lookupError } = await supabase
    .rpc("invitation_by_code", { p_code: code })
    .single();

  if (lookupError || !invitation) {
    return { error: "El código de invitación no es válido" };
  }

  if (invitation.status !== "pending") {
    return { error: "El código de invitación ya no está vigente" };
  }

  if (new Date(invitation.expires_at) <= new Date()) {
    return { error: "El código de invitación expiró" };
  }

  if (invitation.email.toLowerCase() !== email) {
    return { error: "El email no coincide con la invitación" };
  }

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        daycare_id: invitation.daycare_id,
        role: "parent",
        full_name: invitation.full_name,
        invitation_id: invitation.id,
      },
    },
  });

  if (signUpError) {
    return { error: mapSignUpError(signUpError.message) };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

function mapSignUpError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("password") && lower.includes("6")) {
    return "La contraseña debe tener al menos 6 caracteres";
  }

  if (lower.includes("user already registered")) {
    return "Ya existe una cuenta con este email";
  }

  if (lower.includes("unable to validate email")) {
    return "El email no es válido";
  }

  return message;
}
