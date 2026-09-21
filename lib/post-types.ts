import type { PostType } from "@/lib/data/posts";

export interface PostTypeMeta {
  label: string;
  accent: string;
  pastel: string;
}

export const POST_TYPE_META: Record<PostType, PostTypeMeta> = {
  food: { label: "COMIDA", accent: "#9A7B1E", pastel: "#F1E5C4" },
  nap: { label: "SIESTA", accent: "#7B5FC0", pastel: "#E7DCF6" },
  activity: { label: "ACTIVIDAD", accent: "#2E89A6", pastel: "#C7E7F1" },
  achievement: { label: "LOGRO", accent: "#3E9B6C", pastel: "#CFEBD8" },
  mood: { label: "ÁNIMO", accent: "#C56486", pastel: "#F9D2DE" },
  photo: { label: "FOTO", accent: "#D9684A", pastel: "#FBD8CC" },
  announcement: { label: "ANUNCIO", accent: "#4E72C8", pastel: "#CCD8F4" },
};

export const POST_TYPE_ORDER: PostType[] = [
  "food",
  "nap",
  "activity",
  "achievement",
  "mood",
  "photo",
  "announcement",
];
