"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useProfile } from "@/hooks/use-profile";
import { api } from "@/lib/api-client";
import { SkillSelector } from "@/components/skills/skill-selector";
import { AvailabilityEditor } from "@/components/availability/availability-editor";

export function ProfileForm() {
  const { profile, isLoading, error, updateProfile, refetch } = useProfile();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [avatarMessageType, setAvatarMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? "");
      setPhone(profile.phone ?? "");
      setCity(profile.city ?? "");
      setAvatarPreview(profile.pictureUrl ?? null);
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
      <div className="rounded-2xl border border-workon-accent/30 bg-workon-accent/5 p-6 text-sm text-workon-accent">
        Erreur : {error}
      </div>
    );
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setAvatarMessage("Format invalide. Utilise JPEG, PNG ou WebP.");
      setAvatarMessageType("error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage("Fichier trop volumineux (max 5 Mo).");
      setAvatarMessageType("error");
      return;
    }

    // Compress image to max 200x200 JPEG, then convert to base64
    setAvatarMessage(null);
    setIsUploadingAvatar(true);

    const compressImage = (src: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX = 200;
          let w = img.width;
          let h = img.height;
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Canvas not supported")); return; }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = URL.createObjectURL(src);
      });
    };

    try {
      const dataUri = await compressImage(file);
      setAvatarPreview(dataUri);
      await api.updateAvatar(dataUri);
      await refetch();
      setAvatarMessage("Photo mise a jour !");
      setAvatarMessageType("success");
    } catch (uploadError) {
      setAvatarMessage(
        uploadError instanceof Error
          ? uploadError.message
          : "Impossible de sauvegarder la photo.",
      );
      setAvatarMessageType("error");
      setAvatarPreview(profile?.pictureUrl ?? null);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const initials = (profile?.fullName ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Avatar section */}
      <div className="flex flex-col items-center gap-3 pb-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAvatar}
          className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-workon-border bg-workon-bg transition hover:border-workon-primary focus:outline-none focus:ring-2 focus:ring-workon-primary focus:ring-offset-2 disabled:opacity-70"
        >
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Photo de profil"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-workon-muted">
              {initials}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
            {isUploadingAvatar ? "..." : "Modifier"}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <p className="text-xs text-workon-muted">
          Clique pour changer ta photo (JPEG, PNG, WebP, max 5 Mo)
        </p>
        {avatarMessage ? (
          <p
            className={`text-xs ${
              avatarMessageType === "success" ? "text-workon-trust-green" : "text-workon-accent"
            }`}
          >
            {avatarMessage}
          </p>
        ) : null}
      </div>

      <div>
        <label className="text-sm text-workon-muted">Nom complet</label>
        <input
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-workon-border bg-workon-bg px-4 py-3 text-workon-ink focus:border-workon-primary focus:outline-none"
          placeholder="Alex Tremblay"
        />
      </div>

      <div>
        <label className="text-sm text-workon-muted">Téléphone</label>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-workon-border bg-workon-bg px-4 py-3 text-workon-ink focus:border-workon-primary focus:outline-none"
          placeholder="+1 514 555 1234"
        />
      </div>

      <div>
        <label className="text-sm text-workon-muted">Ville</label>
        <input
          type="text"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-workon-border bg-workon-bg px-4 py-3 text-workon-ink focus:border-workon-primary focus:outline-none"
          placeholder="Montréal, QC"
        />
      </div>

      {statusMessage ? (
        <p
          className={`text-sm ${
            status === "success" ? "text-workon-trust-green" : "text-workon-accent"
          }`}
        >
          {statusMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !profile}
        className="w-full rounded-2xl bg-workon-primary px-6 py-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-workon-primary-hover disabled:opacity-70 shadow-md shadow-workon-primary/25"
      >
        {isPending ? "Enregistrement..." : "Sauvegarder"}
      </button>

      {/* Skill selector section */}
      <div className="mt-8 border-t border-workon-border pt-8">
        <p className="text-sm uppercase tracking-[0.4em] text-workon-muted">Competences</p>
        <h3 className="mt-2 text-lg font-semibold text-workon-ink">Tes competences</h3>
        <p className="mt-1 text-sm text-workon-muted">
          Selectionne les competences que tu offres pour apparaitre dans les recherches.
        </p>
        <div className="mt-4">
          <SkillSelector />
        </div>
      </div>

      {/* Availability section */}
      <div className="mt-8 border-t border-workon-border pt-8">
        <p className="text-sm uppercase tracking-[0.4em] text-workon-muted">Horaire</p>
        <h3 className="mt-2 text-lg font-semibold text-workon-ink">Disponibilites</h3>
        <p className="mt-1 text-sm text-workon-muted">
          Configure tes plages horaires pour chaque jour de la semaine.
        </p>
        <div className="mt-4">
          <AvailabilityEditor />
        </div>
      </div>
    </form>
  );
}
