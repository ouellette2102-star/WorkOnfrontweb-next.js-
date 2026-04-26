"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkOnWordmark } from "@/components/brand/workon-wordmark";
import { ArrowLeft } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

/**
 * /reset-password — second half of the password reset flow (#13).
 *
 * The /forgot-password page (and the SendGrid email it triggers in prod)
 * point here with `?token=<jwt>`. Without this page the link in the email
 * landed on a 404, which is why bug #13 surfaced as "I can't reset my
 * password". Backend endpoint POST /auth/reset-password expects:
 *   { token: string, newPassword: string }
 * and returns { message } on success.
 */

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const tokenMissing = token.trim().length < 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.message ||
            "Lien invalide ou expiré. Demandez un nouveau lien depuis Mot de passe oublié.",
        );
      }
      setDone(true);
      // Auto-redirect to /login after 2.5s so the user understands the
      // flow without having to click again.
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-10 bg-workon-bg">
      <div className="mb-8 text-workon-ink">
        <WorkOnWordmark size="xl" />
      </div>

      <div className="w-full max-w-sm rounded-3xl border border-workon-border bg-white p-8 shadow-sm space-y-6">
        {done ? (
          <div className="text-center space-y-4">
            <div
              className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-workon-trust-green/15 border border-workon-trust-green/25 text-2xl"
              aria-hidden
            >
              ✅
            </div>
            <h1 className="text-2xl font-bold text-workon-ink">
              Mot de passe mis à jour
            </h1>
            <p className="text-workon-muted text-sm">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de
              passe. Redirection en cours…
            </p>
            <Button asChild variant="outline" size="hero" className="w-full">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Aller à la connexion
              </Link>
            </Button>
          </div>
        ) : tokenMissing ? (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-workon-ink">
              Lien invalide
            </h1>
            <p className="text-workon-muted text-sm">
              Ce lien de réinitialisation est invalide ou expiré. Demandez-en
              un nouveau.
            </p>
            <Button asChild variant="hero" size="hero" className="w-full">
              <Link href="/forgot-password">Demander un nouveau lien</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-workon-ink">
                Nouveau mot de passe
              </h1>
              <p className="text-workon-muted text-sm mt-1">
                Choisissez un mot de passe (8 caractères minimum).
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  data-testid="reset-password-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  data-testid="reset-password-confirm"
                />
              </div>

              {error && (
                <p className="text-workon-accent text-sm text-center bg-workon-accent/10 border border-workon-accent/25 rounded-xl p-3">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="hero"
                size="hero"
                className="w-full"
                disabled={loading}
                data-testid="reset-password-submit"
              >
                {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </Button>
            </form>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-workon-muted hover:text-workon-accent"
              >
                <ArrowLeft className="inline h-3 w-3 mr-1" />
                Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams must be wrapped in <Suspense> per Next.js 15.
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
