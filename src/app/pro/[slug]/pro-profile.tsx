"use client";

import { useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

interface GalleryItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  type: string;
}

interface ProData {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  city: string | null;
  pictureUrl: string | null;
  bio: string | null;
  category: string | null;
  serviceRadiusKm: number | null;
  completionScore: number | null;
  slug: string;
  verified: boolean;
  memberSince: string;
  demandCount: number;
  gallery: GalleryItem[];
}

const CATEGORY_LABELS: Record<string, string> = {
  menage: "Ménage résidentiel",
  paysagement: "Entretien paysager",
  lavage: "Lavage de vitres",
  deneigement: "Déneigement",
  renovation: "Rénovation",
  plomberie: "Plomberie",
  electricite: "Électricité",
};

const CA_PHONE_REGEX = /^(\+?1?[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "Le numéro de téléphone est requis";
  if (!CA_PHONE_REGEX.test(phone)) return "Format invalide (ex: 514-555-1234)";
  return null;
}

export function ProProfile({ pro }: { pro: ProData }) {
  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    serviceRequested: pro.category
      ? CATEGORY_LABELS[pro.category] || pro.category
      : "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.clientName.trim()) newErrors.clientName = "Le nom est requis";
    const phoneErr = validatePhone(form.clientPhone);
    if (phoneErr) newErrors.clientPhone = phoneErr;
    if (!form.serviceRequested.trim())
      newErrors.serviceRequested = "Le service demandé est requis";
    if (form.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail))
      newErrors.clientEmail = "Format de courriel invalide";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;
    setSubmitting(true);

    try {
      // API_BASE already includes /api/v1 (matches NEXT_PUBLIC_API_URL
      // convention used everywhere in api-client.ts). Adding /api/v1
      // again here doubled the prefix and 404'd every submission.
      const res = await fetch(`${API_BASE}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          professionalId: pro.id,
          source: "pro_page",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur lors de l'envoi");
      }

      setSubmitted(true);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const categoryLabel = pro.category
    ? CATEGORY_LABELS[pro.category] || pro.category
    : "Professionnel";

  const portfolioImages = pro.gallery?.filter((m) => m.type === "portfolio") || [];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero */}
      <header className="bg-[#1A1A2E] text-white">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {pro.pictureUrl ? (
                <img
                  src={pro.pictureUrl}
                  alt={pro.fullName}
                  className="w-24 h-24 rounded-full object-cover border-2 border-workon-accent"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-workon-primary flex items-center justify-center text-3xl font-bold">
                  {pro.firstName[0]}
                  {pro.lastName[0]}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{pro.fullName}</h1>
                {pro.verified && (
                  <span className="bg-workon-trust-green text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Vérifié
                  </span>
                )}
              </div>
              <p className="text-workon-accent font-medium text-lg">
                {categoryLabel}
              </p>
              {pro.city && (
                <p className="text-gray-400 mt-1">📍 {pro.city}</p>
              )}
              {pro.serviceRadiusKm && (
                <p className="text-gray-500 text-sm">
                  Zone de service : {pro.serviceRadiusKm} km
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-workon-accent">
                {pro.demandCount}
              </p>
              <p className="text-gray-400 text-sm">Demandes reçues</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-workon-accent">
                {pro.completionScore || 0}%
              </p>
              <p className="text-gray-400 text-sm">Profil complété</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-workon-accent">
                {new Date(pro.memberSince).getFullYear()}
              </p>
              <p className="text-gray-400 text-sm">Membre depuis</p>
            </div>
          </div>

          {/* CTA in hero */}
          <div className="mt-8 text-center">
            <a
              href="#demande"
              className="inline-block bg-workon-primary text-white font-semibold px-8 py-3 rounded-lg hover:bg-workon-primary-hover transition-colors text-lg"
            >
              Demander une soumission
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {/* Bio */}
        {pro.bio && (
          <section>
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-3">
              À propos
            </h2>
            <p className="text-gray-700 leading-relaxed">{pro.bio}</p>
          </section>
        )}

        {/* Gallery */}
        {portfolioImages.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-4">
              Réalisations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {portfolioImages.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.imageUrl}
                    alt={img.caption || `Réalisation de ${pro.fullName}`}
                    className="w-full h-48 object-cover rounded-lg"
                    loading="lazy"
                  />
                  {img.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Demand Capture Form */}
        <section
          id="demande"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
        >
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-workon-trust-green rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">
                Demande envoyée
              </h3>
              <p className="text-gray-600">
                Votre demande a été envoyée à {pro.fullName}.
                <br />
                Il vous contactera sous 2 heures.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-[#1A1A2E] mb-1">
                Demander une soumission
              </h2>
              <p className="text-gray-500 mb-6">
                Décrivez votre besoin et {pro.firstName} vous contactera
                rapidement.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Client Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Votre nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.clientName}
                    onChange={(e) => {
                      setForm({ ...form, clientName: e.target.value });
                      if (errors.clientName) setErrors({ ...errors, clientName: "" });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-workon-primary focus:border-transparent outline-none text-gray-900 ${
                      errors.clientName ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                    placeholder="Jean Tremblay"
                  />
                  {errors.clientName && (
                    <p className="text-red-500 text-sm mt-1">{errors.clientName}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.clientPhone}
                    onChange={(e) => {
                      setForm({ ...form, clientPhone: e.target.value });
                      if (errors.clientPhone) setErrors({ ...errors, clientPhone: "" });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-workon-primary focus:border-transparent outline-none text-gray-900 ${
                      errors.clientPhone ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                    placeholder="514-555-1234"
                  />
                  {errors.clientPhone && (
                    <p className="text-red-500 text-sm mt-1">{errors.clientPhone}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Courriel (optionnel)
                  </label>
                  <input
                    type="email"
                    value={form.clientEmail}
                    onChange={(e) => {
                      setForm({ ...form, clientEmail: e.target.value });
                      if (errors.clientEmail) setErrors({ ...errors, clientEmail: "" });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-workon-primary focus:border-transparent outline-none text-gray-900 ${
                      errors.clientEmail ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                    placeholder="jean@example.com"
                  />
                  {errors.clientEmail && (
                    <p className="text-red-500 text-sm mt-1">{errors.clientEmail}</p>
                  )}
                </div>

                {/* Service */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service demandé *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.serviceRequested}
                    onChange={(e) => {
                      setForm({ ...form, serviceRequested: e.target.value });
                      if (errors.serviceRequested) setErrors({ ...errors, serviceRequested: "" });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-workon-primary focus:border-transparent outline-none text-gray-900 ${
                      errors.serviceRequested ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                    placeholder="Entretien paysager"
                  />
                  {errors.serviceRequested && (
                    <p className="text-red-500 text-sm mt-1">{errors.serviceRequested}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (optionnel)
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-workon-primary focus:border-transparent outline-none resize-none text-gray-900"
                    placeholder="Décrivez votre besoin..."
                  />
                </div>

                {apiError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {apiError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-workon-primary text-white font-semibold py-4 rounded-lg hover:bg-workon-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {submitting ? "Envoi en cours..." : "Envoyer ma demande"}
                </button>

                <p className="text-center text-gray-400 text-xs mt-2">
                  Vos informations sont protégées et ne seront partagées
                  qu&apos;avec {pro.firstName}. Conforme à la Loi 25.
                </p>
              </form>
            </>
          )}
        </section>
      </main>

      <footer className="bg-[#1A1A2E] text-gray-500 text-center py-6 mt-10">
        <p className="text-sm">
          Propulsé par{" "}
          <span className="text-workon-accent font-medium">WorkOn</span> —
          Système de capture de demande au Québec
        </p>
      </footer>
    </div>
  );
}
