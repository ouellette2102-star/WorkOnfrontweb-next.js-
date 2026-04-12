"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import Link from "next/link";

const FIELD_LABELS: Record<string, string> = {
  firstName: "Prenom",
  lastName: "Nom",
  email: "Email",
  phone: "Telephone",
  city: "Ville",
  bio: "Bio / Description",
  pictureUrl: "Photo de profil",
  category: "Categorie",
  skills: "Competences",
  location: "Localisation GPS",
};

export function ProfileCompletionCard() {
  const { user, isLoading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["profile-completion"],
    queryFn: () => api.getMyCompletion(),
    enabled: !authLoading && !!user,
  });

  // Don't show if loading, no data, or score is already 100
  if (isLoading || authLoading || !data || data.score >= 100) {
    return null;
  }

  const { score, missingFields } = data;
  const progressColor =
    score >= 80 ? "#134021" : score >= 50 ? "#D4922A" : "#C96646";

  return (
    <div className="mb-6 bg-white border border-[#EAE6DF] rounded-3xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-bold text-base text-[#1B1A18]">
          Profil incomplet
        </h3>
        <span
          className="text-sm font-semibold"
          style={{ color: progressColor }}
        >
          {score}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-[#EAE6DF] mb-3">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            backgroundColor: progressColor,
          }}
        />
      </div>

      {/* Missing fields */}
      {missingFields.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-[#706E6A] mb-1.5">
            Il te manque :
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missingFields.map((field) => (
              <span
                key={field}
                className="inline-block rounded-full bg-[#F5F2ED] px-2.5 py-0.5 text-xs text-[#706E6A]"
              >
                {FIELD_LABELS[field] || field}
              </span>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/profile"
        className="inline-block text-sm font-semibold text-[#D4922A] hover:underline"
      >
        Completer mon profil
      </Link>
    </div>
  );
}
