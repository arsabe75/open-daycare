import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/current-user";

export default async function StaffPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserProfile();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "staff" && user.role !== "admin") {
    redirect("/familia");
  }

  return <>{children}</>;
}
