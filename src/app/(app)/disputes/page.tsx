"use client";

import Link from "next/link";
import { Shield, FileText, Scale, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * /disputes — Dispute hub page.
 *
 * The backend currently exposes per-mission dispute endpoints
 * (GET /disputes/:id, GET /disputes/mission/:missionId) but no
 * "list all my disputes" endpoint (GET /disputes returns 404 in
 * production — tracked as a backend blocker).
 *
 * Rather than ship a broken list page, this is an informational
 * hub that:
 *   1. Explains what a WorkOn dispute is
 *   2. Points users to /missions/mine to open one from a mission
 *   3. Answers the three questions the support team gets most
 *
 * When the backend ships GET /disputes/mine, this file evolves into
 * a real list above the explanation — the hub content stays.
 */

export default function DisputesHubPage() {
  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        {/* Hero */}
        <header>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF4D1C]/25 bg-[#FF4D1C]/10 px-3 py-1 text-xs text-[#FF4D1C] mb-4">
            <Scale className="h-3.5 w-3.5" />
            Résolution de litiges
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Vos litiges et réclamations
          </h1>
          <p className="mt-3 text-white/60 text-lg leading-relaxed">
            WorkOn protège chaque mission grâce à l&apos;escrow Stripe.
            Si quelque chose tourne mal, vous pouvez ouvrir un litige
            depuis la mission concernée et notre équipe arbitre sous 48h.
          </p>
        </header>

        {/* Primary CTA: open dispute from mission */}
        <section className="rounded-3xl border border-white/10 bg-neutral-800/80 backdrop-blur-sm p-6 shadow-lg shadow-black/20">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-2xl bg-[#FF4D1C]/15 border border-[#FF4D1C]/25 flex items-center justify-center">
              <FileText className="h-6 w-6 text-[#FF4D1C]" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">Ouvrir un litige</h2>
              <p className="mt-1 text-sm text-white/70 leading-relaxed">
                Les litiges s&apos;ouvrent depuis la page d&apos;une mission
                complétée ou en cours. Allez sur la mission concernée
                et cliquez sur « Signaler un problème ».
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button asChild variant="hero" size="sm">
                  <Link href="/missions/mine">Voir mes missions</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/support">Contacter le support</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Comment ça fonctionne</h2>

          {[
            {
              icon: <Shield className="h-5 w-5 text-[#22C55E]" />,
              title: "Paiement bloqué en escrow",
              desc: "Votre paiement est retenu par Stripe jusqu'à ce que la mission soit confirmée complétée. Aucun fonds n'est transféré au travailleur tant que vous n'avez pas validé.",
            },
            {
              icon: <FileText className="h-5 w-5 text-[#FF4D1C]" />,
              title: "Ouvrir un litige depuis la mission",
              desc: "Si la mission n'est pas conforme (qualité, non-exécution, dommages), cliquez sur « Signaler un problème » depuis la page de la mission. Ajoutez photos, vidéos et description.",
            },
            {
              icon: <Scale className="h-5 w-5 text-yellow-400" />,
              title: "Arbitrage sous 48h",
              desc: "Notre équipe examine les preuves des deux parties et rend une décision sous 48h ouvrables : remboursement total, partiel, ou libération au travailleur.",
            },
            {
              icon: <MessageCircle className="h-5 w-5 text-blue-400" />,
              title: "Communication directe pendant la mission",
              desc: "La meilleure prévention reste le chat intégré : échangez photos et mises à jour pendant la mission pour éviter les malentendus.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-start gap-4"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                {item.icon}
              </div>
              <div>
                <h3 className="font-semibold text-base">{item.title}</h3>
                <p className="mt-1 text-sm text-white/60 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Foot note */}
        <footer className="text-center text-xs text-white/40 pt-2">
          <p>
            WorkOn arbitre uniquement les litiges liés aux missions réalisées via la plateforme.
            <br />
            Pour les urgences (sécurité, dommages matériels graves), contactez directement le support.
          </p>
        </footer>
      </div>
    </main>
  );
}
