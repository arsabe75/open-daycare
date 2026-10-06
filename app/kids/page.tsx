import SidebarWithDialog from "@/components/sidebar-with-dialog";
import KidsView from "@/components/kids/kids-view";
import { getActiveChildrenWithRoom } from "@/lib/data/children";
import { getRooms } from "@/lib/data/rooms";
import { getCurrentUserProfile } from "@/lib/current-user";

export default async function KidsPage() {
  const user = await getCurrentUserProfile();
  const [rooms, children] = await Promise.all([
    getRooms(),
    getActiveChildrenWithRoom(),
  ]);

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <SidebarWithDialog activeHref="/kids" kids={children} rooms={rooms} user={user} />
      <KidsView initialChildren={children} rooms={rooms} />
    </div>
  );
}
