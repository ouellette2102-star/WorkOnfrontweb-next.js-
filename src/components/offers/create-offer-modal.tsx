"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  missionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateOfferModal({ missionId, isOpen, onClose, onSuccess }: Props) {
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || submitting) return;

    setSubmitting(true);
    try {
      await api.createOffer({
        missionId,
        price: parseFloat(price),
        message: message.trim() || undefined,
      });
      toast.success("Offre envoyée !");
      onSuccess();
      onClose();
      setPrice("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#EAE6DF] bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1B1A18]">Faire une offre</h2>
          <button onClick={onClose} className="text-[#9C9A96] hover:text-[#1B1A18]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[#706E6A]">
              Votre prix ($) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="50.00"
              required
              className="bg-[#F9F8F5]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#706E6A]">
              Message (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre expérience ou posez des questions..."
              className="w-full rounded-xl border border-[#EAE6DF] bg-[#F9F8F5] px-4 py-2.5 text-sm text-[#1B1A18] placeholder-[#9C9A96] focus:border-[#134021] focus:outline-none"
              rows={3}
              maxLength={500}
            />
            <p className="mt-1 text-right text-xs text-[#9C9A96]">
              {message.length}/500
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#EAE6DF]"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!price || submitting}
              className="flex-1 bg-red-600 hover:bg-red-500"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Envoyer l&apos;offre
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
