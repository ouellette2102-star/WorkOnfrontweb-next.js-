import Link from "next/link";
import { WorkOnWordmark } from "@/components/brand/workon-wordmark";
import { UserNav } from "@/components/navigation/user-nav";
import { cn } from "@/lib/utils";

/**
 * MarketingHeader — shared sticky header for public marketing surfaces.
 *
 * Used on landing (/), /pros, /employeurs, /p/[slug], and any other
 * public page that wants the canonical WorkOn header. Avoids the
 * three-way drift we had before where each of those pages rolled its
 * own <header> with slightly different borders, fonts, nav items
 * and alignment.
 *
 * - `theme="light"` — landing page (white bg, dark text)
 * - `theme="dark"`  — /pros, /employeurs, /p/[slug] (dark bg, white text)
 *
 * The nav items list defaults to { Accueil, Pour les pros, Clients,
 * Tarifs } but can be overridden per surface.
 */

export type MarketingHeaderTheme = "light" | "dark";

export interface MarketingHeaderNavItem {
  href: string;
  label: string;
}

export interface MarketingHeaderProps {
  theme?: MarketingHeaderTheme;
  /** Override the default nav items. */
  items?: MarketingHeaderNavItem[];
  className?: string;
}

const DEFAULT_ITEMS: MarketingHeaderNavItem[] = [
  { href: "/", label: "Accueil" },
  { href: "/pros", label: "Travailleurs" },
  { href: "/pricing", label: "Clients" },
  { href: "/pricing", label: "Tarifs" },
];

export function MarketingHeader({
  theme = "dark",
  items = DEFAULT_ITEMS,
  className,
}: MarketingHeaderProps) {
  const isDark = theme === "dark";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl transition-colors",
        isDark
          ? "border-white/10 bg-workon-surface-dark/92 text-white shadow-[0_12px_34px_rgba(8,34,25,0.20)]"
          : "border-workon-border/80 bg-workon-surface/92 text-workon-ink shadow-[0_10px_28px_rgba(27,26,24,0.05)]",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2.5",
            isDark ? "text-white" : "text-workon-ink",
          )}
        >
          <WorkOnWordmark
            size="md"
            pinClassName={isDark ? "text-workon-gold" : undefined}
          />
        </Link>

        <nav
          className={cn(
            "hidden md:flex items-center gap-7 text-[15px] font-semibold",
            isDark ? "text-white/68" : "text-workon-gray",
          )}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors",
                isDark ? "hover:text-white" : "hover:text-workon-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <UserNav theme={theme} />
      </div>
    </header>
  );
}
