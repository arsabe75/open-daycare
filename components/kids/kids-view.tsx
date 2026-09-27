"use client";

import { useMemo, useState } from "react";
import type { Child } from "@/lib/child-types";
import type { Room } from "@/lib/data/rooms";
import SearchBox from "./search-box";
import ChildCard from "./child-card";
import ChildFormDialog from "./child-form-dialog";

interface KidsViewProps {
  initialChildren: Child[];
  rooms: Room[];
}

export default function KidsView({ initialChildren, rooms }: KidsViewProps) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  const query = search.trim().toLowerCase();

  const filteredChildren = useMemo(() => {
    if (!query) return initialChildren;
    return initialChildren.filter((child) =>
      child.name.toLowerCase().includes(query)
    );
  }, [initialChildren, query]);

  const groups = useMemo(() => {
    return rooms
      .map((room) => ({
        room,
        children: filteredChildren.filter((child) => child.roomId === room.id),
      }))
      .filter((group) => !query || group.children.length > 0);
  }, [rooms, filteredChildren, query]);

  const openDialog = () => {
    setDialogKey((prev) => prev + 1);
    setDialogOpen(true);
  };

  return (
    <main className="flex-1 min-w-0 h-screen overflow-y-auto">
      <div className="max-w-220 w-full mx-auto px-10 pt-8.5 pb-20">
        <div className="flex items-end justify-between gap-4 mb-5.5">
          <div>
            <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#D9583C] mb-1">
              GESTIÓN
            </div>
            <h1 className="font-display font-semibold text-[30px] text-[#3F362E] m-0">
              Niños
            </h1>
          </div>
          <button
            type="button"
            onClick={openDialog}
            className="flex items-center gap-2 px-4.5 py-2.75 rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)] cursor-pointer"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Agregar niño
          </button>
        </div>

        <div className="mb-5.5">
          <SearchBox value={search} onChange={setSearch} />
        </div>

        <div className="flex flex-col gap-6">
          {groups.map(({ room, children }) => (
            <section key={room.id}>
              <div className="flex items-center gap-3 mb-3.5">
                <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#3F362E]">
                  SALA {room.name.toUpperCase()}
                </span>
                <span className="text-[13px] text-[#A89A8B]">
                  {children.length} {children.length === 1 ? "niño" : "niños"}
                </span>
                <span className="flex-1 h-px bg-[#E7DAC8]" />
              </div>

              {children.length > 0 ? (
                <div className="grid grid-cols-2 gap-3.5">
                  {children.map((child) => (
                    <ChildCard key={child.id} child={child} />
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-[#A89A8B] py-2">
                  No hay niños en esta sala.
                </p>
              )}
            </section>
          ))}
        </div>
      </div>

      <ChildFormDialog
        key={dialogKey}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        rooms={rooms}
      />
    </main>
  );
}
