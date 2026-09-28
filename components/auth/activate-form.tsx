"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { activateAccount, type ActivationState } from "@/lib/actions/activation";
import { createClient } from "@/utils/supabase/client";
import { deriveAvatar } from "@/lib/child-utils";
import { relationLabelFromDb } from "@/lib/parent-utils";
import type { InvitationInfo } from "@/lib/child-types";
import AuthField from "./auth-field";
import AuthSubmit from "./auth-submit";

interface ActivateFormProps {
  initialCode: string;
  initialInvitation: InvitationInfo | null;
  isInvalid: boolean;
}

function mapToInvitationInfo(data: Record<string, unknown>): InvitationInfo {
  return {
    childFullName: String(data.child_full_name),
    roomName: String(data.room_name),
    daycareId: String(data.daycare_id),
    fullName: String(data.full_name),
    email: String(data.email),
    relationship: data.relationship as InvitationInfo["relationship"],
    status: data.status as InvitationInfo["status"],
    expiresAt: String(data.expires_at),
  };
}

export default function ActivateForm({
  initialCode,
  initialInvitation,
  isInvalid,
}: ActivateFormProps) {
  const [state, formAction] = useActionState<ActivationState, FormData>(
    activateAccount,
    {},
  );
  const [code, setCode] = useState(initialCode);
  const [invitation, setInvitation] = useState<InvitationInfo | null>(
    initialInvitation,
  );
  const [lookupError, setLookupError] = useState<string | null>(
    isInvalid ? "Código inválido o vencido" : null,
  );

  const browserSupabase = createClient();

  useEffect(() => {
    if (code.length !== 5) {
      setInvitation(null);
      setLookupError(null);
      return;
    }

    let cancelled = false;

    browserSupabase
      .rpc("invitation_by_code", { p_code: code })
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error || !data) {
          setInvitation(null);
          setLookupError("Código inválido o vencido");
          return;
        }

        if (
          data.status !== "pending" ||
          new Date(String(data.expires_at)) <= new Date()
        ) {
          setInvitation(null);
          setLookupError("El código ya no está vigente");
          return;
        }

        setInvitation(mapToInvitationInfo(data));
        setLookupError(null);
      });

    return () => {
      cancelled = true;
    };
  }, [code, browserSupabase]);

  const displayEmail = invitation?.email ?? "";
  const childAvatar = invitation
    ? deriveAvatar(invitation.childFullName, 0)
    : null;

  return (
    <div className="w-full max-w-[440px]">
      <div
        className="w-[58px] h-[58px] rounded-[18px] flex items-center justify-center mb-[22px] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]"
        style={{
          background: "linear-gradient(155deg, #F8C3A8, #F2937A)",
        }}
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </div>

      <h1 className="font-display font-semibold text-[32px] leading-[1.15] text-[#3F362E] m-0 mb-2">
        Bienvenida a OpenDayCare
      </h1>
      <p className="text-[15.5px] leading-[1.55] text-[#94887B] m-0 mb-[26px]">
        Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
        activar la cuenta.
      </p>

      {invitation && (
        <div className="flex items-center gap-[14px] bg-white border-[1.5px] border-[#EADFD0] rounded-2xl py-3.5 px-4 mb-[22px]">
          <div
            className="w-11 h-11 rounded-full font-display font-semibold text-[19px] flex items-center justify-center flex-none"
            style={{ backgroundColor: childAvatar?.bg, color: childAvatar?.color }}
          >
            {childAvatar?.initial}
          </div>
          <div>
            <div className="text-[13px] text-[#94887B]">
              Te invitaron a seguir a
            </div>
            <div className="font-display font-semibold text-[17px] text-[#3F362E]">
              {invitation.childFullName} · {invitation.roomName}
            </div>
          </div>
        </div>
      )}

      {lookupError && !invitation && (
        <div className="bg-[#FDE8E4] border-[1.5px] border-[#F2A78E] rounded-[14px] p-4 mb-[22px] text-[14px] text-[#D9583C]">
          {lookupError}
        </div>
      )}

      <form action={formAction}>
        <input type="hidden" name="email" value={displayEmail} />

        <div className="mb-[18px]">
          <label
            htmlFor="code"
            className="block text-[12px] font-bold tracking-[0.7px] text-[#94887B] mb-2 uppercase"
          >
            CÓDIGO DE INVITACIÓN
          </label>
          <input
            id="code"
            name="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={5}
            placeholder="ABCDE"
            className="w-full px-4 py-3.5 rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[18px] font-display font-bold tracking-[3px] text-[#3F362E]"
          />
        </div>

        <div className="mb-[18px]">
          <label
            htmlFor="email"
            className="block text-[12px] font-bold tracking-[0.7px] text-[#94887B] mb-2 uppercase"
          >
            EMAIL
          </label>
          <input
            id="email"
            type="email"
            value={displayEmail}
            readOnly
            className="w-full px-4 py-3.5 rounded-[14px] border-[1.5px] border-[#EADFD0] bg-[#F7F4EF] text-[15px] text-[#94887B]"
          />
          {invitation && (
            <p className="text-[12px] text-[#94887B] mt-1.5">
              Parentesco: {relationLabelFromDb(invitation.relationship)}
            </p>
          )}
        </div>

        <AuthField
          label="CREAR CONTRASEÑA"
          name="password"
          type="password"
          inputClassName="!border-[#F2A78E]"
          className="mb-[18px]"
        />

        <label className="flex items-start gap-3 bg-[#FBF1D6] rounded-[14px] py-3.5 px-4 mb-6 cursor-pointer">
          <input
            type="checkbox"
            name="photo-consent"
            defaultChecked
            className="peer sr-only"
          />
          <span className="flex-none w-6 h-6 rounded-lg border border-[#EADFD0] bg-white flex items-center justify-center mt-0.5 peer-checked:bg-[#5FB97E] peer-checked:border-[#5FB97E]">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-0 peer-checked:opacity-100"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="text-[14px] text-[#8A7234] leading-[1.45]">
            Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro
            de la app.
          </span>
        </label>

        {state.error && (
          <div className="text-[13px] text-[#D9583C] mb-[14px]">
            {state.error}
          </div>
        )}

        <AuthSubmit type="submit">Activar mi cuenta</AuthSubmit>
      </form>

      <p className="text-center mt-[22px] text-[#94887B] text-[14.5px]">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-[#C5503A] font-extrabold">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
