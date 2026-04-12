"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  localMissionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function OpenDisputeModal({ localMissionId, isOpen, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: () => api.createDispute({ localMissionId, reason, description }),
    onSuccess: () => {
      toast.success("Litige ouvert avec succes");
      setReason("");
      setDescription("");
      onSuccess?.();
      onClose();
    },
    onError: () => toast.error("Erreur lors de l'ouverture du litige"),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[#EAE6DF] bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-bold text-[#1B1A18]">Ouvrir un litige</h2>
          </div>
          <button onClick={onClose} className="text-[#9C9A96] hover:text-[#1B1A18]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1B1A18]">
              Raison *
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Travail non effectue, qualite insuffisante..."
              className="border-[#EAE6DF] bg-[#F9F8F5] text-[#1B1A18] placeholder-[#9C9A96]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1B1A18]">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Decrivez le probleme en detail..."
              rows={4}
              className="w-full rounded-xl border border-[#EAE6DF] bg-[#F9F8F5] p-3 text-[#1B1A18] placeholder-[#9C9A96] focus:border-[#134021] focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!reason.trim() || !description.trim() || createMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-500"
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="mr-2 h-4 w-4" />
              )}
              Ouvrir le litige
            </Button>
            <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
