import { redirect } from "next/navigation";
import SidebarWithDialog from "@/components/sidebar-with-dialog";
import KidsView from "@/components/kids/kids-view";
import { getActiveChildrenWithRoom } from "@/lib/data/children";
import { getRooms } from "@/lib/data/rooms";
import { getCurrentUserProfile } from "@/lib/current-user";

export default async function StaffKidsPage() {
  const user = await getCurrentUserProfile();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "staff" && user.role !== "admin") {
    redirect("/familia");
  }

  const [rooms, children] = await Promise.all([
    getRooms(),
    getActiveChildrenWithRoom(),
  ]);

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <SidebarWithDialog activeHref="/panel/kids" kids={children} rooms={rooms} user={user} />
      <KidsView initialChildren={children} rooms={rooms} />
    </div>
  );
}
