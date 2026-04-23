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
    <div className="flex flex-col items-center justify-center rounded-3xl border border-workon-border bg-white px-6 py-12 text-center shadow-card">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-workon-primary/10 border border-workon-primary/20">
        <Icon className="h-8 w-8 text-workon-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-workon-ink">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-workon-gray">{description}</p>
      {actionLabel && actionHref && (
        <Button asChild variant="hero" size="hero">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
