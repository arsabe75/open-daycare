import { deriveAvatar } from "@/lib/child-utils";
import type { LinkedParent, ParentRelation } from "@/lib/child-types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function generateInviteCode(): string {
  const chars = INVITE_CODE_CHARS;
  let code = "";

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const values = new Uint32Array(5);
    crypto.getRandomValues(values);
    for (let i = 0; i < 5; i += 1) {
      code += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 5; i += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return code;
}

export function getFirstName(fullName: string): string {
  return fullName.trim().split(" ")[0] ?? "";
}

export function buildLinkedParent(
  name: string,
  relation: ParentRelation,
  paletteIndex: number
): LinkedParent {
  const trimmedName = name.trim();
  const avatar = deriveAvatar(trimmedName, paletteIndex);

  return {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmedName,
    relation,
    status: "pending",
    avatar: { ...avatar, color: "#FFFFFF" },
  };
}
