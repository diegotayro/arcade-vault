"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { toAvatarUrl } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/client";

export type SessionUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
} | null;

const toSessionUser = (user: User | null | undefined): SessionUser =>
  user
    ? {
        id: user.id,
        username: String(user.user_metadata.username ?? ""),
        avatarUrl: toAvatarUrl(user.user_metadata.avatar_url),
      }
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
