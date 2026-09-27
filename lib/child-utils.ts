import { Child, Avatar } from "@/lib/child-types";

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

export interface NewChildInput {
  fullName: string;
  birthDate: string; // DD/MM/AAAA
  roomId: string;
  allergies: string;
  medicalNotes: string;
}

export function isValidDate(value: string): boolean {
  const parsed = parseDate(value);
  if (!parsed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed.getTime() <= today.getTime();
}

export function parseDate(value: string): Date | null {
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

export function formatBirthDate(date: Date): string {
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
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

export function parseAllergies(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function deriveAvatar(name: string, paletteIndex: number): Avatar {
  const trimmed = name.trim();
  const initial = trimmed.charAt(0).toUpperCase() || "?";
  const palette = AVATAR_PALETTE[paletteIndex % AVATAR_PALETTE.length];
  return { initial, bg: palette.bg, color: palette.color };
}

function nextNumericId(children: Child[]): string {
  const maxId = children.reduce((max, child) => {
    const num = Number(child.id);
    return Number.isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return String(maxId + 1);
}

export function buildChild(
  input: NewChildInput,
  roomName: string,
  existingChildren: Child[]
): Child {
  const birthDateObj = parseDate(input.birthDate.trim());
  if (!birthDateObj) {
    throw new Error("Fecha de nacimiento inválida");
  }

  const name = input.fullName.trim();
  const tags = parseAllergies(input.allergies);
  const notes = input.medicalNotes.trim();

  const today = new Date();
  const admission = `${MONTHS[today.getMonth()]} ${today.getFullYear()}`;

  const child: Child = {
    id: nextNumericId(existingChildren),
    name,
    age: calculateAge(birthDateObj),
    room: roomName,
    avatar: deriveAvatar(name, existingChildren.length),
    birthDate: formatBirthDate(birthDateObj),
    admission,
    linkedParents: [],
  };

  if (tags.length > 0) {
    child.allergyBadge = tags[0].toUpperCase();
  }

  if (notes.length > 0) {
    child.allergyNotes = notes;
  } else if (tags.length > 0) {
    child.allergyNotes = tags.join(", ");
  }

  return child;
}
