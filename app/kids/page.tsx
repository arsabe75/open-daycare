import Sidebar from "@/components/sidebar";
import KidsView from "@/components/kids/kids-view";
import { children } from "@/lib/data/children";
import { rooms } from "@/lib/data/rooms";

export default function KidsPage() {
  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar activeHref="/kids" />
      <KidsView initialChildren={children} rooms={rooms} />
    </div>
  );
}
