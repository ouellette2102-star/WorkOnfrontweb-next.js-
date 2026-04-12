"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkOnWordmark } from "@/components/brand/workon-wordmark";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/home";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError("");
    setLoading(true);
    try {
      await login(data);
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-10 bg-gradient-to-b from-[#134021]/10 via-background to-background">
      {/* Logo */}
      <div className="mb-8 text-white">
        <WorkOnWordmark size="xl" />
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="text-workon-muted text-sm mt-1">
            Connectez-vous à votre compte WorkOn
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-workon-accent text-xs">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-workon-accent text-xs">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <p className="text-workon-accent text-sm text-center bg-[#B5382A]/10 border border-[#B5382A]/25 rounded-xl p-3">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="hero"
            size="hero"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-workon-accent hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <div className="text-center text-sm text-workon-muted">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="text-workon-accent font-medium hover:underline"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
