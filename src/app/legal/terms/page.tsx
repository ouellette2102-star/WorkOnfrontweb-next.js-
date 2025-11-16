export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4">
      <div className="max-w-4xl mx-auto py-16">
        <h1 className="text-4xl font-bold mb-8">Conditions d'utilisation</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-white/70">
            Dernière mise à jour: {new Date().toLocaleDateString("fr-CA")}
          </p>
          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptation des conditions</h2>
            <p className="text-white/70">
              En utilisant WorkOn, vous acceptez d'être lié par ces conditions d'utilisation.
            </p>
          </section>
          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">2. Statut des travailleurs</h2>
            <p className="text-white/70">
              WorkOn est une plateforme de mise en relation. Les travailleurs sont des{" "}
              <strong>travailleurs autonomes</strong>, non des employés de WorkOn ou des clients.
              Chaque mission est régie par un contrat de service indépendant.
            </p>
          </section>
          {/* TODO: Ajouter sections complètes */}
        </div>
      </div>
    </div>
  );
}

