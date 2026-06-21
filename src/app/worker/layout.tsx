import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/(app)/_app-shell";

export const dynamic = "force-dynamic";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("workon_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
