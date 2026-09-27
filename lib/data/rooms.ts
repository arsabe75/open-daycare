"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export interface Room {
  id: string;
  name: string;
}

export async function getRooms(): Promise<Room[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("rooms")
    .select("id, name")
    .order("created_at", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load rooms: ${error.message}`);
  }

  return data ?? [];
}

