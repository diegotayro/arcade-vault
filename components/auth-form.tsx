"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import {
  signIn,
  signInWithProvider,
  signUp,
  type AuthFormState,
} from "@/app/auth/actions";
import { AuthCardHeader } from "@/components/auth-card-header";
import { AuthMessage } from "@/components/auth-message";
import {
  PasswordField,
  usePasswordValidation,
} from "@/components/password-field";

type AuthTab = "sign-in" | "sign-up";

const CALLBACK_ERROR_MESSAGE =
  "No se pudo completar el inicio de sesión. Si abriste el enlace del correo en otro navegador, ábrelo en el mismo donde te registraste.";

const IDLE_STATE: AuthFormState = { status: "idle" };

export function AuthForm() {
  const [tab, setTab] = useState<AuthTab>("sign-in");
  const [signInState, signInAction, isSigningIn] = useActionState(
    signIn,
    IDLE_STATE,
  );
  const [signUpState, signUpAction, isSigningUp] = useActionState(
    signUp,
    IDLE_STATE,
  );
  const passwordValidation = usePasswordValidation();
  const searchParams = useSearchParams();
  const hasCallbackError = searchParams.get("error") === "callback";
  const next = searchParams.get("next") ?? "";
  const isSignUp = tab === "sign-up";
  const formState = isSignUp ? signUpState : signInState;
  const state: AuthFormState =
    formState.status === "idle" && hasCallbackError
      ? { status: "error", message: CALLBACK_ERROR_MESSAGE }
      : formState;
  const isPending = isSignUp ? isSigningUp : isSigningIn;

  const selectTab = (nextTab: AuthTab) => {
    passwordValidation.reset();
    setTab(nextTab);
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <AuthCardHeader subtitle="ACCESO AL SISTEMA · v2.6" />

        <div className="auth-tabs">
          <button
            type="button"
            className={isSignUp ? "" : "on"}
            onClick={() => selectTab("sign-in")}
          >
            INICIAR SESIÓN
          </button>
          <button
            type="button"
            className={isSignUp ? "on" : ""}
            onClick={() => selectTab("sign-up")}
          >
            CREAR CUENTA
          </button>
        </div>

        <form
          key={tab}
          noValidate
          action={isSignUp ? signUpAction : signInAction}
          onSubmit={isSignUp ? passwordValidation.onSubmit : undefined}
        >
          {!isSignUp && <input type="hidden" name="next" value={next} />}
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="jugador@vault.gg"
              required
            />
          </div>
          {isSignUp && (
            <div className="field slide-in">
              <label htmlFor="username">Usuario</label>
              <input
                id="username"
                name="username"
                autoComplete="username"
                placeholder="px_kai"
                minLength={3}
                maxLength={12}
                required
              />
            </div>
          )}
          <PasswordField
            label="Contraseña"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            validation={isSignUp ? passwordValidation : undefined}
          />
          {!isSignUp && (
            <Link href="/auth/forgot" className="auth-link">
              ¿Olvidaste tu contraseña?
            </Link>
          )}

          <AuthMessage state={state} />

          <button
            className="btn lg"
            type="submit"
            disabled={isPending}
            style={{ width: "100%", marginTop: 8 }}
          >
            {isSignUp ? "CREAR CUENTA" : "ENTRAR AL VAULT"}
          </button>
        </form>

        <Link
          href="/games"
          className="btn ghost"
          style={{ width: "100%", marginTop: 10 }}
        >
          JUGAR COMO INVITADO
        </Link>

        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <form action={signInWithProvider.bind(null, "google", next)}>
            <button
              className="btn ghost"
              type="submit"
              style={{ width: "100%" }}
            >
              ◆ GOOGLE
            </button>
          </form>
          <form action={signInWithProvider.bind(null, "github", next)}>
            <button
              className="btn ghost"
              type="submit"
              style={{ width: "100%" }}
            >
              ▣ GITHUB
            </button>
          </form>
        </div>

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 11,
            color: "var(--ink-faint)",
            letterSpacing: "0.1em",
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
