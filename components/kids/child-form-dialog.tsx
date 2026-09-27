"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { Child } from "@/lib/child-types";
import type { Room } from "@/lib/data/rooms";
import { ALLERGY_OPTIONS, type AllergyTag } from "@/lib/allergies";
import { createChild, updateChild } from "@/lib/actions/children";
import { isValidDate } from "@/lib/child-utils";
import MaskedDateInput from "./add-child/masked-date-input";
import RoomSelect from "./add-child/room-select";

interface ChildFormDialogProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  child?: Child;
}

interface FormErrors {
  fullName?: string;
  birthDate?: string;
  roomId?: string;
}

function displayDateFromIso(iso: string | undefined): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export default function ChildFormDialog({
  open,
  onClose,
  rooms,
  child,
}: ChildFormDialogProps) {
  const isEdit = Boolean(child);

  const [fullName, setFullName] = useState(child?.name ?? "");
  const [birthDate, setBirthDate] = useState(
    displayDateFromIso(child?.birthDateIso)
  );
  const [roomId, setRoomId] = useState(child?.roomId ?? rooms[0]?.id ?? "");
  const [medicalNotes, setMedicalNotes] = useState(child?.medicalNotes ?? "");
  const [selectedAllergies, setSelectedAllergies] = useState<AllergyTag[]>(
    (child?.allergyTags?.filter((tag): tag is AllergyTag =>
      ALLERGY_OPTIONS.some((option) => option.value === tag)
    ) as AllergyTag[]) ?? []
  );
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

  const [state, formAction] = useActionState(async () => {
    const input = {
      fullName,
      birthDate,
      roomId,
      allergies: selectedAllergies.join(","),
      medicalNotes,
    };

    const result = isEdit
      ? await updateChild(child!.id, input)
      : await createChild(input);

    if (result.error) {
      return { error: result.error, success: false };
    }

    return { error: "", success: true };
  }, { error: "", success: false });

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (fullName.trim().length === 0) {
      nextErrors.fullName = "El nombre completo es obligatorio.";
    }

    if (birthDate.trim().length === 0) {
      nextErrors.birthDate = "La fecha de nacimiento es obligatoria.";
    } else if (
      !/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate) ||
      !isValidDate(birthDate)
    ) {
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

    setErrors({});
    startTransition(() => {
      formAction();
    });
  };

  const toggleAllergy = (tag: AllergyTag) => {
    setSelectedAllergies((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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
              {isEdit ? "Editar niño" : "Agregar niño"}
            </span>
            <button
              type="submit"
              disabled={isPending}
              className="text-[15px] font-extrabold text-[#D9583C] hover:opacity-80 disabled:opacity-50"
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
                ALERGIAS
              </label>
              <div className="flex flex-wrap gap-2">
                {ALLERGY_OPTIONS.map((option) => {
                  const selected = selectedAllergies.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleAllergy(option.value)}
                      className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold border-[1.5px] transition-colors ${
                        selected
                          ? "bg-[#3F362E] border-[#3F362E] text-white"
                          : "bg-white border-[#ECE0D0] text-[#6E6359]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
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

            {state.error && (
              <p className="mt-4 text-[13px] font-semibold text-[#D9583C]">
                {state.error}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
