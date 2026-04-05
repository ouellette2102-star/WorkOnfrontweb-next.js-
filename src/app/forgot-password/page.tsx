"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, ArrowLeft } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erreur");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-b from-neutral-900 via-background to-background">
      <div className="mb-8 flex items-center gap-1 text-3xl font-bold">
        <span>Work</span>
        <MapPin className="h-7 w-7 text-red-accent" />
        <span>n</span>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {sent ? (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Email envoyé</h1>
            <p className="text-white/60 text-sm">
              Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour à la connexion
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
              <p className="text-white/60 text-sm mt-1">
                Entrez votre email pour recevoir un lien de réinitialisation
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? "Envoi..." : "Envoyer le lien"}
              </Button>
            </form>

            <div className="text-center">
              <Link href="/login" className="text-sm text-white/50 hover:text-white/70">
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
