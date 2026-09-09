"use client";

import { useEffect, useRef, useState } from "react";
import { Room } from "@/lib/data/rooms";

interface RoomSelectProps {
  value: string;
  onChange: (roomId: string) => void;
  rooms: Room[];
  hasError?: boolean;
}

export default function RoomSelect({
  value,
  onChange,
  rooms,
  hasError = false,
}: RoomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedRoom = rooms.find((room) => room.id === value) ?? rooms[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSelect = (roomId: string) => {
    onChange(roomId);
    setOpen(false);
  };

  const borderColor = hasError ? "#D9583C" : "#EADFD0";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center gap-2 px-4 py-[13px] rounded-[14px] border-[1.5px] bg-white text-[15px] text-[#3F362E] font-bold focus:outline-none"
        style={{ borderColor }}
      >
        {selectedRoom?.name ?? "Seleccionar sala"}
        <span className="flex-1" />
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#B0A290"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="mt-1.5 w-full rounded-[14px] border border-[#EADFD0] bg-white shadow-[0_8px_18px_-8px_rgba(63,54,46,.2)] overflow-hidden">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => handleSelect(room.id)}
              className={`w-full text-left px-4 py-2.5 text-[15px] font-semibold text-[#3F362E] hover:bg-[#F6ECDF] ${room.id === value ? "bg-[#FBE3D8]" : ""}`}
            >
              {room.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
