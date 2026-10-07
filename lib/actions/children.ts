"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { parseAllergyTags } from "@/lib/allergies";
import { isValidDate, parseDisplayDate } from "@/lib/child-utils";

export interface ChildFormInput {
  fullName: string;
  birthDate: string; // DD/MM/AAAA
  roomId: string;
  allergies: string; // comma-separated English tags
  medicalNotes: string;
}

function isoDateFromDisplay(value: string): string | null {
  const date = parseDisplayDate(value.trim());
  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function validateInput(input: ChildFormInput): { error?: string } {
  const fullName = input.fullName.trim();
  if (fullName.length === 0) {
    return { error: "El nombre completo es obligatorio." };
  }

  const birthDate = input.birthDate.trim();
  if (birthDate.length === 0) {
    return { error: "La fecha de nacimiento es obligatoria." };
  }
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate) || !isValidDate(birthDate)) {
    return { error: "Ingresá una fecha válida (DD/MM/AAAA)." };
  }

  const roomId = input.roomId.trim();
  if (roomId.length === 0) {
    return { error: "La sala es obligatoria." };
  }

  return {};
}

async function validateRoomExists(roomId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", roomId)
    .maybeSingle();

  return !error && !!data;
}

export async function createChild(
  input: ChildFormInput
): Promise<{ error?: string }> {
  const validation = validateInput(input);
  if (validation.error) return validation;

  const isoDate = isoDateFromDisplay(input.birthDate);
  if (!isoDate) return { error: "Fecha de nacimiento inválida." };

  const roomExists = await validateRoomExists(input.roomId);
  if (!roomExists) return { error: "La sala seleccionada no existe." };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("children").insert({
    full_name: input.fullName.trim(),
    birth_date: isoDate,
    room_id: input.roomId,
    allergy_tags: parseAllergyTags(input.allergies),
    medical_notes: input.medicalNotes.trim() || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/panel/kids");
  return {};
}

export async function updateChild(
  id: string,
  input: ChildFormInput
): Promise<{ error?: string }> {
  const validation = validateInput(input);
  if (validation.error) return validation;

  const isoDate = isoDateFromDisplay(input.birthDate);
  if (!isoDate) return { error: "Fecha de nacimiento inválida." };

  const roomExists = await validateRoomExists(input.roomId);
  if (!roomExists) return { error: "La sala seleccionada no existe." };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from("children")
    .update({
      full_name: input.fullName.trim(),
      birth_date: isoDate,
      room_id: input.roomId,
      allergy_tags: parseAllergyTags(input.allergies),
      medical_notes: input.medicalNotes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/panel/kids");
  revalidatePath(`/panel/kids/${id}`);
  return {};
}

export async function archiveChild(id: string): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from("children")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/panel/kids");
  revalidatePath(`/panel/kids/${id}`);
  return {};
}
