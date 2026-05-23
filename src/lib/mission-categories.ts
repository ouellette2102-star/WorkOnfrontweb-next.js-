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
  { value: "cleaning", label: "Ménage / entretien", icon: "🧹" },
  { value: "snow_removal", label: "Déneigement", icon: "❄️" },
  { value: "moving", label: "Déménagement", icon: "📦" },
  { value: "handyman", label: "Petits travaux", icon: "🔧" },
  { value: "gardening", label: "Jardinage", icon: "🌿" },
  { value: "painting", label: "Peinture", icon: "🎨" },
  { value: "delivery", label: "Livraison", icon: "🚚" },
  { value: "other", label: "Autre", icon: "✨" },
] satisfies readonly { value: MissionCategory; label: string; icon: string }[];

export function isMissionCategory(value: string): value is MissionCategory {
  return (MISSION_CATEGORY_VALUES as readonly string[]).includes(value);
}

export function getMissionCategoryLabel(value: string): string {
  return MISSION_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
