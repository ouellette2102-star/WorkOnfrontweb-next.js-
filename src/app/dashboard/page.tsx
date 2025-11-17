import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentProfile } from "@/lib/get-profile";

/**
 * /dashboard - Point d'entrée principal
 * Redirige l'utilisateur vers son dashboard spécifique selon son rôle
 */
export default async function DashboardPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const profileRecord = await getCurrentProfile(clerkUser.id);

  if (!profileRecord) {
    redirect("/onboarding");
  }

  // Rediriger selon le rôle principal
  const role = profileRecord.primaryRole?.toLowerCase();

  if (role === "worker") {
    redirect("/worker/dashboard");
  }

  if (role === "employer" || role === "admin") {
    redirect("/employer/dashboard");
  }

  if (role === "client_residential") {
    redirect("/worker/dashboard"); // Pour l'instant, les clients vont sur le dashboard worker
  }

  // Par défaut, si pas de rôle clair, on redirige vers onboarding
  redirect("/onboarding/role");
}

