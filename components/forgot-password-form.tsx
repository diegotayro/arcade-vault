"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type AuthFormState } from "@/app/auth/actions";
import { AuthCardHeader } from "@/components/auth-card-header";
import { AuthMessage } from "@/components/auth-message";

const IDLE_STATE: AuthFormState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, action, isPending] = useActionState(
    requestPasswordReset,
    IDLE_STATE,
  );
  const wasSent = state.status === "sent";

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <AuthCardHeader subtitle="RECUPERAR ACCESO" />
        <p className="auth-lead">
          Ingresa el correo de tu cuenta y te enviamos un enlace para elegir una
          contraseña nueva.
        </p>

        <form noValidate action={action}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="jugador@vault.gg"
              disabled={wasSent}
              required
            />
          </div>

          <AuthMessage state={state} />

          <button
            className="btn lg"
            type="submit"
            disabled={isPending || wasSent}
            style={{ width: "100%", marginTop: 8 }}
          >
            {wasSent ? "ENLACE ENVIADO" : "ENVIAR ENLACE"}
          </button>
        </form>

        <Link
          href="/auth"
          className="btn ghost"
          style={{ width: "100%", marginTop: 10 }}
        >
          VOLVER A INICIAR SESIÓN
        </Link>
      </div>
    </div>
  );
}
