"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import type { Child } from "@/lib/child-types";
import { mapChildToViewModel, type ChildRow } from "@/lib/child-utils";

export type {
  Avatar,
  Child,
  LinkedParent,
  ParentRelation,
  ParentStatus,
} from "@/lib/child-types";

export async function getActiveChildrenWithRoom(): Promise<Child[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("children")
    .select("*, rooms(name)")
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load children: ${error.message}`);
  }

  return (data as ChildRow[] | null)?.map(mapChildToViewModel) ?? [];
}

export async function getActiveChildById(id: string): Promise<Child | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("children")
    .select("*, rooms(name)")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error || !data) {
    return null;
  }

  return mapChildToViewModel(data as ChildRow);
}

