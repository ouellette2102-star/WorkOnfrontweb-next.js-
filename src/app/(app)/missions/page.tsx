import { redirect } from "next/navigation";

/**
 * /missions → /missions/mine (user's missions dashboard).
 * Previously redirected to /search which is removed.
 */
export default function MissionsPage() {
  redirect("/missions/mine");
}
