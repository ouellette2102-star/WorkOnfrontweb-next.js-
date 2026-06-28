"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  HelpCircle,
  Inbox,
  LifeBuoy,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Send,
  ShieldAlert,
  Tag,
  UserRound,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api, type SupportTicket } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type TicketFilter = "all" | "action" | "processing" | "done";
type TicketCategory = "PAYMENT" | "MISSION" | "ACCOUNT" | "TECHNICAL" | "DISPUTE" | "OTHER";
type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

type TicketMessage = {
  id?: string;
  content?: string;
  createdAt?: string;
  senderType?: string;
  senderRole?: string;
};

type TicketWithMeta = SupportTicket & {
  updatedAt?: string;
  messages?: unknown[];
};

const CATEGORY_OPTIONS = [
  { value: "PAYMENT", label: "Paiement", hint: "Versement, facture ou retenue", icon: CreditCard },
  { value: "MISSION", label: "Mission", hint: "Execution, client ou pro", icon: BriefcaseBusiness },
  { value: "ACCOUNT", label: "Compte", hint: "Profil, acces ou verification", icon: UserRound },
  { value: "TECHNICAL", label: "Technique", hint: "App, bug ou chargement", icon: Wrench },
  { value: "DISPUTE", label: "Litige", hint: "Conflit ou arbitrage", icon: ShieldAlert },
  { value: "OTHER", label: "Autre", hint: "Question generale", icon: MoreHorizontal },
] satisfies Array<{
  value: TicketCategory;
  label: string;
  hint: string;
  icon: LucideIcon;
}>;

const PRIORITY_OPTIONS: Array<{ value: TicketPriority; label: string; hint: string }> = [
  { value: "NORMAL", label: "Normal", hint: "Suivi standard" },
  { value: "HIGH", label: "Elevee", hint: "Impact operationnel" },
  { value: "URGENT", label: "Urgente", hint: "Paiement ou litige bloque" },
  { value: "LOW", label: "Basse", hint: "Question non bloquante" },
];

const FILTER_OPTIONS: Array<{ value: TicketFilter; label: string }> = [
  { value: "all", label: "Tous" },
  { value: "action", label: "A repondre" },
  { value: "processing", label: "En traitement" },
  { value: "done", label: "Fermes" },
];

const STATUS_CONFIG: Record<
  SupportTicket["status"],
  { label: string; detail: string; badgeClassName: string; order: number }
