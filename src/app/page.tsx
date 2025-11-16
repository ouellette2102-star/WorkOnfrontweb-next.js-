import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RedPhoneButton } from "@/components/red-phone-button";
import { UserNav } from "@/components/navigation/user-nav";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-900/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-red-600" />
            <span className="font-semibold">WorkOn</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <Link href="/map" className="hover:text-white">Découvrir</Link>
            <Link href="/dashboard" className="hover:text-white">Offres</Link>
            <Link href="/pricing" className="hover:text-white">Tarifs</Link>
          </nav>

          <UserNav />
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Le <span className="text-red-500">match</span> instantané entre
            <br /> missions et travailleurs.
          </h1>
          <p className="mt-4 text-white/70 text-lg">
            Trouve un renfort en minutes. Accepte des missions payées en toute légalité.
          </p>

          <div className="mt-8 flex gap-3">
            <Button size="lg" asChild>
              <Link href="/sign-up">Publier un call</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/map">Voir les offres</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 border-t border-white/10">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-2">⚡ Matching instantané</h3>
            <p className="text-white/70">
              Trouve le travailleur parfait en quelques secondes grâce à notre algorithme intelligent.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">📍 Découverte par carte</h3>
            <p className="text-white/70">
              Explore les missions et travailleurs près de chez toi avec notre carte interactive.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">💳 Paiements sécurisés</h3>
            <p className="text-white/70">
              Transactions protégées via Stripe Connect, avec garanties et remboursements.
            </p>
          </div>
        </div>
      </section>

      {/* Legal Banner */}
      <section className="mx-auto max-w-6xl px-4 py-8 border-t border-white/10">
        <div className="bg-white/5 rounded-lg p-4 text-sm text-white/80">
          <p>
            <strong>Note légale:</strong> WorkOn est une plateforme de mise en relation. 
            Les clients contractent des <strong>travailleurs autonomes</strong>, non des employés. 
            Chaque transaction est régie par un contrat de service indépendant.
          </p>
        </div>
      </section>

      {/* Red Phone Button */}
      <RedPhoneButton />
    </main>
  );
}
