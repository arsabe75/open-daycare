import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type CurrentUserProfile = {
  fullName: string;
  role: "staff" | "parent" | "admin";
  daycareName: string;
};

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("full_name, role, daycares(name)")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  const daycareName = Array.isArray(profile.daycares)
    ? profile.daycares[0]?.name ?? ""
    : (profile.daycares as { name?: string })?.name ?? "";

  return {
    fullName: profile.full_name,
    role: profile.role as CurrentUserProfile["role"],
    daycareName,
  };
}
