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
 * The nav items list defaults to { Accueil, Pour les pros, Employeurs,
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
  { href: "/pros", label: "Pour les pros" },
  { href: "/employeurs", label: "Employeurs" },
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
        "sticky top-0 z-50 backdrop-blur-md",
        isDark
          ? "border-b border-white/10 bg-neutral-900/80 text-white"
          : "border-b border-gray-200/80 bg-white/90 text-[#1A1A2E]",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2.5",
            isDark ? "text-white" : "text-[#1A1A2E]",
          )}
        >
          <WorkOnWordmark size="md" />
        </Link>

        <nav
          className={cn(
            "hidden md:flex items-center gap-8 text-[15px] font-medium",
            isDark ? "text-white/70" : "text-[#6B7280]",
          )}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors",
                isDark ? "hover:text-white" : "hover:text-[#1A1A2E]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <UserNav />
      </div>
    </header>
  );
}
