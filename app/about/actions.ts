"use server";

import { Resend } from "resend";
import {
  validateContactMessage,
  type ContactMessage,
  type ContactResult,
} from "@/lib/contact";

const HONEYPOT_FIELD = "website";

function readField(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function removeLineBreaks(value: string): string {
  return value.replace(/[\r\n]+/g, " ");
}

function buildEmailBody({ name, email, message }: ContactMessage): string {
  return `Nombre: ${name}\nCorreo: ${email}\n\n${message}`;
}

async function deliverMessage(contact: ContactMessage): Promise<boolean> {
  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) return false;

  try {
    const { error } = await new Resend(RESEND_API_KEY).emails.send({
      from: CONTACT_FROM_EMAIL,
      to: CONTACT_TO_EMAIL,
      subject: `[Arcade Vault] Nuevo mensaje de ${removeLineBreaks(contact.name)}`,
      text: buildEmailBody(contact),
    });
    return error === null;
  } catch {
    return false;
  }
}

export async function sendContactMessage(
  _previousState: ContactResult | null,
  formData: FormData,
): Promise<ContactResult> {
  const contact = validateContactMessage({
    name: readField(formData, "name"),
    email: readField(formData, "email"),
    message: readField(formData, "message"),
  });
  if (!contact) return { status: "error", reason: "invalid" };

  // Un bot rellena el campo oculto: respondemos éxito sin enviar nada
  if (readField(formData, HONEYPOT_FIELD) !== "") {
    return { status: "success", senderName: contact.name };
  }

  const wasDelivered = await deliverMessage(contact);
  return wasDelivered
    ? { status: "success", senderName: contact.name }
    : { status: "error", reason: "send-failed" };
}
