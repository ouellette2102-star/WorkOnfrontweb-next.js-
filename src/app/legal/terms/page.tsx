/**
 * Terms of Service Page - WorkOn
 * Version: TERMS v1.0
 * Effective Date: 2026-01-15
 *
 * Conformité: Loi 25 (Québec), Apple App Store, Google Play
 *
 * POSITIONNEMENT LÉGAL CRITIQUE:
 * - WorkOn est une PLATEFORME DE MISE EN RELATION
 * - WorkOn n'est PAS un employeur
 * - WorkOn n'exerce AUCUN lien de subordination
 * - Les travailleurs sont des TRAVAILLEURS AUTONOMES INDÉPENDANTS
 */

import Link from "next/link";

const TERMS_VERSION = "1.0";
const EFFECTIVE_DATE = "15 janvier 2026";
const LAST_UPDATED = "15 janvier 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Conditions d&apos;utilisation</h1>
          <div className="flex flex-wrap gap-4 text-sm text-white/60">
            <span className="px-3 py-1 bg-white/10 rounded-full">
              Version {TERMS_VERSION}
            </span>
            <span>En vigueur depuis le {EFFECTIVE_DATE}</span>
            <span>Dernière mise à jour : {LAST_UPDATED}</span>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptation des conditions</h2>
            <p className="text-white/80 leading-relaxed">
              Les présentes conditions d&apos;utilisation (« Conditions ») régissent votre
              utilisation de la plateforme WorkOn, exploitée par WorkOn Technologies Inc.
              (« WorkOn », « nous », « notre »).
            </p>
            <p className="text-white/80 leading-relaxed">
              En créant un compte ou en utilisant nos services, vous acceptez d&apos;être
              lié par ces Conditions et notre{" "}
              <Link href="/legal/privacy" className="text-amber-400 hover:underline">
                Politique de confidentialité
              </Link>
              . Si vous n&apos;acceptez pas ces Conditions, veuillez ne pas utiliser la
              plateforme.
            </p>
          </section>

          {/* Description du service */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description du service</h2>
            <p className="text-white/80 leading-relaxed">
              WorkOn est une <strong>plateforme technologique de mise en relation</strong> qui
              permet à des travailleurs autonomes indépendants, des employeurs et des
              clients résidentiels de se connecter pour des missions de services.
            </p>

            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <h3 className="text-lg font-semibold text-amber-400 mb-3">
                ⚠️ Important — Ce que WorkOn n&apos;est PAS
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-white/80">
                <li>WorkOn <strong>n&apos;est pas</strong> un employeur</li>
                <li>WorkOn <strong>n&apos;est pas</strong> une agence de placement de personnel</li>
                <li>WorkOn <strong>ne fournit pas</strong> de services de travail</li>
                <li>WorkOn <strong>n&apos;exerce aucun</strong> lien de subordination</li>
                <li>WorkOn <strong>ne donne aucune</strong> directive opérationnelle aux travailleurs</li>
                <li>WorkOn <strong>ne garantit pas</strong> de revenus, de missions ou de volume de travail</li>
              </ul>
            </div>
          </section>

          {/* Statut des travailleurs */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Statut des travailleurs autonomes</h2>
            <p className="text-white/80 leading-relaxed">
              Les utilisateurs offrant des services via la plateforme sont des
              <strong> travailleurs autonomes indépendants</strong>. Ils ne sont pas des
              employés de WorkOn, des clients ou des employeurs utilisant la plateforme.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">3.1 Indépendance des travailleurs</h3>
            <p className="text-white/80 leading-relaxed">
              Les travailleurs autonomes :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Choisissent librement les missions qu&apos;ils acceptent ou refusent</li>
              <li>Fixent leurs propres tarifs et conditions de travail</li>
              <li>Déterminent leurs horaires et méthodes de travail</li>
              <li>Utilisent leurs propres outils et équipements</li>
              <li>Peuvent offrir leurs services à d&apos;autres clients en dehors de la plateforme</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">3.2 Responsabilités des travailleurs</h3>
            <p className="text-white/80 leading-relaxed">
              Chaque travailleur autonome est entièrement responsable de :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>La qualité de ses services</li>
              <li>Ses obligations fiscales (déclarations, impôts, TPS/TVQ)</li>
              <li>Ses assurances professionnelles et de responsabilité civile</li>
              <li>Ses permis et certifications professionnelles requises</li>
              <li>Sa conformité aux lois et règlements applicables</li>
            </ul>
          </section>

          {/* Contrats de service */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Contrats de service</h2>
            <p className="text-white/80 leading-relaxed">
              Chaque mission convenue via la plateforme constitue un contrat de service
              distinct entre le travailleur autonome et le client ou l&apos;employeur.
              WorkOn n&apos;est pas partie à ce contrat.
            </p>
            <p className="text-white/80 leading-relaxed">
              La plateforme peut faciliter la création d&apos;un document contractuel
              numérique entre les parties, mais ce contrat lie uniquement les parties
              concernées.
            </p>
          </section>

          {/* Création de compte */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Création de compte</h2>
            <p className="text-white/80 leading-relaxed">
              Pour utiliser la plateforme, vous devez créer un compte et fournir des
              informations exactes et complètes. Vous êtes responsable de :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Maintenir la confidentialité de vos identifiants de connexion</li>
              <li>Toutes les activités effectuées depuis votre compte</li>
              <li>Mettre à jour vos informations si elles changent</li>
              <li>Nous informer immédiatement de tout accès non autorisé</li>
            </ul>
            <p className="text-white/80 leading-relaxed mt-4">
              Vous devez avoir au moins 18 ans pour utiliser la plateforme.
            </p>
          </section>

          {/* Utilisation acceptable */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Utilisation acceptable</h2>
            <p className="text-white/80 leading-relaxed">
              En utilisant la plateforme, vous acceptez de ne pas :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Fournir de fausses informations ou usurper une identité</li>
              <li>Utiliser la plateforme à des fins illégales</li>
              <li>Harceler, menacer ou discriminer d&apos;autres utilisateurs</li>
              <li>Publier du contenu offensant, diffamatoire ou inapproprié</li>
              <li>Contourner les mesures de sécurité de la plateforme</li>
              <li>Utiliser des robots, scripts ou méthodes automatisées non autorisées</li>
              <li>Interférer avec le bon fonctionnement de la plateforme</li>
            </ul>
          </section>

          {/* Paiements */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Paiements et frais</h2>

            <h3 className="text-xl font-medium mt-6 mb-3">7.1 Traitement des paiements</h3>
            <p className="text-white/80 leading-relaxed">
              Les paiements sont traités par notre partenaire Stripe. En utilisant
              les fonctionnalités de paiement, vous acceptez également les{" "}
              <a
                href="https://stripe.com/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline"
              >
                conditions de service de Stripe
              </a>
              .
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">7.2 Frais de plateforme</h3>
            <p className="text-white/80 leading-relaxed">
              WorkOn peut percevoir des frais de service sur les transactions effectuées
              via la plateforme. Ces frais sont clairement indiqués avant la confirmation
              de chaque transaction.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">7.3 Responsabilité fiscale</h3>
            <p className="text-white/80 leading-relaxed">
              Chaque utilisateur est responsable de ses propres obligations fiscales,
              y compris la déclaration des revenus et le paiement des taxes applicables.
            </p>
          </section>

          {/* Annulations et litiges */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Annulations et litiges</h2>
            <p className="text-white/80 leading-relaxed">
              Les modalités d&apos;annulation sont convenues entre les parties à chaque
              mission. En cas de litige entre utilisateurs, WorkOn peut offrir une
              médiation, mais n&apos;est pas responsable des différends entre les parties.
            </p>
            <p className="text-white/80 leading-relaxed">
              Les annulations ne constituent pas un critère de notation ou de pénalité
              sur la plateforme.
            </p>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Propriété intellectuelle</h2>
            <p className="text-white/80 leading-relaxed">
              La plateforme WorkOn, incluant son code, son design, ses marques et son
              contenu, est la propriété de WorkOn Technologies Inc. et est protégée
              par les lois sur la propriété intellectuelle.
            </p>
            <p className="text-white/80 leading-relaxed">
              Le contenu que vous publiez sur la plateforme reste votre propriété.
              En le publiant, vous accordez à WorkOn une licence non exclusive pour
              l&apos;afficher et le distribuer dans le cadre du service.
            </p>
          </section>

          {/* Limitation de responsabilité */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Limitation de responsabilité</h2>
            <p className="text-white/80 leading-relaxed">
              WorkOn fournit la plateforme « telle quelle » et « selon disponibilité ».
              Dans les limites permises par la loi :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>
                WorkOn ne garantit pas la disponibilité ininterrompue de la plateforme
              </li>
              <li>
                WorkOn n&apos;est pas responsable des actions, de la qualité des services
                ou de la conduite des utilisateurs
              </li>
              <li>
                WorkOn n&apos;est pas responsable des dommages indirects, accessoires ou
                consécutifs
              </li>
              <li>
                La responsabilité totale de WorkOn est limitée aux frais que vous avez
                payés à WorkOn au cours des 12 derniers mois
              </li>
            </ul>
          </section>

          {/* Indemnisation */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Indemnisation</h2>
            <p className="text-white/80 leading-relaxed">
              Vous acceptez d&apos;indemniser et de dégager WorkOn de toute
              responsabilité pour toute réclamation, perte ou dommage découlant de :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Votre utilisation de la plateforme</li>
              <li>Votre violation de ces Conditions</li>
              <li>Votre violation des droits de tiers</li>
              <li>Les services que vous fournissez ou recevez via la plateforme</li>
            </ul>
          </section>

          {/* Suspension et résiliation */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Suspension et résiliation</h2>
            <p className="text-white/80 leading-relaxed">
              WorkOn peut suspendre ou résilier votre accès à la plateforme en cas de
              violation de ces Conditions ou pour toute autre raison légitime, avec
              ou sans préavis.
            </p>
            <p className="text-white/80 leading-relaxed">
              Vous pouvez supprimer votre compte à tout moment via les paramètres de
              votre profil. La suppression entraîne l&apos;anonymisation de vos données
              personnelles conformément à notre Politique de confidentialité.
            </p>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Modifications des conditions</h2>
            <p className="text-white/80 leading-relaxed">
              Nous pouvons modifier ces Conditions de temps à autre. En cas de
              modification importante, nous vous en informerons par courriel ou via
              une notification sur la plateforme au moins 30 jours avant l&apos;entrée
              en vigueur.
            </p>
            <p className="text-white/80 leading-relaxed">
              Votre utilisation continue de la plateforme après l&apos;entrée en vigueur
              des modifications constitue votre acceptation des nouvelles Conditions.
            </p>
          </section>

          {/* Droit applicable */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Droit applicable et juridiction</h2>
            <p className="text-white/80 leading-relaxed">
              Ces Conditions sont régies par les lois de la province de Québec et les
              lois fédérales du Canada applicables. Tout litige sera soumis à la
              compétence exclusive des tribunaux du district judiciaire de Montréal,
              Québec.
            </p>
          </section>

          {/* Divisibilité */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Divisibilité</h2>
            <p className="text-white/80 leading-relaxed">
              Si une disposition de ces Conditions est jugée invalide ou inapplicable,
              les autres dispositions restent en vigueur. La disposition invalide sera
              modifiée dans la mesure minimale nécessaire pour la rendre applicable.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">16. Nous contacter</h2>
            <p className="text-white/80 leading-relaxed">
              Pour toute question concernant ces Conditions :
            </p>
            <div className="mt-4 p-4 bg-white/5 rounded-lg text-white/80">
              <p><strong>WorkOn Technologies Inc.</strong></p>
              <p>
                Courriel :{" "}
                <a href="mailto:legal@workon.app" className="text-amber-400 hover:underline">
                  legal@workon.app
                </a>
              </p>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-white/10">
            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              <Link href="/legal/privacy" className="hover:text-white transition-colors">
                Politique de confidentialité
              </Link>
              <span>•</span>
              <span>TERMS v{TERMS_VERSION}</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