> = {
  WAITING_USER: {
    label: "A repondre",
    detail: "WorkOn attend votre retour",
    badgeClassName: "border-amber-200 bg-amber-100 text-amber-900",
    order: 0,
  },
  OPEN: {
    label: "Ouvert",
    detail: "Nouveau ticket a trier",
    badgeClassName: "border-blue-200 bg-blue-100 text-blue-900",
    order: 1,
  },
  IN_PROGRESS: {
    label: "En cours",
    detail: "Un suivi est en marche",
    badgeClassName: "border-violet-200 bg-violet-100 text-violet-900",
    order: 2,
  },
  WAITING_ADMIN: {
    label: "Support",
    detail: "L'equipe WorkOn doit repondre",
    badgeClassName: "border-orange-200 bg-orange-100 text-orange-900",
    order: 3,
  },
  RESOLVED: {
    label: "Resolu",
    detail: "Solution proposee",
    badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-900",
    order: 4,
  },
  CLOSED: {
    label: "Ferme",
    detail: "Conversation archivee",
    badgeClassName: "border-stone-200 bg-stone-100 text-stone-700",
    order: 5,
  },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; badgeClassName: string; order: number }> = {
  LOW: { label: "Basse", badgeClassName: "border-stone-200 bg-stone-100 text-stone-700", order: 1 },
  NORMAL: { label: "Normal", badgeClassName: "border-blue-200 bg-blue-100 text-blue-900", order: 2 },
  HIGH: { label: "Elevee", badgeClassName: "border-amber-200 bg-amber-100 text-amber-900", order: 3 },
  URGENT: { label: "Urgente", badgeClassName: "border-red-200 bg-red-100 text-red-800", order: 4 },
};

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filter, setFilter] = useState<TicketFilter>("all");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("OTHER");
  const [priority, setPriority] = useState<TicketPriority>("NORMAL");
  const [replyContent, setReplyContent] = useState("");

  const { data: tickets = [], error, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => api.getMyTickets(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
      }),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket cree");
      setShowCreate(false);
      setSelectedTicket(ticket);
      setSubject("");
      setDescription("");
      setCategory("OTHER");
      setPriority("NORMAL");
    },
    onError: () => toast.error("Erreur lors de la creation du ticket"),
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicket) throw new Error("No ticket selected");
      await api.addTicketMessage(selectedTicket.id, { content: replyContent.trim() });
      return api.getTicket(selectedTicket.id);
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Message envoye");
      setReplyContent("");
      setSelectedTicket(ticket);
    },
    onError: () => toast.error("Erreur lors de l'envoi"),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => api.closeTicket(id),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket ferme");
      setSelectedTicket(ticket);
    },
    onError: () => toast.error("Erreur lors de la fermeture"),
  });

  const ticketViews = useMemo(() => {
    return tickets
      .map((ticket) => getTicketView(ticket))
      .sort((a, b) => {
        const statusDelta = a.status.order - b.status.order;
        if (statusDelta !== 0) return statusDelta;
        const priorityDelta = b.priority.order - a.priority.order;
        if (priorityDelta !== 0) return priorityDelta;
        return toTimestamp(b.lastActivityAt) - toTimestamp(a.lastActivityAt);
      });
  }, [tickets]);

  const stats = useMemo(() => {
    const active = ticketViews.filter((item) => !isTicketDone(item.ticket));
    return {
      active: active.length,
      actionRequired: ticketViews.filter((item) => item.ticket.status === "WAITING_USER").length,
      highPriority: active.filter(
        (item) => item.ticket.priority === "HIGH" || item.ticket.priority === "URGENT",
      ).length,
      resolved: ticketViews.filter((item) => isTicketDone(item.ticket)).length,
    };
  }, [ticketViews]);

  const filteredTickets = useMemo(() => {
    return ticketViews.filter((item) => {
      if (filter === "action") return item.ticket.status === "WAITING_USER";
      if (filter === "processing") return ["OPEN", "IN_PROGRESS", "WAITING_ADMIN"].includes(item.ticket.status);
      if (filter === "done") return isTicketDone(item.ticket);
      return true;
    });
  }, [filter, ticketViews]);

  if (selectedTicket) {
    return (
      <TicketDetail
        ticket={selectedTicket}
        replyContent={replyContent}
        replyPending={replyMutation.isPending}
        closePending={closeMutation.isPending}
        onBack={() => setSelectedTicket(null)}
        onReplyContentChange={setReplyContent}
        onReply={() => replyMutation.mutate()}
        onClose={() => closeMutation.mutate(selectedTicket.id)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-workon-bg px-4 pb-32 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-workon-primary">Support</p>
            <h1 className="text-3xl font-bold text-workon-ink md:text-4xl">Centre d&apos;aide</h1>
            <p className="mt-2 max-w-2xl text-sm text-workon-muted md:text-base">
              Suis tes demandes, repere les reponses attendues et garde une trace claire des sujets sensibles.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="w-full md:w-auto">
            <Plus className="h-4 w-4" />
            Nouveau ticket
          </Button>
        </header>

        <section className="grid grid-cols-4 gap-2 sm:gap-3">
          <MetricTile icon={LifeBuoy} label="Actifs" value={String(stats.active)} detail="Tickets ouverts" />
          <MetricTile icon={CircleAlert} label="A repondre" value={String(stats.actionRequired)} detail="Action requise" />
          <MetricTile icon={AlertTriangle} label="Prioritaires" value={String(stats.highPriority)} detail="Eleve ou urgent" />
          <MetricTile icon={CheckCircle2} label="Fermes" value={String(stats.resolved)} detail="Resolus ou archives" />
        </section>

        <div className="grid grid-cols-4 gap-1 rounded-2xl border border-workon-border bg-white p-2 shadow-sm md:flex md:gap-2 md:overflow-x-auto">
          {FILTER_OPTIONS.map((option) => {
            const selected = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(option.value)}
                className={`min-w-0 rounded-xl px-2 py-2 text-xs font-semibold transition sm:text-sm md:shrink-0 md:px-4 ${
                  selected
                    ? "bg-workon-primary text-white shadow-sm"
                    : "text-workon-muted hover:bg-workon-bg-cream hover:text-workon-ink"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-workon-primary border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <XCircle className="mx-auto mb-3 h-10 w-10 text-red-600" />
            <h2 className="text-xl font-bold text-red-800">Impossible de charger les tickets</h2>
            <p className="mt-2 text-sm text-red-700">
              Reessaie dans un instant. Les messages existants ne sont pas perdus.
            </p>
          </div>
        )}

        {!isLoading && !error && ticketViews.length === 0 && <EmptyTickets onCreate={() => setShowCreate(true)} />}

        {!isLoading && !error && ticketViews.length > 0 && filteredTickets.length === 0 && (
          <div className="rounded-3xl border border-workon-border bg-white p-10 text-center shadow-sm">
            <Inbox className="mx-auto mb-4 h-12 w-12 text-workon-gray/40" />
            <h2 className="text-xl font-semibold text-workon-ink">Rien dans ce filtre</h2>
            <p className="mt-2 text-sm text-workon-muted">Change de filtre pour revoir toutes tes demandes support.</p>
          </div>
        )}

        {filteredTickets.length > 0 && (
          <div className="space-y-4">
            {filteredTickets.map((item) => (
              <SupportTicketCard key={item.ticket.id} item={item} onSelect={() => setSelectedTicket(item.ticket)} />
            ))}
          </div>
        )}
      </div>

      <CreateTicketDialog
        open={showCreate}
        subject={subject}
        description={description}
        category={category}
        priority={priority}
        isPending={createMutation.isPending}
        onOpenChange={setShowCreate}
        onSubjectChange={setSubject}
        onDescriptionChange={setDescription}
        onCategoryChange={setCategory}
        onPriorityChange={setPriority}
        onSubmit={() => createMutation.mutate()}
      />
    </div>
  );
}

function TicketDetail({
  ticket,
  replyContent,
  replyPending,
  closePending,
  onBack,
  onReplyContentChange,
  onReply,
  onClose,
}: {
  ticket: SupportTicket;
  replyContent: string;
  replyPending: boolean;
  closePending: boolean;
  onBack: () => void;
  onReplyContentChange: (value: string) => void;
  onReply: () => void;
  onClose: () => void;
}) {
  const view = getTicketView(ticket);
  const messages = getTicketMessages(ticket);
  const canReply = replyContent.trim().length > 0 && !isTicketDone(ticket);
  const canClose = !isTicketDone(ticket);

  return (
    <div className="min-h-screen bg-workon-bg px-4 pb-32 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Button variant="outline" onClick={onBack} className="bg-white">
          <ArrowLeft className="h-4 w-4" />
          Retour aux tickets
        </Button>

        <section className="rounded-3xl border border-workon-border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={view.status.badgeClassName}>
                  {view.status.label}
                </Badge>
                <Badge variant="outline" className={view.priority.badgeClassName}>
                  {view.priority.label}
                </Badge>
                <span className="text-xs font-semibold text-workon-muted">{view.displayId}</span>
              </div>
              <h1 className="break-words text-2xl font-bold text-workon-ink sm:text-3xl">{ticket.subject}</h1>
              <p className="mt-2 text-sm text-workon-muted">{ticket.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px] lg:grid-cols-1">
              <InfoPill icon={view.category.icon} label="Categorie" value={view.category.label} detail={view.category.hint} />
              <InfoPill icon={Clock3} label="Activite" value={view.ageLabel} detail={formatDateTime(view.lastActivityAt)} />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-4">
            <div className="rounded-3xl border border-workon-border bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-workon-ink">
                <MessageSquare className="h-5 w-5 text-workon-primary" />
                Conversation
              </h2>
              <div className="space-y-3">
                <MessageBubble
                  message={{
                    content: ticket.description,
                    createdAt: ticket.createdAt,
                    senderType: "user",
                  }}
                  isInitial
                />
                {messages.map((message, index) => (
                  <MessageBubble key={message.id ?? `${message.createdAt ?? "message"}-${index}`} message={message} />
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-workon-border bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-workon-ink">Repondre</h2>
                {isTicketDone(ticket) && <Badge variant="outline">Lecture seule</Badge>}
              </div>
              <Textarea
                value={replyContent}
                onChange={(event) => onReplyContentChange(event.target.value)}
                placeholder="Votre message..."
                disabled={isTicketDone(ticket) || replyPending}
                className="min-h-[120px]"
              />
              <div className="mt-4 flex justify-end">
                <Button onClick={onReply} disabled={!canReply || replyPending}>
                  {replyPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Envoyer
                </Button>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-workon-border bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-workon-muted">Prochaine etape</p>
              <p className="mt-2 font-bold text-workon-ink">{view.nextStep.label}</p>
              <p className="mt-1 text-sm text-workon-muted">{view.nextStep.detail}</p>
            </div>
            <DetailRow icon={Tag} label="Ouvert le" value={formatDate(ticket.createdAt)} detail={view.displayId} />
            <DetailRow icon={Clock3} label="Derniere activite" value={formatDateTime(view.lastActivityAt)} detail={view.status.detail} />
            <Button
              variant="outline"
              onClick={onClose}
              disabled={!canClose || closePending}
              className="w-full border-workon-border bg-white"
            >
              {closePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Fermer le ticket
            </Button>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SupportTicketCard({ item, onSelect }: { item: ReturnType<typeof getTicketView>; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-label={`Ouvrir ${item.ticket.subject}`}
      onClick={onSelect}
      className="w-full rounded-3xl border border-workon-border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-workon-primary/50 hover:shadow-md sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={item.status.badgeClassName}>
              {item.status.label}
            </Badge>
            <Badge variant="outline" className={item.priority.badgeClassName}>
              {item.priority.label}
            </Badge>
            <span className="text-xs font-semibold text-workon-muted">{item.displayId}</span>
          </div>
          <h2 className="break-words text-lg font-bold text-workon-ink">{item.ticket.subject}</h2>
          <p className="mt-2 line-clamp-2 text-sm text-workon-muted">{item.ticket.description}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:w-[460px]">
          <MiniFact icon={item.category.icon} label={item.category.label} value={item.category.hint} />
          <div className="hidden sm:block">
            <MiniFact
              icon={MessageSquare}
              label={`${getTicketMessages(item.ticket).length + 1} message(s)`}
              value={item.ageLabel}
            />
          </div>
          <div className="hidden rounded-2xl border border-workon-border bg-workon-bg-cream p-3 sm:block">
            <p className="text-sm font-semibold text-workon-muted">Prochaine etape</p>
            <p className="mt-1 font-semibold text-workon-ink">{item.nextStep.label}</p>
            <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-workon-primary">
              Ouvrir <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function CreateTicketDialog({
  open,
  subject,
  description,
  category,
  priority,
  isPending,
  onOpenChange,
  onSubjectChange,
  onDescriptionChange,
  onCategoryChange,
  onPriorityChange,
  onSubmit,
}: {
  open: boolean;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubjectChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: TicketCategory) => void;
  onPriorityChange: (value: TicketPriority) => void;
  onSubmit: () => void;
}) {
  const canSubmit = subject.trim().length >= 5 && description.trim().length >= 20;
  const subjectId = "support-ticket-subject";
  const categoryId = "support-ticket-category";
  const priorityId = "support-ticket-priority";
  const descriptionId = "support-ticket-description";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) onSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Nouveau ticket</DialogTitle>
            <DialogDescription>
              Decris le probleme avec assez de contexte pour accelerer le triage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label htmlFor={subjectId} className="block">
              <span className="mb-1 block text-sm font-semibold text-workon-muted">Sujet</span>
              <input
                id={subjectId}
                value={subject}
                onChange={(event) => onSubjectChange(event.target.value)}
                placeholder="Resume du probleme..."
                className="flex h-10 w-full rounded-2xl border border-workon-border bg-white px-3 py-2 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:outline-none focus:ring-2 focus:ring-workon-primary/40"
                maxLength={200}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label htmlFor={categoryId} className="block">
                <span className="mb-1 block text-sm font-semibold text-workon-muted">Categorie</span>
                <select
                  id={categoryId}
                  value={category}
                  onChange={(event) => onCategoryChange(event.target.value as TicketCategory)}
                  className="h-11 w-full rounded-2xl border border-workon-border bg-white px-3 text-sm font-semibold text-workon-ink shadow-sm focus:border-workon-primary focus:outline-none focus:ring-2 focus:ring-workon-primary/30"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label htmlFor={priorityId} className="block">
                <span className="mb-1 block text-sm font-semibold text-workon-muted">Priorite</span>
                <select
                  id={priorityId}
                  value={priority}
                  onChange={(event) => onPriorityChange(event.target.value as TicketPriority)}
                  className="h-11 w-full rounded-2xl border border-workon-border bg-white px-3 text-sm font-semibold text-workon-ink shadow-sm focus:border-workon-primary focus:outline-none focus:ring-2 focus:ring-workon-primary/30"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label htmlFor={descriptionId} className="block">
              <span className="mb-1 block text-sm font-semibold text-workon-muted">Description</span>
              <textarea
                id={descriptionId}
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                placeholder="Explique ce qui bloque, ce que tu as tente et ce que tu attends de WorkOn..."
                rows={6}
                className="flex min-h-[80px] w-full rounded-2xl border border-workon-border bg-white px-3 py-2 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:outline-none focus:ring-2 focus:ring-workon-primary/40"
                maxLength={2000}
              />
            </label>

            <div className="rounded-2xl border border-workon-border bg-workon-bg-cream p-4">
              <p className="text-sm font-semibold text-workon-ink">Minimum requis</p>
              <p className="mt-1 text-sm text-workon-muted">
                Sujet de 5 caracteres et description de 20 caracteres pour respecter la validation backend.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!canSubmit || isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Creer le ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MessageBubble({ message, isInitial = false }: { message: TicketMessage; isInitial?: boolean }) {
  const sender = getMessageSender(message);
  const isAdmin = sender === "admin";

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isAdmin
          ? "border-blue-200 bg-blue-50"
          : isInitial
            ? "border-workon-border bg-workon-bg-cream"
            : "border-workon-border bg-white"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-workon-ink">
          {isAdmin ? "Support WorkOn" : isInitial ? "Description initiale" : "Vous"}
        </p>
        {message.createdAt && <p className="text-xs text-workon-muted">{formatDateTime(message.createdAt)}</p>}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-workon-muted">
        {message.content || "Message sans contenu"}
      </p>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-white p-2 shadow-sm sm:p-4">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-workon-bg-cream text-workon-primary sm:mb-3 sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <p className="text-xs font-semibold text-workon-muted sm:text-sm">{label}</p>
      <p className="mt-1 text-lg font-bold text-workon-ink sm:text-2xl">{value}</p>
      <p className="mt-1 hidden text-xs text-workon-muted sm:block">{detail}</p>
    </div>
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-white px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-workon-muted">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="truncate font-semibold text-workon-ink">{value}</p>
      <p className="mt-1 truncate text-sm text-workon-muted">{detail}</p>
    </div>
  );
}

function MiniFact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-workon-border bg-workon-bg-cream p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-workon-muted">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="text-sm text-workon-muted">{value}</p>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-workon-bg-cream p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-workon-muted">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="font-semibold text-workon-ink">{value}</p>
      <p className="mt-1 text-sm text-workon-muted">{detail}</p>
    </div>
  );
}

function EmptyTickets({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-3xl border border-workon-border bg-white p-12 text-center shadow-sm">
      <HelpCircle className="mx-auto mb-4 h-14 w-14 text-workon-gray/40" />
      <h2 className="mb-2 text-xl font-semibold text-workon-ink">Aucun ticket ouvert</h2>
      <p className="mx-auto max-w-xl text-workon-muted">
        Cree un ticket quand un paiement, une mission, un compte ou un detail technique demande un suivi.
      </p>
      <Button onClick={onCreate} className="mt-6">
        <Plus className="h-4 w-4" />
        Nouveau ticket
      </Button>
    </div>
  );
}

function getTicketView(ticket: SupportTicket) {
  const priority = getPriorityConfig(ticket.priority);
  const category = getCategoryMeta(ticket.category);
  const lastActivityAt = getLastActivityAt(ticket);

  return {
    ticket,
    status: STATUS_CONFIG[ticket.status],
    priority,
    category,
    lastActivityAt,
    ageLabel: getAgeLabel(lastActivityAt),
    displayId: getTicketDisplayId(ticket.id),
    nextStep: getNextStep(ticket),
  };
}

function getCategoryMeta(category: string) {
  return CATEGORY_OPTIONS.find((option) => option.value === category) ?? CATEGORY_OPTIONS[CATEGORY_OPTIONS.length - 1];
}

function getPriorityConfig(priority: string) {
  if (priority === "LOW" || priority === "HIGH" || priority === "URGENT") return PRIORITY_CONFIG[priority];
  return PRIORITY_CONFIG.NORMAL;
}

function getTicketMessages(ticket: SupportTicket) {
  const messages = (ticket as TicketWithMeta).messages;
  return Array.isArray(messages) ? (messages as TicketMessage[]) : [];
}

function getLastActivityAt(ticket: SupportTicket) {
  const messages = getTicketMessages(ticket);
  const lastMessage = messages.reduce<TicketMessage | null>((latest, message) => {
    if (!message.createdAt) return latest;
    if (!latest?.createdAt) return message;
    return toTimestamp(message.createdAt) > toTimestamp(latest.createdAt) ? message : latest;
  }, null);

  return lastMessage?.createdAt ?? (ticket as TicketWithMeta).updatedAt ?? ticket.createdAt;
}

function getNextStep(ticket: SupportTicket) {
  if (ticket.status === "WAITING_USER") {
    return {
      label: "Votre reponse est attendue",
      detail: "Ajoute l'information demandee pour debloquer le suivi.",
    };
  }
  if (ticket.status === "WAITING_ADMIN") {
    return {
      label: "WorkOn doit repondre",
      detail: "Le ticket est dans la file support.",
    };
  }
  if (ticket.status === "IN_PROGRESS") {
    return {
      label: "Investigation en cours",
      detail: "Garde les preuves et les details regroupes ici.",
    };
  }
  if (ticket.status === "RESOLVED") {
    return {
      label: "Solution recue",
      detail: "Ferme le ticket si tout est regle.",
    };
  }
  if (ticket.status === "CLOSED") {
    return {
      label: "Ticket archive",
      detail: "La conversation reste disponible en lecture.",
    };
  }
  return {
    label: "Premier triage",
    detail: "Le support va classer la demande et repondre.",
  };
}

function isTicketDone(ticket: SupportTicket) {
  return ticket.status === "RESOLVED" || ticket.status === "CLOSED";
}

function getTicketDisplayId(ticketId: string) {
  const compact = ticketId.replace(/^ticket[_-]?/i, "").replace(/[^a-z0-9]/gi, "");
  return `SUP-${compact.slice(0, 6).toUpperCase() || ticketId.slice(0, 6).toUpperCase()}`;
}

function getMessageSender(message: TicketMessage) {
  const sender = (message.senderType ?? message.senderRole ?? "").toLowerCase();
  return sender === "admin" ? "admin" : "user";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getAgeLabel(value: string | null | undefined) {
  const timestamp = toTimestamp(value);
  if (!timestamp) return "Date inconnue";
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  return `${days} j`;
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}
