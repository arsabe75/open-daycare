"use client";

import { useEffect, useState } from "react";
import {
  generateInviteCode,
  getFirstName,
  isValidEmail,
} from "@/lib/parent-utils";
import type { ParentRelation } from "@/lib/data/children";

interface LinkParentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (name: string, relation: ParentRelation) => void;
  childName: string;
}

interface FormErrors {
  name?: string;
  email?: string;
}

const RELATIONS: { value: ParentRelation; label: string }[] = [
  { value: "mom", label: "Mamá" },
  { value: "dad", label: "Papá" },
  { value: "guardian", label: "Tutor/a" },
];

export default function LinkParentDialog({
  isOpen,
  onClose,
  onLink,
  childName,
}: LinkParentDialogProps) {
  const firstName = getFirstName(childName);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState<ParentRelation>("mom");
  const [inviteCode] = useState(() => generateInviteCode());
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit() {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = "El nombre es obligatorio";
    }

    if (!email.trim()) {
      nextErrors.email = "El email es obligatorio";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Ingresá un email válido";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onLink(name.trim(), relation);
  }

  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#3F362E]/60 px-6 py-10"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[480px] rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden">
        <div className="flex items-center justify-between px-6.5 py-5 border-b border-[#ECE0D0]">
          <div>
            <div className="font-display font-semibold text-[18px] text-[#3F362E]">
              Vincular padre
            </div>
            <div className="text-[13px] text-[#A89A8B]">a {firstName}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-[34px] h-[34px] rounded-[10px] bg-[#F0E6D8] text-[#94887B] flex items-center justify-center cursor-pointer"
            aria-label="Cerrar"
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
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6.5 py-[22px]">
          <div className="flex gap-[11px] rounded-[14px] bg-[#E3ECFB] p-4 mb-5">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4E72C8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-none mt-[1px]"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span className="text-[13.5px] text-[#3F5694] leading-[1.45]">
              Le enviaremos un correo con un código para que active su cuenta.
              Solo verá el feed de {firstName}.
            </span>
          </div>

          <div className="text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-2">
            NOMBRE DEL PADRE/MADRE
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Diego Fernández"
            className="w-full px-4 py-[13px] rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-[#3F362E] mb-[18px]"
          />
          {errors.name && (
            <div className="text-[13px] text-[#D9583C] mt-[-14px] mb-[14px]">
              {errors.name}
            </div>
          )}

          <div className="text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-2">
            EMAIL
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="w-full px-4 py-[13px] rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-[#3F362E] mb-[18px]"
          />
          {errors.email && (
            <div className="text-[13px] text-[#D9583C] mt-[-14px] mb-[14px]">
              {errors.email}
            </div>
          )}

          <div className="text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-[10px]">
            PARENTESCO
          </div>
          <div className="flex gap-[9px] mb-5">
            {RELATIONS.map(({ value, label }) => {
              const selected = relation === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRelation(value)}
                  className={`flex-1 py-[11px] rounded-full border-[1.5px] font-extrabold text-[14px] cursor-pointer transition-colors ${
                    selected
                      ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]"
                      : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="bg-[#FBF1D6] border-[1.5px] border-dashed border-[#E6D08A] rounded-[16px] p-[18px] text-center mb-5">
            <div className="text-[12px] font-extrabold tracking-[0.7px] text-[#A88526] mb-2">
              CÓDIGO DE INVITACIÓN
            </div>
            <div className="font-display font-semibold text-[34px] tracking-[7px] text-[#8A7234]">
              {inviteCode}
            </div>
            <div className="text-[13px] text-[#A88526] mt-1.5">Vence en 7 días</div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center justify-center gap-[9px] w-full py-[14px] rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[15.5px] shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] cursor-pointer"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4z" />
              <path d="M22 2 11 13" />
            </svg>
            Enviar invitación
          </button>
        </div>
      </div>
    </div>
  );
}
