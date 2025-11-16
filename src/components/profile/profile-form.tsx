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
      <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6 text-white/70">
        Chargement du profil...
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6 text-sm text-red-200">
        Erreur : {error}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm text-white/70">Nom complet</label>
        <input
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 text-white focus:border-red-500 focus:outline-none"
          placeholder="Alex Tremblay"
        />
      </div>

      <div>
        <label className="text-sm text-white/70">Téléphone</label>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 text-white focus:border-red-500 focus:outline-none"
          placeholder="+1 514 555 1234"
        />
      </div>

      <div>
        <label className="text-sm text-white/70">Ville</label>
        <input
          type="text"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 text-white focus:border-red-500 focus:outline-none"
          placeholder="Montréal, QC"
        />
      </div>

      {statusMessage ? (
        <p
          className={`text-sm ${
            status === "success" ? "text-green-400" : "text-red-400"
          }`}
        >
          {statusMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !profile}
        className="w-full rounded-2xl bg-red-600 px-6 py-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-red-500 disabled:opacity-70"
      >
        {isPending ? "Enregistrement..." : "Sauvegarder"}
      </button>
    </form>
  );
}
