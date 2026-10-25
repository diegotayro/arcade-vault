"use server";

import { redirect } from "next/navigation";
import {
  isOAuthProvider,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  PASSWORD_RULE_MESSAGE,
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
  if (!isValidPassword(password)) return errorState(PASSWORD_RULE_MESSAGE);

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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function requestPasswordReset(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readField(formData, "email");
  if (!isValidEmail(email)) return errorState("Ingresa un correo válido");

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset`,
  });

  // Misma respuesta exista o no la cuenta: no se revela qué correos están registrados
  return {
    status: "sent",
    message: "Si el correo está registrado, te enviamos un enlace",
  };
}

export async function updatePassword(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!isValidPassword(password)) return errorState(PASSWORD_RULE_MESSAGE);
  if (password !== confirm) return errorState("Las contraseñas no coinciden");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error)
    return errorState(
      "No se pudo actualizar la contraseña. Pide un enlace nuevo",
    );

  redirect("/games");
}
