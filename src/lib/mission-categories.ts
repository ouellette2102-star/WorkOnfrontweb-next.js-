import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Snowflake,
  Package,
  Wrench,
  Leaf,
  Paintbrush,
  Truck,
  Shapes,
} from "lucide-react";

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
  { value: "cleaning", label: "Ménage / entretien", icon: Sparkles },
  { value: "snow_removal", label: "Déneigement", icon: Snowflake },
  { value: "moving", label: "Déménagement", icon: Package },
  { value: "handyman", label: "Petits travaux", icon: Wrench },
  { value: "gardening", label: "Jardinage", icon: Leaf },
  { value: "painting", label: "Peinture", icon: Paintbrush },
  { value: "delivery", label: "Livraison", icon: Truck },
  { value: "other", label: "Autre", icon: Shapes },
] satisfies readonly { value: MissionCategory; label: string; icon: LucideIcon }[];

export function isMissionCategory(value: string): value is MissionCategory {
  return (MISSION_CATEGORY_VALUES as readonly string[]).includes(value);
}

export function getMissionCategoryLabel(value: string): string {
  return MISSION_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
