import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/navigation/sidebar";

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
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


