"use client";

import { useEffect, useState, useTransition } from "react";
import { useProfile } from "@/hooks/use-profile";

export function ProfileForm() {
  const { profile, isLoading, error, updateProfile } = useProfile();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? "");
      setPhone(profile.phone ?? "");
      setCity(profile.city ?? "");
    }
  }, [profile]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("idle");
    setStatusMessage(null);

    if (!fullName.trim() || !phone.trim() || !city.trim()) {
      setStatus("error");
      setStatusMessage("Merci de compléter tous les champs.");
      return;
    }

    startTransition(async () => {
      try {
        await updateProfile({
          fullName: fullName.trim(),
          phone: phone.trim(),
          city: city.trim(),
        });
        setStatus("success");
        setStatusMessage("Profil mis à jour ✨");
      } catch (updateError) {
        setStatus("error");
        setStatusMessage(
          updateError instanceof Error
            ? updateError.message
            : "Impossible de sauvegarder les modifications.",
        );
      }
    });
  };

  if (isLoading && !profile) {
    return (
      <div className="rounded-2xl border border-workon-border bg-workon-bg/60 p-6 text-workon-muted">
        Chargement du profil...
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="rounded-2xl border border-[#B5382A]/30 bg-[#B5382A]/5 p-6 text-sm text-workon-accent">
        Erreur : {error}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm text-workon-muted">Nom complet</label>
        <input
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-workon-border bg-workon-bg px-4 py-3 text-[#1B1A18] focus:border-[#134021] focus:outline-none"
          placeholder="Alex Tremblay"
        />
      </div>

      <div>
        <label className="text-sm text-workon-muted">Téléphone</label>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-workon-border bg-workon-bg px-4 py-3 text-[#1B1A18] focus:border-[#134021] focus:outline-none"
          placeholder="+1 514 555 1234"
        />
      </div>

      <div>
        <label className="text-sm text-workon-muted">Ville</label>
        <input
          type="text"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-workon-border bg-workon-bg px-4 py-3 text-[#1B1A18] focus:border-[#134021] focus:outline-none"
          placeholder="Montréal, QC"
        />
      </div>

      {statusMessage ? (
        <p
          className={`text-sm ${
            status === "success" ? "text-[#22C55E]" : "text-workon-accent"
          }`}
        >
          {statusMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !profile}
        className="w-full rounded-2xl bg-[#134021] px-6 py-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#0F3319] disabled:opacity-70 shadow-md shadow-[#134021]/25"
      >
        {isPending ? "Enregistrement..." : "Sauvegarder"}
      </button>
    </form>
  );
}
