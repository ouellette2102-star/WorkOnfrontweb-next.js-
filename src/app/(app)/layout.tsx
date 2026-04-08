import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "./_app-shell";

/**
 * Server-side gate for the authenticated app shell.
 *
 * Reading cookies() forces every (app)/* route to be dynamically rendered,
 * which (a) lets the auth middleware actually run on each request and
 * (b) prevents Vercel from caching a prerendered HTML skeleton that would
 * leak the page chrome to unauthenticated visitors.
 *
 * If the auth cookie is missing we redirect on the server before any
 * page content is sent. The client-side AppShell still handles the
 * post-hydration UX (loading spinner, BottomNav, etc).
 */
export default async function AppLayout({
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
