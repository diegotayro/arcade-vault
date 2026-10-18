"use client";

import { useActionState, useState } from "react";
import { sendContactMessage } from "@/app/about/actions";
import { TerminalSuccess } from "@/components/about/terminal-success";
import { CONTACT_LIMITS, type ContactResult } from "@/lib/contact";

const SHAKE_DURATION_MS = 400;

const ERROR_MESSAGES: Record<Extract<ContactResult, { status: "error" }>["reason"], string> = {
  invalid: "Revisa los datos: usa un correo válido y no superes los límites de longitud.",
  "send-failed": "No pudimos enviar tu mensaje. Inténtalo de nuevo más tarde.",
};

const EMPTY_FIELDS = { name: "", email: "", message: "" };

function ContactFormBody({ onReset }: { onReset: () => void }) {
  const [result, formAction, isPending] = useActionState(sendContactMessage, null);
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [isShaking, setIsShaking] = useState(false);

  const updateField = (field: keyof typeof EMPTY_FIELDS) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const hasEmptyField = Object.values(fields).some((value) => !value.trim());
    if (!hasEmptyField) return;
    event.preventDefault();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), SHAKE_DURATION_MS);
  };

  return (
    <form
      className={`contact-form${isShaking ? " shake" : ""}`}
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
    >
      {result?.status === "success" ? (
        <TerminalSuccess senderName={result.senderName} onReset={onReset} />
      ) : (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input
              id="contact-name" name="name" placeholder="px_kai" autoComplete="name"
              maxLength={CONTACT_LIMITS.name} value={fields.name} onChange={updateField("name")}
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email" name="email" type="email" placeholder="jugador@vault.gg" autoComplete="email"
              maxLength={CONTACT_LIMITS.email} value={fields.email} onChange={updateField("email")}
            />
          </div>
          <div className="field">
            <label htmlFor="contact-message">MENSAJE</label>
            <textarea
              id="contact-message" name="message" rows={5} placeholder="Cuéntanos qué tienes en mente…"
              maxLength={CONTACT_LIMITS.message} value={fields.message} onChange={updateField("message")}
            />
          </div>
          <div className="contact-honeypot" aria-hidden="true">
            <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
          {result?.status === "error" && (
            <p className="contact-error" role="alert">{ERROR_MESSAGES[result.reason]}</p>
          )}
          <button className="btn xl press" type="submit" style={{ width: "100%" }} disabled={isPending}>
            {isPending ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      )}
    </form>
  );
}

export function ContactForm() {
  const [attempt, setAttempt] = useState(0);
  return <ContactFormBody key={attempt} onReset={() => setAttempt((current) => current + 1)} />;
}
