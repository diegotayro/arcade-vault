"use server";

import { redirect } from "next/navigation";
import {
  isOAuthProvider,
  isValidEmail,
  isValidPassword,
  isValidUsername,
} from "@/lib/auth-rules";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  status: "idle" | "error" | "check-email" | "sent";
  message?: string;
};

const readField = (formData: FormData, name: string) =>
  String(formData.get(name) ?? "").trim();

const errorState = (message: string): AuthFormState => ({
  status: "error",
  message,
});

export async function signUp(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readField(formData, "email");
  const username = readField(formData, "username");
  const password = String(formData.get("password") ?? "");

  if (!isValidEmail(email)) return errorState("Ingresa un correo válido");
  if (!isValidUsername(username))
    return errorState("El usuario debe tener entre 3 y 12 caracteres");
  if (!isValidPassword(password))
    return errorState("La contraseña debe tener entre 8 y 72 caracteres");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) return errorState("No se pudo crear la cuenta");

  // Mismo mensaje exista o no la cuenta: no se revela qué correos están registrados
  return {
    status: "check-email",
    message: "Revisa tu correo para confirmar tu cuenta",
  };
}

export async function signIn(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readField(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!isValidEmail(email) || !password)
    return errorState("Correo o contraseña incorrectos");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error?.code === "email_not_confirmed")
    return errorState("Confirma tu correo antes de entrar");
  if (error) return errorState("Correo o contraseña incorrectos");

  redirect("/games");
}

export async function signInWithProvider(provider: string) {
  if (!isOAuthProvider(provider)) redirect("/auth?error=callback");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error || !data.url) redirect("/auth?error=callback");
  redirect(data.url);
}
