import { redirect } from "next/navigation";

/**
 * /employer - Redirige vers le dashboard employeur
 */
export default function EmployerPage() {
  redirect("/employer/dashboard");
}

