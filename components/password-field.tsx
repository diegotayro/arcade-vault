"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  isValidPassword,
  PASSWORD_HINT,
  PASSWORD_RULE_MESSAGE,
} from "@/lib/auth-rules";

const PASSWORD_FIELD_NAME = "password";

export function usePasswordValidation() {
  const [hasError, setHasError] = useState(false);

  const check = (password: string) => {
    const isValid = isValidPassword(password);
    setHasError(!isValid);
    return isValid;
  };

  return {
    hasError,
    reset: () => setHasError(false),
    // Tras mostrar el error, se revisa en cada cambio hasta que cumpla
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      if (hasError) check(event.target.value);
    },
    onBlur: (event: ChangeEvent<HTMLInputElement>) => check(event.target.value),
    // Bloquea el envío: no se llama a la Server Action con una contraseña inválida
    onSubmit: (event: FormEvent<HTMLFormElement>) => {
      const password = new FormData(event.currentTarget).get(
        PASSWORD_FIELD_NAME,
      );
      if (!check(String(password ?? ""))) event.preventDefault();
    },
  };
}

type PasswordValidation = ReturnType<typeof usePasswordValidation>;

type PasswordFieldProps = {
  label: string;
  autoComplete: "new-password" | "current-password";
  validation?: PasswordValidation;
};

export function PasswordField({
  label,
  autoComplete,
  validation,
}: PasswordFieldProps) {
  const messageId = `${PASSWORD_FIELD_NAME}-message`;
  const hasError = validation?.hasError ?? false;

  return (
    <div className="field">
      <label htmlFor={PASSWORD_FIELD_NAME}>{label}</label>
      <input
        id={PASSWORD_FIELD_NAME}
        name={PASSWORD_FIELD_NAME}
        type="password"
        autoComplete={autoComplete}
        placeholder="••••••••"
        required
        aria-invalid={hasError}
        aria-describedby={validation ? messageId : undefined}
        onChange={validation?.onChange}
        onBlur={validation?.onBlur}
      />
      {validation && (
        <p
          id={messageId}
          role={hasError ? "alert" : undefined}
          className={"mono field-hint" + (hasError ? " error" : "")}
        >
          {hasError ? PASSWORD_RULE_MESSAGE : PASSWORD_HINT}
        </p>
      )}
    </div>
  );
}
