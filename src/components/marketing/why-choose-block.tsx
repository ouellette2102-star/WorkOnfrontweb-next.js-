import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * WhyChooseBlock — reusable "why choose X" section for landing /
 * /pros / /employeurs. Single source of truth so all three marketing
 * surfaces speak the same language with the same visual grid.
 *
 * Usage:
 *
 * <WhyChooseBlock
 *   eyebrow="Pourquoi WorkOn"
 *   title="La tranquillité d'esprit, par défaut."
 *   items={[
 *     { icon: "💸", title: "...", desc: "..." },
 *     ...
 *   ]}
 *   theme="light"
 * />
 */

export interface WhyChooseItem {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export interface WhyChooseBlockProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  items: WhyChooseItem[];
  /** light = white bg (for landing), dark = neutral-900 bg (for /pros /employeurs) */
  theme?: "light" | "dark";
  className?: string;
}

export function WhyChooseBlock({
  eyebrow,
  title,
  subtitle,
  items,
  theme = "light",
  className,
}: WhyChooseBlockProps) {
  const isDark = theme === "dark";

  return (
    <section
      className={cn(
        isDark ? "bg-[#F9F8F5] text-[#1B1A18]" : "bg-white text-[#1B1A18]",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-[6.5rem]">
        <div className="text-center max-w-2xl mx-auto mb-14">
          {eyebrow && (
            <p className="text-sm font-semibold text-workon-accent uppercase tracking-widest mb-4">
              {eyebrow}
            </p>
          )}
          <h2
            className={cn(
              "text-3xl md:text-[2.5rem] font-bold leading-tight tracking-tight",
              isDark ? "text-[#1B1A18]" : "text-[#1B1A18]",
            )}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={cn(
                "mt-4 text-lg leading-relaxed",
                isDark ? "text-[#706E6A]" : "text-[#706E6A]",
              )}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {items.map((item, i) => (
            <div
              key={`${i}-${item.title}`}
              className={cn(
                "rounded-3xl border p-6 transition-all hover:-translate-y-0.5",
                isDark
                  ? "bg-white border-[#EAE6DF] hover:border-[#134021]/30 shadow-card"
                  : "border-[#EAE6DF] bg-[#F9F8F5] hover:border-[#134021]/30 hover:shadow-lg hover:shadow-[#134021]/5",
              )}
            >
              <div
                className={cn(
                  "inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-4 text-2xl",
                  isDark
                    ? "bg-workon-accent/15 border border-workon-accent/25"
                    : "bg-workon-accent/10 border border-workon-accent/20",
                )}
              >
                {item.icon}
              </div>
              <h3
                className={cn(
                  "font-bold text-base mb-2",
                  isDark ? "text-[#1B1A18]" : "text-[#1B1A18]",
                )}
              >
                {item.title}
              </h3>
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  isDark ? "text-[#706E6A]" : "text-[#706E6A]",
                )}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
