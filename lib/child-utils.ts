import { Child, Avatar } from "@/lib/child-types";
import { translateAllergyTag } from "@/lib/allergies";

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const AVATAR_PALETTE: { bg: string; color: string }[] = [
  { bg: "#A9D9E8", color: "#1F7A93" },
  { bg: "#F4B8CC", color: "#C44A7A" },
  { bg: "#B9DEC4", color: "#3E8B62" },
  { bg: "#C9B6E8", color: "#7B5FC0" },
  { bg: "#F4DC8E", color: "#9A7B1E" },
];

export interface ChildRow {
  id: string;
  room_id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string | null;
  allergy_tags: string[] | null;
  photo_consent: boolean;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  rooms: { name: string } | null;
}

export function isValidDate(value: string): boolean {
  const parsed = parseDisplayDate(value);
  if (!parsed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed.getTime() <= today.getTime();
}

export function parseDisplayDate(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);

  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatBirthDate(date: Date): string {
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatAdmission(date: Date): string {
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
}

export function calculateAge(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

export function stableHashIndex(id: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % length;
}

export function deriveAvatar(name: string, paletteIndex: number): Avatar {
  const trimmed = name.trim();
  const initial = trimmed.charAt(0).toUpperCase() || "?";
  const palette = AVATAR_PALETTE[paletteIndex % AVATAR_PALETTE.length];
  return { initial, bg: palette.bg, color: palette.color };
}

export function mapChildToViewModel(row: ChildRow): Child {
  const birthDate = parseIsoDate(row.birth_date);
  const enrolledAt = parseIsoDate(row.enrolled_at);
  const tags = row.allergy_tags ?? [];

  const isoYear = birthDate.getFullYear();
  const isoMonth = String(birthDate.getMonth() + 1).padStart(2, "0");
  const isoDay = String(birthDate.getDate()).padStart(2, "0");

  const child: Child = {
    id: row.id,
    name: row.full_name,
    age: calculateAge(birthDate),
    roomId: row.room_id,
    room: row.rooms?.name ?? "",
    avatar: deriveAvatar(row.full_name, stableHashIndex(row.id, AVATAR_PALETTE.length)),
    birthDate: formatBirthDate(birthDate),
    birthDateIso: `${isoYear}-${isoMonth}-${isoDay}`,
    admission: formatAdmission(enrolledAt),
    linkedParents: [],
    allergyTags: tags,
    medicalNotes: row.medical_notes ?? undefined,
  };

  if (tags.length > 0) {
    child.allergyBadge = translateAllergyTag(tags[0]);
  }

  if (row.medical_notes && row.medical_notes.trim().length > 0) {
    child.allergyNotes = row.medical_notes.trim();
  } else if (tags.length > 0) {
    child.allergyNotes = tags.map(translateAllergyTag).join(", ");
  }

  return child;
}

