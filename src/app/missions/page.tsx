import { redirect } from "next/navigation";

/**
 * /missions - Redirige vers les missions disponibles
 */
export default function MissionsPage() {
  redirect("/missions/available");
}

