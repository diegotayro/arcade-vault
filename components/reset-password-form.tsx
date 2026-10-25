"use client";

import { useActionState } from "react";
import { updatePassword, type AuthFormState } from "@/app/auth/actions";
import { AuthCardHeader } from "@/components/auth-card-header";
import { AuthMessage } from "@/components/auth-message";
import { PASSWORD_HINT } from "@/lib/auth-rules";

const IDLE_STATE: AuthFormState = { status: "idle" };

export function ResetPasswordForm() {
  const [state, action, isPending] = useActionState(updatePassword, IDLE_STATE);

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <AuthCardHeader subtitle="NUEVA CONTRASEÑA" />
        <p className="auth-lead">Elige tu nueva contraseña.</p>

        <form noValidate action={action}>
          <div className="field">
            <label htmlFor="password">Contraseña nueva</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
            />
            <p className="mono field-hint">{PASSWORD_HINT}</p>
          </div>
          <div className="field">
            <label htmlFor="confirm">Repite la contraseña</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
            />
          </div>

          <AuthMessage state={state} />

          <button
            className="btn lg"
            type="submit"
            disabled={isPending}
            style={{ width: "100%", marginTop: 8 }}
          >
            GUARDAR CONTRASEÑA
          </button>
        </form>
      </div>
    </div>
  );
}
