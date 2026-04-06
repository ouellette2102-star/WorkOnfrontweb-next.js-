import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/navigation/sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("workon_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-8">
        <div className="hidden w-64 md:block">
          <Sidebar />
        </div>
        <div className="flex-1 rounded-3xl border border-white/5 bg-neutral-900/60 p-4 shadow-2xl shadow-black/30 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
