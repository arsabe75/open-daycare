import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import ActivateForm from "@/components/auth/activate-form";
import type { InvitationInfo } from "@/lib/child-types";

export const metadata: Metadata = {
  title: "Activar tu cuenta · OpenDayCare",
};

interface ActivateAccountPageProps {
  searchParams: Promise<{ code?: string }>;
}

function mapDataToInvitationInfo(
  data: Record<string, unknown>,
): InvitationInfo {
  return {
    childFullName: String(data.child_full_name),
    roomName: String(data.room_name),
    daycareId: String(data.daycare_id),
    fullName: String(data.full_name),
    email: String(data.email),
    relationship: data.relationship as InvitationInfo["relationship"],
    status: data.status as InvitationInfo["status"],
    expiresAt: String(data.expires_at),
  };
}

export default async function ActivateAccountPage({
  searchParams,
}: ActivateAccountPageProps) {
  const params = await searchParams;
  const code = (params.code ?? "").trim().toUpperCase();

  let invitation: InvitationInfo | null = null;
  let isInvalid = false;

  if (code.length === 5) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: rawData, error } = await supabase
      .rpc("invitation_by_code", { p_code: code })
      .single();

    const data = rawData as Record<string, unknown> | null;

    if (
      error ||
      !data ||
      data.status !== "pending" ||
      new Date(String(data.expires_at)) <= new Date()
    ) {
      isInvalid = true;
    } else {
      invitation = mapDataToInvitationInfo(data);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF4EC] p-10">
      <ActivateForm
        initialCode={code}
        initialInvitation={invitation}
        isInvalid={isInvalid}
      />
    </div>
  );
}
