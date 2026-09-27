import SidebarWithDialog from "@/components/sidebar-with-dialog";
import KidsView from "@/components/kids/kids-view";
import { children } from "@/lib/data/children";
import { rooms } from "@/lib/data/rooms";
import { getCurrentUserProfile } from "@/lib/current-user";

export default async function KidsPage() {
  const user = await getCurrentUserProfile();

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <SidebarWithDialog activeHref="/kids" user={user} />
      <KidsView initialChildren={children} rooms={rooms} />
    </div>
  );
}
