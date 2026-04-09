"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePrimaryRole } from "@/hooks/use-primary-role";
import { WorkOnWordmark } from "@/components/brand/workon-wordmark";

const roleLabels: Record<string, string> = {
  worker: "Travailleur",
  employer: "Employeur",
  client: "Client résidentiel",
  admin: "Administrateur",
};

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profil" },
  { href: "/feed", label: "Feed" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { primaryRole } = usePrimaryRole();

  return (
    <aside className="flex h-full flex-col gap-6 border-r border-white/5 bg-neutral-950 px-6 py-8 text-white">
      <div>
        <Link href="/" className="flex items-center text-white">
          <WorkOnWordmark size="lg" />
        </Link>
        <p className="mt-2 text-xs uppercase tracking-[0.4em] text-white/40">Dashboard</p>
        {primaryRole ? (
          <p className="mt-2 text-xs text-white/60">
            Rôle principal :{" "}
            <span className="font-semibold">
              {roleLabels[primaryRole] ?? "—"}
            </span>
          </p>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-2 text-sm">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl px-4 py-3 transition ${
                active
                  ? "bg-[#FF4D1C] text-white shadow-md shadow-[#FF4D1C]/25"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => { logout(); window.location.href = "/sign-in"; }}
        className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80 transition hover:text-white"
      >
        Déconnexion
      </button>
    </aside>
  );
}


