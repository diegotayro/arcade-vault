"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthFormState } from "@/app/auth/actions";

type AuthTab = "sign-in" | "sign-up";

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
  const isSignUp = tab === "sign-up";
  const state = isSignUp ? signUpState : signInState;
  const isPending = isSignUp ? isSigningUp : isSigningIn;

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={isSignUp ? "" : "on"}
            onClick={() => setTab("sign-in")}
          >
            INICIAR SESIÓN
          </button>
          <button
            type="button"
            className={isSignUp ? "on" : ""}
            onClick={() => setTab("sign-up")}
          >
            CREAR CUENTA
          </button>
        </div>

        <form
          key={tab}
          noValidate
          action={isSignUp ? signUpAction : signInAction}
        >
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
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder="••••••••"
              required
            />
          </div>

          {state.message && (
            <p
              role={state.status === "error" ? "alert" : "status"}
              className="mono"
              style={{
                fontSize: 12,
                marginTop: 4,
                color:
                  state.status === "error"
                    ? "var(--magenta, #ff4d8d)"
                    : "var(--ink)",
              }}
            >
              {state.message}
            </p>
          )}

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
          <button className="btn ghost" type="button">
            ◆ GOOGLE
          </button>
          <button className="btn ghost" type="button">
            ▣ GITHUB
          </button>
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
