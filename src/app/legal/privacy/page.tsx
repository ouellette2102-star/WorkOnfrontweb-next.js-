/**
 * Privacy Policy Page - WorkOn
 * Version: PRIVACY v1.0
 * Effective Date: 2026-01-15
 *
 * Conformité: Loi 25 (Québec), principes GDPR, Apple App Store, Google Play
 *
 * IMPORTANT: Ce document définit WorkOn comme plateforme de mise en relation.
 * WorkOn n'est PAS un employeur et n'exerce aucun lien de subordination.
 */

import Link from "next/link";

const POLICY_VERSION = "1.0";
const EFFECTIVE_DATE = "15 janvier 2026";
const LAST_UPDATED = "15 janvier 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Politique de confidentialité</h1>
          <div className="flex flex-wrap gap-4 text-sm text-white/60">
            <span className="px-3 py-1 bg-white/10 rounded-full">
              Version {POLICY_VERSION}
            </span>
            <span>En vigueur depuis le {EFFECTIVE_DATE}</span>
            <span>Dernière mise à jour : {LAST_UPDATED}</span>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-white/80 leading-relaxed">
              WorkOn Technologies Inc. (« WorkOn », « nous », « notre ») exploite une
              plateforme technologique de mise en relation entre des travailleurs
              autonomes indépendants, des employeurs et des clients résidentiels.
            </p>
            <p className="text-white/80 leading-relaxed">
              Cette politique de confidentialité décrit comment nous collectons,
              utilisons, partageons et protégeons vos renseignements personnels
              lorsque vous utilisez notre plateforme et nos services.
            </p>
            <p className="text-white/80 leading-relaxed">
              En utilisant WorkOn, vous consentez aux pratiques décrites dans cette
              politique. Si vous n&apos;acceptez pas cette politique, veuillez ne pas
              utiliser nos services.
            </p>
          </section>

          {/* Responsable */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Responsable de la protection des renseignements</h2>
            <p className="text-white/80 leading-relaxed">
              Conformément à la Loi 25 du Québec sur la protection des renseignements
              personnels dans le secteur privé, WorkOn a désigné un responsable de la
              protection des renseignements personnels.
            </p>
            <p className="text-white/80 leading-relaxed">
              Pour toute question concernant vos renseignements personnels, vous pouvez
              nous contacter à :{" "}
              <a href="mailto:privacy@workon.app" className="text-amber-400 hover:underline">
                privacy@workon.app
              </a>
            </p>
          </section>

          {/* Collecte */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Renseignements que nous collectons</h2>

            <h3 className="text-xl font-medium mt-6 mb-3">3.1 Renseignements fournis directement</h3>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Identité : nom, prénom, adresse courriel, numéro de téléphone</li>
              <li>Profil professionnel : compétences, expérience, ville, zone de service</li>
              <li>Vérification : documents d&apos;identité (le cas échéant)</li>
              <li>Paiement : informations nécessaires au traitement des transactions via Stripe</li>
              <li>Communications : messages échangés via la plateforme</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">3.2 Renseignements collectés automatiquement</h3>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Données techniques : adresse IP, type d&apos;appareil, système d&apos;exploitation, navigateur</li>
              <li>Données d&apos;utilisation : pages consultées, fonctionnalités utilisées, horodatage</li>
              <li>Données de localisation : uniquement si vous autorisez l&apos;accès à votre position</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">3.3 Renseignements provenant de tiers</h3>
            <p className="text-white/80 leading-relaxed">
              Nous pouvons recevoir des renseignements de services d&apos;authentification
              (Clerk), de paiement (Stripe) ou d&apos;autres sources que vous autorisez.
            </p>
          </section>

          {/* Utilisation */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Utilisation des renseignements</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              Nous utilisons vos renseignements personnels uniquement pour :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Fournir et maintenir la plateforme de mise en relation</li>
              <li>Créer et gérer votre compte utilisateur</li>
              <li>Faciliter les communications entre utilisateurs</li>
              <li>Traiter les transactions de paiement</li>
              <li>Améliorer nos services et corriger les problèmes techniques</li>
              <li>Assurer la sécurité de la plateforme et prévenir la fraude</li>
              <li>Respecter nos obligations légales</li>
              <li>Vous envoyer des communications relatives à votre compte</li>
            </ul>
          </section>

          {/* Partage */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Partage des renseignements</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              Nous ne vendons pas vos renseignements personnels. Nous pouvons partager
              vos renseignements dans les cas suivants :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>
                <strong>Entre utilisateurs :</strong> les informations nécessaires à la
                mise en relation (nom, compétences, coordonnées pertinentes) sont partagées
                entre les parties d&apos;une mission
              </li>
              <li>
                <strong>Fournisseurs de services :</strong> nous utilisons des services
                tiers pour l&apos;hébergement (Railway), l&apos;authentification (Clerk), les
                paiements (Stripe) et l&apos;analyse
              </li>
              <li>
                <strong>Obligations légales :</strong> lorsque requis par la loi, une
                ordonnance judiciaire ou une demande gouvernementale valide
              </li>
              <li>
                <strong>Protection des droits :</strong> pour protéger les droits, la
                propriété ou la sécurité de WorkOn, de nos utilisateurs ou du public
              </li>
            </ul>
          </section>

          {/* Conservation */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Conservation des renseignements</h2>
            <p className="text-white/80 leading-relaxed">
              Nous conservons vos renseignements personnels aussi longtemps que nécessaire
              pour fournir nos services et respecter nos obligations légales.
            </p>
            <p className="text-white/80 leading-relaxed">
              Lorsque vous supprimez votre compte, vos renseignements personnels sont
              anonymisés. Certaines données peuvent être conservées plus longtemps pour
              des raisons légales, comptables ou de sécurité.
            </p>
          </section>

          {/* Sécurité */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Sécurité des renseignements</h2>
            <p className="text-white/80 leading-relaxed">
              Nous mettons en œuvre des mesures de sécurité techniques et
              organisationnelles pour protéger vos renseignements personnels,
              notamment :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Chiffrement des données en transit (HTTPS/TLS)</li>
              <li>Mots de passe hachés avec algorithme sécurisé</li>
              <li>Contrôle d&apos;accès aux données</li>
              <li>Surveillance et journalisation des accès</li>
            </ul>
          </section>

          {/* Droits */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Vos droits</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              Conformément à la Loi 25 et aux principes de protection des données, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>
                <strong>Accès :</strong> obtenir une copie de vos renseignements personnels
              </li>
              <li>
                <strong>Rectification :</strong> corriger les renseignements inexacts ou incomplets
              </li>
              <li>
                <strong>Suppression :</strong> demander la suppression de votre compte et
                l&apos;anonymisation de vos données
              </li>
              <li>
                <strong>Portabilité :</strong> recevoir vos données dans un format structuré
              </li>
              <li>
                <strong>Retrait du consentement :</strong> retirer votre consentement à tout moment
              </li>
            </ul>
            <p className="text-white/80 leading-relaxed mt-4">
              Pour exercer ces droits, contactez-nous à{" "}
              <a href="mailto:privacy@workon.app" className="text-amber-400 hover:underline">
                privacy@workon.app
              </a>
              {" "}ou utilisez les fonctionnalités de votre compte.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Témoins (Cookies)</h2>
            <p className="text-white/80 leading-relaxed">
              Nous utilisons des témoins essentiels au fonctionnement de la plateforme
              (authentification, préférences de session). Nous n&apos;utilisons pas de
              témoins publicitaires à des fins de ciblage comportemental.
            </p>
          </section>

          {/* Transferts */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Transferts internationaux</h2>
            <p className="text-white/80 leading-relaxed">
              Vos renseignements peuvent être traités par des fournisseurs situés à
              l&apos;extérieur du Canada. Dans ce cas, nous nous assurons que des
              garanties appropriées sont en place pour protéger vos renseignements.
            </p>
          </section>

          {/* Mineurs */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Mineurs</h2>
            <p className="text-white/80 leading-relaxed">
              Nos services ne s&apos;adressent pas aux personnes de moins de 18 ans.
              Nous ne collectons pas sciemment de renseignements personnels de mineurs.
            </p>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Modifications de cette politique</h2>
            <p className="text-white/80 leading-relaxed">
              Nous pouvons modifier cette politique de temps à autre. En cas de
              modification importante, nous vous en informerons par courriel ou via
              une notification sur la plateforme. Votre utilisation continue de nos
              services après notification constitue votre acceptation des modifications.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Nous contacter</h2>
            <p className="text-white/80 leading-relaxed">
              Pour toute question concernant cette politique ou vos renseignements
              personnels :
            </p>
            <div className="mt-4 p-4 bg-white/5 rounded-lg text-white/80">
              <p><strong>WorkOn Technologies Inc.</strong></p>
              <p>Courriel : <a href="mailto:privacy@workon.app" className="text-amber-400 hover:underline">privacy@workon.app</a></p>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-white/10">
            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              <Link href="/legal/terms" className="hover:text-white transition-colors">
                Conditions d&apos;utilisation
              </Link>
              <span>•</span>
              <span>PRIVACY v{POLICY_VERSION}</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
