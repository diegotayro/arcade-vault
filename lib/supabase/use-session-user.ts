"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type SessionUser = { id: string; username: string } | null;

const toSessionUser = (user: User | null | undefined): SessionUser =>
  user
    ? { id: user.id, username: String(user.user_metadata.username ?? "") }
    : null;

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setUser(toSessionUser(data.user)));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toSessionUser(session?.user));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return user;
}
