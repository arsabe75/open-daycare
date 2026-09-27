export type AllergyTag =
  | "peanut"
  | "lactose"
  | "gluten"
  | "egg"
  | "fish"
  | "shellfish"
  | "other";

export interface AllergyOption {
  value: AllergyTag;
  label: string;
}

export const ALLERGY_OPTIONS: AllergyOption[] = [
  { value: "peanut", label: "MANÍ" },
  { value: "lactose", label: "LACTOSA" },
  { value: "gluten", label: "GLUTEN" },
  { value: "egg", label: "HUEVO" },
  { value: "fish", label: "PESCADO" },
  { value: "shellfish", label: "MARISCOS" },
  { value: "other", label: "OTRA" },
];

const ALLERGY_LABEL_MAP: Record<AllergyTag, string> = {
  peanut: "MANÍ",
  lactose: "LACTOSA",
  gluten: "GLUTEN",
  egg: "HUEVO",
  fish: "PESCADO",
  shellfish: "MARISCOS",
  other: "OTRA",
};

export function translateAllergyTag(tag: string): string {
  return ALLERGY_LABEL_MAP[tag as AllergyTag] ?? tag.toUpperCase();
}

export function parseAllergyTags(input: string): AllergyTag[] {
  return input
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag): tag is AllergyTag =>
      ALLERGY_OPTIONS.some((option) => option.value === tag)
    );
}
