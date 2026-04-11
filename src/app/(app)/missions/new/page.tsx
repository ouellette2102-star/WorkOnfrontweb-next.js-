"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import {
  ArrowLeft,
  Loader2,
  Navigation,
  AlertCircle,
  MapPin,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

// --- Validation schema ---

const missionSchema = z.object({
  title: z
    .string()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(120, "Le titre ne peut pas dépasser 120 caractères"),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères")
    .max(2000, "La description ne peut pas dépasser 2000 caractères"),
  category: z.string().min(1, "Veuillez choisir une catégorie"),
  price: z
    .number({ invalid_type_error: "Veuillez entrer un montant valide" })
    .min(1, "Le budget doit être d'au moins 1 $")
    .max(100_000, "Le budget ne peut pas dépasser 100 000 $"),
  city: z.string().min(2, "Veuillez indiquer une ville"),
  address: z.string().optional(),
});

type MissionFormData = z.infer<typeof missionSchema>;

// --- Page component ---

export default function NewMissionPage() {
  const router = useRouter();

  // GPS state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Categories from backend
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
    staleTime: 60_000,
  });

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MissionFormData>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      price: undefined as unknown as number,
      city: "",
      address: "",
    },
  });

  const selectedCategory = watch("category");

  // Auto-detect GPS on mount
  const detectGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsStatus("success");
      },
      () => {
        setGpsStatus("error");
        // Fallback: Montreal
        setLatitude(45.5017);
        setLongitude(-73.5673);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    detectGPS();
  }, [detectGPS]);

  // Reverse geocode to auto-fill city (best effort)
  useEffect(() => {
    if (gpsStatus !== "success" || !latitude || !longitude) return;
    // Use Nominatim (free, no key) for reverse geocoding
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`,
    )
      .then((r) => r.json())
      .then((data) => {
        const city =
          data?.address?.city ||
          data?.address?.town ||
          data?.address?.village ||
          "";
        if (city) {
          setValue("city", city, { shouldValidate: true });
        }
      })
      .catch(() => {
        // Silently ignore — city can be filled manually
      });
  }, [gpsStatus, latitude, longitude, setValue]);

  // Submit mutation
  const createMission = useMutation({
    mutationFn: (data: MissionFormData) =>
      api.createMission({
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        latitude: latitude ?? 45.5017,
        longitude: longitude ?? -73.5673,
        city: data.city,
        address: data.address || undefined,
      }),
    onSuccess: (mission) => {
      toast.success("Mission publiée avec succès!");
      router.push(`/missions/${mission.id}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création de la mission",
      );
    },
  });

  const onSubmit = (data: MissionFormData) => {
    createMission.mutate(data);
  };

  return (
    <div className="min-h-screen bg-workon-bg">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-workon-border bg-white text-workon-ink hover:bg-workon-bg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-workon-ink font-[family-name:var(--font-cabinet)]">
              Nouvelle mission
            </h1>
            <p className="text-sm text-workon-muted">
              Décrivez votre besoin et publiez-le aux pros
            </p>
          </div>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <div className="bg-white rounded-2xl border border-workon-border shadow-sm p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-workon-ink mb-1.5 block">
                Titre de la mission *
              </label>
              <input
                type="text"
                {...register("title")}
                placeholder="Ex: Réparation de plomberie salle de bain"
                className="w-full rounded-2xl border border-workon-border bg-white px-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary/40 outline-none transition-colors"
              />
              {errors.title && (
                <p className="text-xs text-workon-accent mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-workon-ink mb-1.5 block">
                Description *
              </label>
              <textarea
                {...register("description")}
                placeholder="Décrivez le travail à effectuer, les détails importants, les contraintes..."
                rows={4}
                className="w-full rounded-2xl border border-workon-border bg-white px-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary/40 outline-none resize-none transition-colors"
              />
              {errors.description && (
                <p className="text-xs text-workon-accent mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="bg-white rounded-2xl border border-workon-border shadow-sm p-5">
            <label className="text-sm font-medium text-workon-ink mb-2 block">
              Catégorie *
            </label>
            {categoriesLoading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-workon-primary" />
                <span className="text-sm text-workon-muted">
                  Chargement des catégories...
                </span>
              </div>
            ) : categories && categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setValue("category", cat.name, { shouldValidate: true })
                    }
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                      selectedCategory === cat.name
                        ? "bg-workon-primary text-white border-workon-primary"
                        : "bg-white text-workon-ink border-workon-border hover:border-workon-primary"
                    }`}
                  >
                    {cat.icon ? `${cat.icon} ` : ""}
                    {cat.name}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                {...register("category")}
                placeholder="Ex: Plomberie, Électricité, Ménage..."
                className="w-full rounded-2xl border border-workon-border bg-white px-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary/40 outline-none transition-colors"
              />
            )}
            {errors.category && (
              <p className="text-xs text-workon-accent mt-1.5">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="bg-white rounded-2xl border border-workon-border shadow-sm p-5">
            <label className="text-sm font-medium text-workon-ink mb-1.5 block">
              Budget ($CAD) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-workon-muted" />
              <input
                type="number"
                {...register("price", { valueAsNumber: true })}
                placeholder="50"
                min={1}
                step={1}
                className="w-full rounded-2xl border border-workon-border bg-white pl-9 pr-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary/40 outline-none transition-colors"
              />
            </div>
            {errors.price && (
              <p className="text-xs text-workon-accent mt-1">
                {errors.price.message}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-workon-border shadow-sm p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-workon-ink mb-1.5 block">
                Ville *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-workon-muted" />
                <input
                  type="text"
                  {...register("city")}
                  placeholder="Montréal"
                  className="w-full rounded-2xl border border-workon-border bg-white pl-9 pr-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary/40 outline-none transition-colors"
                />
              </div>
              {errors.city && (
                <p className="text-xs text-workon-accent mt-1">
                  {errors.city.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-workon-ink mb-1.5 block">
                Adresse{" "}
                <span className="text-workon-muted font-normal">
                  (optionnel)
                </span>
              </label>
              <input
                type="text"
                {...register("address")}
                placeholder="123 rue Principale"
                className="w-full rounded-2xl border border-workon-border bg-white px-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary/40 outline-none transition-colors"
              />
            </div>

            {/* GPS status */}
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-workon-bg">
              {gpsStatus === "loading" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-workon-primary" />
                  <span className="text-sm text-workon-muted">
                    Localisation en cours...
                  </span>
                </>
              )}
              {gpsStatus === "success" && (
                <>
                  <Navigation className="h-4 w-4 text-workon-primary" />
                  <span className="text-sm text-workon-primary font-medium">
                    Position GPS detectee
                  </span>
                </>
              )}
              {gpsStatus === "error" && (
                <>
                  <AlertCircle className="h-4 w-4 text-workon-accent" />
                  <span className="text-sm text-workon-muted">
                    GPS indisponible — position par defaut (Montreal)
                  </span>
                  <button
                    type="button"
                    onClick={detectGPS}
                    className="text-sm text-workon-primary ml-auto hover:underline"
                  >
                    Reessayer
                  </button>
                </>
              )}
              {gpsStatus === "idle" && (
                <>
                  <MapPin className="h-4 w-4 text-workon-muted" />
                  <span className="text-sm text-workon-muted">
                    En attente de la localisation...
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={createMission.isPending}
            className="w-full h-14 rounded-2xl bg-workon-primary hover:bg-workon-primary/90 text-white font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(19,64,33,0.25)]"
          >
            {createMission.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Publication en cours...
              </>
            ) : (
              "Publier la mission"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
