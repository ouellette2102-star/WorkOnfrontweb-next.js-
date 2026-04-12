"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type SupportTicket } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, HelpCircle, Plus, X, Send, CheckCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "PAYMENT", label: "Paiement" },
  { value: "MISSION", label: "Mission" },
  { value: "ACCOUNT", label: "Compte" },
  { value: "TECHNICAL", label: "Technique" },
  { value: "DISPUTE", label: "Litige" },
  { value: "OTHER", label: "Autre" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Ouvert", color: "bg-blue-500/20 text-blue-400" },
  IN_PROGRESS: { label: "En cours", color: "bg-purple-500/20 text-purple-400" },
  WAITING_USER: { label: "En attente", color: "bg-yellow-500/20 text-yellow-400" },
  WAITING_ADMIN: { label: "En traitement", color: "bg-orange-500/20 text-orange-400" },
  RESOLVED: { label: "Resolu", color: "bg-green-500/20 text-green-400" },
  CLOSED: { label: "Ferme", color: "bg-neutral-500/20 text-neutral-400" },
};

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [replyContent, setReplyContent] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => api.getMyTickets(),
  });

  const createMutation = useMutation({
    mutationFn: () => api.createTicket({ subject, description, category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket cree");
      setShowCreate(false);
      setSubject("");
      setDescription("");
      setCategory("OTHER");
    },
    onError: () => toast.error("Erreur lors de la creation du ticket"),
  });

  const replyMutation = useMutation({
    mutationFn: () => {
      if (!selectedTicket) throw new Error("No ticket selected");
      return api.addTicketMessage(selectedTicket.id, { content: replyContent });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Message envoye");
      setReplyContent("");
      // Refresh ticket detail
      if (selectedTicket) {
        api.getTicket(selectedTicket.id).then(setSelectedTicket);
      }
    },
    onError: () => toast.error("Erreur lors de l'envoi"),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => api.closeTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket ferme");
      setSelectedTicket(null);
    },
    onError: () => toast.error("Erreur lors de la fermeture"),
  });

  // Ticket detail view
  if (selectedTicket) {
    const status = STATUS_LABELS[selectedTicket.status] || STATUS_LABELS.OPEN;
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button onClick={() => setSelectedTicket(null)} className="mb-4 text-sm text-workon-muted hover:text-white">
          &larr; Retour aux tickets
        </button>

        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-workon-ink">{selectedTicket.subject}</h1>
            <p className="text-sm text-workon-muted">
              {CATEGORIES.find((c) => c.value === selectedTicket.category)?.label || selectedTicket.category}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        <div className="mb-4 rounded-xl border border-workon-border bg-white shadow-sm p-4">
          <p className="text-workon-ink/80">{selectedTicket.description}</p>
          <p className="mt-2 text-xs text-workon-muted">
            {new Date(selectedTicket.createdAt).toLocaleDateString("fr-CA")}
          </p>
        </div>

        {/* Messages thread */}
        {Array.isArray(selectedTicket.messages) && selectedTicket.messages.length > 0 && (
          <div className="mb-4 space-y-3">
            {selectedTicket.messages.map((msg: unknown, i: number) => {
              const m = msg as { content?: string; senderRole?: string; createdAt?: string };
              const isAdmin = m.senderRole === "ADMIN" || m.senderRole === "admin";
              return (
                <div
                  key={i}
                  className={`rounded-xl p-3 ${isAdmin ? "border border-blue-500/20 bg-blue-500/10" : "border border-workon-border bg-white shadow-sm"}`}
                >
                  <p className="mb-1 text-xs font-medium text-workon-muted">
                    {isAdmin ? "Support" : "Vous"}
                  </p>
                  <p className="text-sm text-workon-ink/80">{m.content}</p>
                  {m.createdAt && (
                    <p className="mt-1 text-xs text-workon-muted/60">{new Date(m.createdAt).toLocaleDateString("fr-CA")}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Reply form */}
        {selectedTicket.status !== "CLOSED" && selectedTicket.status !== "RESOLVED" && (
          <div className="mb-4 flex gap-2">
            <Input
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Votre message..."
              className="flex-1 border-workon-border bg-white text-workon-ink placeholder-workon-muted/50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && replyContent.trim()) replyMutation.mutate();
              }}
            />
            <Button
              onClick={() => replyMutation.mutate()}
              disabled={!replyContent.trim() || replyMutation.isPending}
              className="bg-workon-primary hover:bg-workon-primary/90"
            >
              {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {selectedTicket.status !== "CLOSED" && (
          <Button
            variant="outline"
            onClick={() => closeMutation.mutate(selectedTicket.id)}
            disabled={closeMutation.isPending}
            className="border-workon-border text-workon-muted"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Fermer le ticket
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-workon-ink">Support</h1>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-workon-primary hover:bg-workon-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau ticket
        </Button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-workon-border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-workon-ink">Nouveau ticket</h2>
              <button onClick={() => setShowCreate(false)} className="text-workon-muted hover:text-workon-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-workon-muted">Sujet</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Resume du probleme..."
                  className="border-workon-border bg-white text-workon-ink placeholder-workon-muted/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-workon-muted">Categorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-workon-border bg-white shadow-sm p-3 text-white focus:border-red-500 focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-workon-muted">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Decrivez votre probleme en detail..."
                  rows={4}
                  className="w-full rounded-xl border border-workon-border bg-white shadow-sm p-3 text-white placeholder-workon-muted/50 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!subject.trim() || !description.trim() || createMutation.isPending}
                  className="flex-1 bg-workon-primary hover:bg-workon-primary/90"
                >
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Creer le ticket
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tickets list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
        </div>
      ) : !tickets || tickets.length === 0 ? (
        <div className="rounded-xl border border-workon-border bg-white shadow-sm p-12 text-center">
          <HelpCircle className="mx-auto mb-4 h-12 w-12 text-workon-muted/60" />
          <h3 className="mb-2 text-lg font-semibold text-workon-ink">Aucun ticket</h3>
          <p className="text-workon-muted">Vous n&apos;avez pas encore cree de ticket de support.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const status = STATUS_LABELS[ticket.status] || STATUS_LABELS.OPEN;
            const msgCount = Array.isArray(ticket.messages) ? ticket.messages.length : 0;
            return (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="w-full rounded-xl border border-workon-border bg-white p-4 shadow-sm text-left transition hover:border-workon-primary/30"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold text-workon-ink">{ticket.subject}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <p className="mb-2 line-clamp-2 text-sm text-workon-muted">{ticket.description}</p>
                <div className="flex items-center gap-3 text-xs text-workon-muted">
                  <span>{CATEGORIES.find((c) => c.value === ticket.category)?.label || ticket.category}</span>
                  {msgCount > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {msgCount}
                    </span>
                  )}
                  <span>{new Date(ticket.createdAt).toLocaleDateString("fr-CA")}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
