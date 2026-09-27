import Link from "next/link";
import { notFound } from "next/navigation";
import SidebarWithDialog from "@/components/sidebar-with-dialog";
import ChildAvatar from "@/components/kids/child-avatar";
import AllergyAlert from "@/components/kids/profile/allergy-alert";
import ChildDetails from "@/components/kids/profile/child-details";
import LinkedParents from "@/components/kids/profile/linked-parents";
import { getChildById } from "@/lib/data/children";
import { getCurrentUserProfile } from "@/lib/current-user";

export default async function KidProfilePage({
  params,
}: PageProps<"/kids/[id]">) {
  const { id } = await params;
  const child = getChildById(id);
  const user = await getCurrentUserProfile();

  if (!child) {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <SidebarWithDialog activeHref="/kids" user={user} />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-205 w-full mx-auto px-10 pt-8.5 pb-20">
          <Link
            href="/kids"
            className="flex items-center gap-1.75 text-[#94887B] font-bold text-[14px] mb-5"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver a Niños
          </Link>

          <div className="flex gap-6.5 items-start flex-wrap">
            <div className="flex-1 min-w-75 flex flex-col gap-4.5">
              <div className="flex items-center gap-4.5">
                <ChildAvatar avatar={child.avatar} size="profile" />
                <div className="flex-1">
                  <h1 className="font-display font-semibold text-[28px] text-[#3F362E] m-0">
                    {child.name}
                  </h1>
                  <p className="mt-1 text-[#94887B] text-[15px]">
                    {child.age} años · Sala {child.room}
                  </p>
                </div>
                <Link
                  href="/kids/new"
                  className="border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359] font-bold text-[14px] px-4 py-2 rounded-xl"
                >
                  Editar
                </Link>
              </div>

              {child.allergyNotes && <AllergyAlert notes={child.allergyNotes} />}

              <ChildDetails child={child} />
            </div>

            <div className="w-75 flex-none flex flex-col gap-3.5">
              <Link
                href="/daily-summary"
                className="flex items-center justify-center gap-2.25 w-full py-3.25 rounded-[14px] bg-[#3F362E] text-white font-extrabold text-[15px]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
                Resumen del día
              </Link>

              <LinkedParents child={child} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
