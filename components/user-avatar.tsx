"use client";

import Image from "next/image";
import { useState } from "react";
import { getInitials } from "@/lib/avatar";

const AVATAR_SIZE = 28;

type UserAvatarProps = {
  username: string;
  avatarUrl: string | null;
};

export function UserAvatar({ username, avatarUrl }: UserAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const showsImage = avatarUrl && !hasImageError;

  return (
    <span className="user-avatar" aria-hidden="true">
      {showsImage ? (
        <Image
          src={avatarUrl}
          alt=""
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          onError={() => setHasImageError(true)}
        />
      ) : (
        getInitials(username)
      )}
    </span>
  );
}
