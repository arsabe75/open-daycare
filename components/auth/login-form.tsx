"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";
import AuthField from "./auth-field";
import AuthSubmit from "./auth-submit";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, {});

  return (
    <form action={formAction}>
      <AuthField
        label="EMAIL"
        name="email"
        type="email"
        className="mb-[18px]"
      />

      <AuthField
        label="CONTRASEÑA"
        name="password"
        type="password"
        placeholder="••••••••"
      />

      <div className="text-right mt-2.5 mb-5">
        <Link
          href="/forgot-password"
          className="text-[#C5503A] text-[13.5px] font-bold"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {state.error && (
        <p className="text-[#C5503A] text-[14px] mb-4 font-semibold">
          {state.error}
        </p>
      )}

      <AuthSubmit type="submit">
        {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
      </AuthSubmit>

      <p className="text-center mt-6 text-[#94887B] text-[14.5px]">
        ¿Te invitó la guardería?{" "}
        <Link
          href="/activate-account"
          className="text-[#C5503A] font-extrabold"
        >
          Activá tu cuenta
        </Link>
      </p>
    </form>
  );
}
