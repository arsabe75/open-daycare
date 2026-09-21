import SidebarWithDialog from "@/components/sidebar-with-dialog";
import KidsView from "@/components/kids/kids-view";
import { children } from "@/lib/data/children";
import { rooms } from "@/lib/data/rooms";

export default function KidsPage() {
  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <SidebarWithDialog activeHref="/kids" />
      <KidsView initialChildren={children} rooms={rooms} />
    </div>
  );
}
