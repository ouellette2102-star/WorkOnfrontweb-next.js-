"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePrimaryRole } from "@/hooks/use-primary-role";
import { WorkOnWordmark } from "@/components/brand/workon-wordmark";

const roleLabels: Record<string, string> = {
  worker: "Travailleur",
  employer: "Client entreprise",
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
    <aside className="flex h-full flex-col gap-6 border-r border-[#EAE6DF] bg-white px-6 py-8 text-[#1B1A18]">
      <div>
        <Link href="/" className="flex items-center text-[#1B1A18]">
          <WorkOnWordmark size="lg" />
        </Link>
        <p className="mt-2 text-xs uppercase tracking-[0.4em] text-[#9C9A96]">Dashboard</p>
        {primaryRole ? (
          <p className="mt-2 text-xs text-[#706E6A]">
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
                  ? "bg-[#134021] text-white shadow-md shadow-[#134021]/25"
                  : "text-[#706E6A] hover:bg-[#F0EDE8] hover:text-[#1B1A18]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => { logout(); window.location.href = "/sign-in"; }}
        className="rounded-2xl border border-[#EAE6DF] px-4 py-3 text-sm text-[#706E6A] transition hover:text-[#1B1A18]"
      >
        Déconnexion
      </button>
    </aside>
  );
}


