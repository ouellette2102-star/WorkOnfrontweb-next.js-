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

type NavLink = { href: string; label: string };
type NavSection = { title?: string; links: NavLink[] };

const mainLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/feed", label: "Feed" },
  { href: "/profile", label: "Profil" },
];

const missionSection: NavSection = {
  title: "Missions",
  links: [
    { href: "/missions", label: "Mes missions" },
    { href: "/offers", label: "Offres" },
    { href: "/contracts", label: "Contrats" },
    { href: "/matches", label: "Matches" },
    { href: "/calendar", label: "Calendrier" },
    { href: "/bookings", label: "Réservations" },
  ],
};

const financeSection: NavSection = {
  title: "Finances",
  links: [
    { href: "/earnings", label: "Revenus" },
    { href: "/invoices", label: "Factures" },
    { href: "/receipts", label: "Reçus" },
  ],
};

const supportSection: NavSection = {
  title: "Support & Paramètres",
  links: [
    { href: "/reviews", label: "Avis" },
    { href: "/disputes", label: "Litiges" },
    { href: "/support", label: "Support" },
    { href: "/settings", label: "Paramètres" },
  ],
};

const adminSection: NavSection = {
  title: "Admin",
  links: [
    { href: "/operator", label: "Dispatch (Operator)" },
    { href: "/admin", label: "Outils admin" },
    { href: "/leads", label: "Leads" },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { primaryRole } = usePrimaryRole();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const renderLink = (link: NavLink) => {
    const active = isActive(link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        className={`rounded-2xl px-4 py-2.5 text-sm transition ${
          active
            ? "bg-[#134021] text-white shadow-md shadow-[#134021]/25"
            : "text-[#706E6A] hover:bg-[#F0EDE8] hover:text-[#1B1A18]"
        }`}
      >
        {link.label}
      </Link>
    );
  };

  const renderSection = (section: NavSection) => (
    <div key={section.title} className="flex flex-col gap-1">
      {section.title && (
        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9C9A96]">
          {section.title}
        </p>
      )}
      {section.links.map(renderLink)}
    </div>
  );

  const isAdmin = primaryRole === "admin";

  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto border-r border-[#EAE6DF] bg-white px-4 py-8 text-[#1B1A18]">
      <div className="px-2">
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

      <nav className="flex flex-1 flex-col gap-1">
        <div className="flex flex-col gap-1">{mainLinks.map(renderLink)}</div>
        {renderSection(missionSection)}
        {renderSection(financeSection)}
        {renderSection(supportSection)}
        {isAdmin && renderSection(adminSection)}
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
