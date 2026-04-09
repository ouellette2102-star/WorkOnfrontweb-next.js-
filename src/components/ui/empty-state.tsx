import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm px-6 py-12 text-center shadow-lg shadow-black/20">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF4D1C]/15 border border-[#FF4D1C]/25">
        <Icon className="h-8 w-8 text-[#FF4D1C]" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-white/60">{description}</p>
      {actionLabel && actionHref && (
        <Button asChild variant="hero" size="hero">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
