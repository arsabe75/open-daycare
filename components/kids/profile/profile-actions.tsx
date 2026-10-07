"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Child } from "@/lib/child-types";
import type { Room } from "@/lib/data/rooms";
import { archiveChild } from "@/lib/actions/children";
import ChildFormDialog from "../child-form-dialog";

interface ProfileActionsProps {
  child: Child;
  rooms: Room[];
}

export default function ProfileActions({ child, rooms }: ProfileActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);

  async function handleArchive() {
    setIsArchiving(true);
    setArchiveError("");

    const result = await archiveChild(child.id);

    if (result.error) {
      setArchiveError(result.error);
      setIsArchiving(false);
      return;
    }

    router.push("/panel/kids");
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359] font-bold text-[14px] px-4 py-2 rounded-xl cursor-pointer"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => setArchiveOpen(true)}
          className="border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] text-[#D9583C] font-bold text-[14px] px-4 py-2 rounded-xl cursor-pointer"
        >
          Archivar
        </button>
      </div>

      <ChildFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        rooms={rooms}
        child={child}
      />

      {archiveOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(63,54,46,0.45)] px-6"
          onClick={() => setArchiveOpen(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] p-6 shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display font-semibold text-[20px] text-[#3F362E] mb-2">
              ¿Archivar a {child.name}?
            </h2>
            <p className="text-[15px] text-[#6E6359] mb-6">
              El niño desaparecerá del listado y del perfil, pero sus datos
              seguirán guardados.
            </p>

            {archiveError && (
              <p className="mb-4 text-[13px] font-semibold text-[#D9583C]">
                {archiveError}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setArchiveOpen(false)}
                disabled={isArchiving}
                className="px-4 py-2 rounded-xl text-[14px] font-bold text-[#94887B] hover:opacity-80 disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleArchive}
                disabled={isArchiving}
                className="px-4 py-2 rounded-xl bg-[#D9583C] text-white text-[14px] font-extrabold hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {isArchiving ? "Archivando…" : "Sí, archivar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
