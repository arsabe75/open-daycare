"use client";

import { useEffect, useRef, useState } from "react";
import { Child } from "@/lib/data/children";
import { Room } from "@/lib/data/rooms";
import { buildChild, isValidDate } from "@/lib/child-utils";
import MaskedDateInput from "./masked-date-input";
import RoomSelect from "./room-select";

interface AddChildDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (child: Child) => void;
  rooms: Room[];
  existingChildren: Child[];
}

interface FormErrors {
  fullName?: string;
  birthDate?: string;
  roomId?: string;
}

export default function AddChildDialog({
  open,
  onClose,
  onAdd,
  rooms,
  existingChildren,
}: AddChildDialogProps) {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      firstInputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (fullName.trim().length === 0) {
      nextErrors.fullName = "El nombre completo es obligatorio.";
    }

    if (birthDate.trim().length === 0) {
      nextErrors.birthDate = "La fecha de nacimiento es obligatoria.";
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate) || !isValidDate(birthDate)) {
      nextErrors.birthDate = "Ingresá una fecha válida (DD/MM/AAAA).";
    }

    if (!roomId) {
      nextErrors.roomId = "La sala es obligatoria.";
    }

    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const roomName = rooms.find((room) => room.id === roomId)?.name ?? "";
    const newChild = buildChild(
      {
        fullName,
        birthDate,
        roomId,
        allergies,
        medicalNotes,
      },
      roomName,
      existingChildren
    );

    onAdd(newChild);
    onClose();
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(63,54,46,0.45)] px-6 py-10"
      onMouseDown={handleBackdropClick}
    >
      <div className="w-full max-w-[520px] rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-[26px] py-5 border-b border-[#ECE0D0]">
            <button
              type="button"
              onClick={onClose}
              className="text-[15px] font-bold text-[#94887B] hover:opacity-80"
            >
              Cancelar
            </button>
            <span className="font-display font-semibold text-[18px] text-[#3F362E]">
              Agregar niño
            </span>
            <button
              type="submit"
              className="text-[15px] font-extrabold text-[#D9583C] hover:opacity-80"
            >
              Guardar
            </button>
          </div>

          <div className="px-[26px] py-6">
            <div className="mb-[18px]">
              <label className="block text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-2">
                NOMBRE COMPLETO
              </label>
              <input
                ref={firstInputRef}
                type="text"
                placeholder="Ej. Martina López"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-[13px] rounded-[14px] border-[1.5px] bg-white text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
                style={{ borderColor: errors.fullName ? "#D9583C" : "#EADFD0" }}
              />
              {errors.fullName && (
                <p className="mt-1.5 text-[12px] font-semibold text-[#D9583C]">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="flex gap-[14px] mb-[18px]">
              <div className="flex-1">
                <label className="block text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-2">
                  FECHA DE NACIMIENTO
                </label>
                <MaskedDateInput
                  value={birthDate}
                  onChange={setBirthDate}
                  hasError={!!errors.birthDate}
                />
                {errors.birthDate && (
                  <p className="mt-1.5 text-[12px] font-semibold text-[#D9583C]">
                    {errors.birthDate}
                  </p>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-2">
                  SALA
                </label>
                <RoomSelect
                  value={roomId}
                  onChange={setRoomId}
                  rooms={rooms}
                  hasError={!!errors.roomId}
                />
                {errors.roomId && (
                  <p className="mt-1.5 text-[12px] font-semibold text-[#D9583C]">
                    {errors.roomId}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-[18px]">
              <label className="block text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-2">
                ALERGIAS (ETIQUETAS)
              </label>
              <input
                type="text"
                placeholder="Ej. Maní, Lactosa"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full px-4 py-[13px] rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-2">
                NOTAS MÉDICAS
              </label>
              <textarea
                placeholder="Indicaciones, medicación, contactos…"
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                className="w-full min-h-[90px] resize-y px-4 py-[13px] rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] leading-relaxed focus:outline-none"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
