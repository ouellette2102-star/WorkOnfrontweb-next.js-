export const MISSION_CATEGORY_VALUES = [
  "cleaning",
  "snow_removal",
  "moving",
  "handyman",
  "gardening",
  "painting",
  "delivery",
  "other",
] as const;

export type MissionCategory = (typeof MISSION_CATEGORY_VALUES)[number];

export const MISSION_CATEGORY_OPTIONS = [
  { value: "cleaning", label: "Ménage / entretien" },
  { value: "snow_removal", label: "Déneigement" },
  { value: "moving", label: "Déménagement" },
  { value: "handyman", label: "Petits travaux" },
  { value: "gardening", label: "Jardinage" },
  { value: "painting", label: "Peinture" },
  { value: "delivery", label: "Livraison" },
  { value: "other", label: "Autre" },
] satisfies readonly { value: MissionCategory; label: string }[];

export function isMissionCategory(value: string): value is MissionCategory {
  return (MISSION_CATEGORY_VALUES as readonly string[]).includes(value);
}

export function getMissionCategoryLabel(value: string): string {
  return MISSION_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
