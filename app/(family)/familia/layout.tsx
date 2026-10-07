import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/current-user";

export default async function FamilyPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserProfile();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "staff" || user.role === "admin") {
    redirect("/panel");
  }

  return <>{children}</>;
}
