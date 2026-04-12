"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, LeadResponse, LeadStatus } from "@/lib/api-client";
import { toast } from "sonner";
import { Phone, Mail, ArrowRightCircle, UserCheck, Inbox } from "lucide-react";

const TABS: { label: string; value: LeadStatus | "all" }[] = [
  { label: "Tous", value: "all" },
  { label: "Nouveaux", value: "new" },
  { label: "Contact\u00e9s", value: "contacted" },
  { label: "Qualifi\u00e9s", value: "qualified" },
  { label: "Convertis", value: "converted" },
];

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  new: { label: "Nouveau", bg: "bg-[#22C55E]/10", text: "text-[#22C55E]" },
  contacted: { label: "Contact\u00e9", bg: "bg-[#3B82F6]/10", text: "text-[#3B82F6]" },
  qualified: { label: "Qualifi\u00e9", bg: "bg-[#8B5CF6]/10", text: "text-[#8B5CF6]" },
  converted: { label: "Converti", bg: "bg-[#166534]/10", text: "text-[#166534]" },
  lost: { label: "Perdu", bg: "bg-[#9CA3AF]/10", text: "text-[#9CA3AF]" },
};

function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<LeadStatus | "all">("all");
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => api.getLeads(),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      api.updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Statut mis \u00e0 jour");
    },
    onError: () => toast.error("Erreur lors de la mise \u00e0 jour du statut"),
  });

  const convertLead = useMutation({
    mutationFn: (id: string) => api.convertLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead converti en mission !");
    },
    onError: () => toast.error("Erreur lors de la conversion"),
  });

  const filtered =
    activeTab === "all" ? leads : leads.filter((l) => l.status === activeTab);

  return (
    <div className="min-h-screen bg-workon-bg">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <h1 className="text-2xl font-bold font-heading text-workon-ink">
          Mes leads
        </h1>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-workon-primary text-white"
                  : "bg-white border border-workon-border text-workon-ink hover:bg-workon-bg-cream"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-white border border-workon-border animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-workon-bg-cream flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-workon-muted" />
            </div>
            <p className="text-workon-ink font-semibold text-lg">
              Aucun lead pour le moment
            </p>
            <p className="text-workon-muted text-sm mt-1">
              Les leads appara\u00eetront ici lorsque des clients vous contacteront via la plateforme.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onContact={() =>
                  updateStatus.mutate({ id: lead.id, status: "contacted" })
                }
                onConvert={() => convertLead.mutate(lead.id)}
                isUpdating={updateStatus.isPending || convertLead.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  onContact,
  onConvert,
  isUpdating,
}: {
  lead: LeadResponse;
  onContact: () => void;
  onConvert: () => void;
  isUpdating: boolean;
}) {
  const showContact = lead.status === "new";
  const showConvert =
    lead.status === "contacted" || lead.status === "qualified";

  return (
    <div className="bg-white rounded-2xl border border-workon-border p-4 space-y-3">
      {/* Top row: name + badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-workon-ink truncate">
            {lead.contactName}
          </p>
          {lead.source && (
            <p className="text-xs text-workon-muted mt-0.5">
              Source : {lead.source}
            </p>
          )}
        </div>
        <StatusBadge status={lead.status} />
      </div>

      {/* Contact info */}
      <div className="flex flex-wrap gap-3 text-sm text-workon-muted">
        {lead.contactPhone && (
          <a
            href={`tel:${lead.contactPhone}`}
            className="inline-flex items-center gap-1 hover:text-workon-ink transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            {lead.contactPhone}
          </a>
        )}
        {lead.contactEmail && (
          <a
            href={`mailto:${lead.contactEmail}`}
            className="inline-flex items-center gap-1 hover:text-workon-ink transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            {lead.contactEmail}
          </a>
        )}
      </div>

      {/* Bottom row: date + actions */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-workon-muted">
          Re\u00e7u le {formatDate(lead.createdAt)}
        </span>

        <div className="flex gap-2">
          {showContact && (
            <button
              onClick={onContact}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] px-3 py-1.5 text-xs font-medium hover:bg-[#3B82F6]/20 transition-colors disabled:opacity-50"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Contacter
            </button>
          )}
          {showConvert && (
            <button
              onClick={onConvert}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 rounded-full bg-workon-primary/10 text-workon-primary px-3 py-1.5 text-xs font-medium hover:bg-workon-primary/20 transition-colors disabled:opacity-50"
            >
              <ArrowRightCircle className="h-3.5 w-3.5" />
              Convertir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
