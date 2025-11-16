export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4">
      <div className="max-w-4xl mx-auto py-16">
        <h1 className="text-4xl font-bold mb-8">Politique de confidentialité</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-white/70">
            Dernière mise à jour: {new Date().toLocaleDateString("fr-CA")}
          </p>
          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">1. Collecte d'informations</h2>
            <p className="text-white/70">
              Nous collectons les informations que vous nous fournissez directement, ainsi que
              certaines informations automatiquement lorsque vous utilisez notre service.
            </p>
          </section>
          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">2. Utilisation des informations</h2>
            <p className="text-white/70">
              Nous utilisons vos informations pour fournir, maintenir et améliorer nos services,
              traiter les transactions, et communiquer avec vous.
            </p>
          </section>
          {/* TODO: Ajouter sections complètes conformes à la Loi 25 (Québec) */}
        </div>
      </div>
    </div>
  );
}

