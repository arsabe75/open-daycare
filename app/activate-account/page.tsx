import type { Metadata } from "next";
import Link from "next/link";
import AuthField from "@/components/auth/auth-field";
import AuthSubmit from "@/components/auth/auth-submit";

export const metadata: Metadata = {
  title: "Activar tu cuenta · OpenDayCare",
};

export default function ActivateAccountPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF4EC] p-10">
      <div className="w-full max-w-[440px]">
        {/* Sun icon */}
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

        {/* Invitation card */}
        <div className="flex items-center gap-[14px] bg-white border-[1.5px] border-[#EADFD0] rounded-2xl py-3.5 px-4 mb-[22px]">
          <div className="w-11 h-11 rounded-full bg-[#A9D9E8] text-[#1F7A93] font-display font-semibold text-[19px] flex items-center justify-center flex-none">
            M
          </div>
          <div>
            <div className="text-[13px] text-[#94887B]">
              Te invitaron a seguir a
            </div>
            <div className="font-display font-semibold text-[17px] text-[#3F362E]">
              Mateo · Sala Soles
            </div>
          </div>
        </div>

        <AuthField
          label="CÓDIGO DE INVITACIÓN"
          name="code"
          type="text"
          defaultValue="7K4P9"
          inputClassName="font-display font-bold text-[18px] tracking-[3px]"
          className="mb-[18px]"
        />

        <AuthField
          label="EMAIL"
          name="email"
          type="email"
          defaultValue="lucia.fernandez@gmail.com"
          className="mb-[18px]"
        />

        <AuthField
          label="CREAR CONTRASEÑA"
          name="password"
          type="password"
          defaultValue="contraseña"
          inputClassName="!border-[#F2A78E]"
          className="mb-[18px]"
        />

        {/* Authorization checkbox */}
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

        <AuthSubmit href="/">Activar mi cuenta</AuthSubmit>

        <p className="text-center mt-[22px] text-[#94887B] text-[14.5px]">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-[#C5503A] font-extrabold">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
