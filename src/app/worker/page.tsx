import { redirect } from "next/navigation";

/**
 * /worker - Redirige vers le dashboard worker
 */
export default function WorkerPage() {
  redirect("/worker/dashboard");
}

