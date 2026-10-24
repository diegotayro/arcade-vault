import type { AuthFormState } from "@/app/auth/actions";

export function AuthMessage({ state }: { state: AuthFormState }) {
  if (!state.message) return null;

  const isError = state.status === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      className={"mono auth-message" + (isError ? " error" : "")}
    >
      {state.message}
    </p>
  );
}
