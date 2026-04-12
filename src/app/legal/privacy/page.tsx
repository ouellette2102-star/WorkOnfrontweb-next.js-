/**
 * Privacy Policy Page - WorkOn
 * Version: PRIVACY v2.0
 * Effective Date: 2026-04-11
 *
 * Conformite: Loi 25 (Quebec), LPRPDE (federal), principes RGPD
 *
 * IMPORTANT: Ce document definit WorkOn comme plateforme de mise en relation.
 * WorkOn n'est PAS un employeur et n'exerce aucun lien de subordination.
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialite",
  description:
    "Politique de confidentialite de WorkOn. Conforme a la Loi 25 du Quebec. Decouvrez comment nous collectons, utilisons et protegeons vos renseignements personnels.",
};

const VERSION = "2.0";
const EFFECTIVE_DATE = "11 avril 2026";
const LAST_UPDATED = "11 avril 2026";

/* ------------------------------------------------------------------ */

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl md:text-2xl font-semibold text-workon-ink mt-10 mb-4 scroll-mt-24">
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-medium text-workon-ink mt-6 mb-3">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-workon-gray leading-relaxed mb-3">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-6 space-y-2 text-workon-gray mb-4">{children}</ul>;
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-6 p-5 bg-workon-bg-cream border border-workon-border rounded-lg">
      {children}
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-6 p-5 bg-workon-primary-subtle border border-workon-primary/15 rounded-lg">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function PrivacyPage() {
  return (
    <article>
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-workon-ink mb-4">
          Politique de confidentialit&eacute;
        </h1>
        <div className="flex flex-wrap gap-3 text-sm text-workon-muted">
          <span className="px-3 py-1 bg-workon-primary-subtle text-workon-primary rounded-full font-medium">
            Version {VERSION}
          </span>
          <span className="py-1">En vigueur depuis le {EFFECTIVE_DATE}</span>
          <span className="py-1">Derni&egrave;re mise &agrave; jour : {LAST_UPDATED}</span>
        </div>
      </header>

      {/* ====== 1. Introduction ====== */}
      <SectionTitle id="introduction">1. Introduction</SectionTitle>
      <P>
        WorkOn Technologies Inc. (&laquo;&nbsp;WorkOn&nbsp;&raquo;, &laquo;&nbsp;nous&nbsp;&raquo;, &laquo;&nbsp;notre&nbsp;&raquo;) exploite une
        plateforme technologique de mise en relation entre des travailleurs
        autonomes ind&eacute;pendants, des employeurs et des clients r&eacute;sidentiels au Qu&eacute;bec.
      </P>
      <P>
        Cette politique de confidentialit&eacute; d&eacute;crit comment nous collectons,
        utilisons, partageons et prot&eacute;geons vos renseignements personnels
        lorsque vous utilisez notre plateforme et nos services.
      </P>
      <P>
        En utilisant WorkOn, vous consentez aux pratiques d&eacute;crites dans cette
        politique. Si vous n&rsquo;acceptez pas cette politique, veuillez ne pas
        utiliser nos services.
      </P>

      {/* ====== 2. ROPPA ====== */}
      <SectionTitle id="roppa">2. Responsable de la protection des renseignements personnels (ROPPA)</SectionTitle>
      <P>
        Conform&eacute;ment &agrave; la Loi 25 du Qu&eacute;bec (Loi modernisant des dispositions
        l&eacute;gislatives en mati&egrave;re de protection des renseignements personnels),
        WorkOn a d&eacute;sign&eacute; un responsable de la protection des renseignements
        personnels (ROPPA).
      </P>

      <Callout>
        <p className="font-semibold text-workon-ink mb-2">Responsable de la protection des renseignements personnels</p>
        <p className="text-workon-gray">WorkOn Technologies Inc.</p>
        <p className="text-workon-gray">
          Courriel :{" "}
          <a href="mailto:privacy@workon.ca" className="text-workon-primary font-medium hover:underline">
            privacy@workon.ca
          </a>
        </p>
        <p className="text-workon-muted text-sm mt-2">
          D&eacute;lai de r&eacute;ponse : 30 jours suivant la r&eacute;ception de la demande
        </p>
      </Callout>

      {/* ====== 3. Collecte ====== */}
      <SectionTitle id="collecte">3. Renseignements que nous collectons</SectionTitle>

      <SubTitle>3.1 Renseignements fournis directement</SubTitle>
      <UL>
        <li><strong>Identit&eacute; :</strong> nom, pr&eacute;nom, adresse courriel, num&eacute;ro de t&eacute;l&eacute;phone</li>
        <li><strong>Profil professionnel :</strong> comp&eacute;tences, exp&eacute;rience, ville, zone de service</li>
        <li><strong>V&eacute;rification :</strong> documents d&rsquo;identit&eacute; (le cas &eacute;ch&eacute;ant, pour le syst&egrave;me Trust Tier)</li>
        <li><strong>Paiement :</strong> informations n&eacute;cessaires au traitement des transactions via Stripe (WorkOn ne stocke pas vos donn&eacute;es de carte de cr&eacute;dit)</li>
        <li><strong>Communications :</strong> messages &eacute;chang&eacute;s via la plateforme</li>
        <li><strong>Localisation :</strong> adresse ou zone g&eacute;ographique de service</li>
      </UL>

      <SubTitle>3.2 Renseignements collect&eacute;s automatiquement</SubTitle>
      <UL>
        <li><strong>Donn&eacute;es techniques :</strong> adresse IP, type d&rsquo;appareil, syst&egrave;me d&rsquo;exploitation, navigateur</li>
        <li><strong>Donn&eacute;es d&rsquo;utilisation :</strong> pages consult&eacute;es, fonctionnalit&eacute;s utilis&eacute;es, horodatage</li>
        <li><strong>Donn&eacute;es de g&eacute;olocalisation :</strong> uniquement si vous autorisez l&rsquo;acc&egrave;s &agrave; votre position</li>
      </UL>

      <SubTitle>3.3 Renseignements provenant de tiers</SubTitle>
      <P>
        Nous pouvons recevoir des renseignements de services de paiement (Stripe)
        ou d&rsquo;autres sources que vous autorisez explicitement.
      </P>

      {/* ====== 4. Finalités ====== */}
      <SectionTitle id="finalites">4. Finalit&eacute;s de la collecte</SectionTitle>
      <P>Nous utilisons vos renseignements personnels uniquement pour :</P>
      <UL>
        <li>Fournir et maintenir la plateforme de mise en relation</li>
        <li>Cr&eacute;er et g&eacute;rer votre compte utilisateur</li>
        <li>Faciliter les communications entre utilisateurs</li>
        <li>Traiter les transactions de paiement et le syst&egrave;me d&rsquo;entiercement</li>
        <li>Ex&eacute;cuter l&rsquo;algorithme de jumelage (matching) entre travailleurs et clients</li>
        <li>Am&eacute;liorer nos services et corriger les probl&egrave;mes techniques</li>
        <li>Assurer la s&eacute;curit&eacute; de la plateforme et pr&eacute;venir la fraude</li>
        <li>Respecter nos obligations l&eacute;gales</li>
        <li>Vous envoyer des communications relatives &agrave; votre compte</li>
      </UL>
      <P>
        Nous ne traitons jamais vos renseignements &agrave; des fins incompatibles avec
        les finalit&eacute;s pour lesquelles ils ont &eacute;t&eacute; collect&eacute;s, sauf avec votre
        consentement explicite.
      </P>

      {/* ====== 5. Partage ====== */}
      <SectionTitle id="partage">5. Partage des renseignements</SectionTitle>
      <P>
        <strong>Nous ne vendons pas vos renseignements personnels.</strong> Nous pouvons partager
        vos renseignements dans les cas suivants :
      </P>
      <UL>
        <li>
          <strong>Entre utilisateurs :</strong> les informations n&eacute;cessaires &agrave; la
          mise en relation (nom, comp&eacute;tences, coordonn&eacute;es pertinentes) sont partag&eacute;es
          entre les parties d&rsquo;une mission
        </li>
        <li>
          <strong>Stripe :</strong> pour le traitement des paiements et l&rsquo;entiercement des fonds
        </li>
        <li>
          <strong>Fournisseurs de services :</strong> h&eacute;bergement (Railway), analytique,
          notifications (SendGrid, Firebase) — li&eacute;s par des ententes de confidentialit&eacute;
        </li>
        <li>
          <strong>Obligations l&eacute;gales :</strong> lorsque requis par la loi, une ordonnance
          judiciaire ou une demande gouvernementale valide
        </li>
        <li>
          <strong>Protection des droits :</strong> pour prot&eacute;ger les droits, la propri&eacute;t&eacute;
          ou la s&eacute;curit&eacute; de WorkOn, de nos utilisateurs ou du public
        </li>
      </UL>

      {/* ====== 6. Consentement Loi 25 ====== */}
      <SectionTitle id="consentement">6. Consentement (Loi 25)</SectionTitle>
      <P>
        Conform&eacute;ment &agrave; la Loi 25, nous obtenons votre consentement de mani&egrave;re
        claire, libre et &eacute;clair&eacute;e avant de collecter, utiliser ou communiquer vos
        renseignements personnels.
      </P>
      <P>
        Votre consentement est obtenu au moment de la cr&eacute;ation de votre compte
        et, lorsque n&eacute;cessaire, de fa&ccedil;on sp&eacute;cifique pour certains traitements
        (ex.&nbsp;: g&eacute;olocalisation, communications marketing).
      </P>
      <P>
        Vous pouvez retirer votre consentement &agrave; tout moment en nous contactant
        &agrave;{" "}
        <a href="mailto:privacy@workon.ca" className="text-workon-primary font-medium hover:underline">
          privacy@workon.ca
        </a>
        {" "}ou via les param&egrave;tres de votre compte. Le retrait du consentement peut
        limiter votre acc&egrave;s &agrave; certaines fonctionnalit&eacute;s.
      </P>

      {/* ====== 7. Droits ====== */}
      <SectionTitle id="droits">7. Vos droits</SectionTitle>
      <P>
        Conform&eacute;ment &agrave; la Loi 25 et &agrave; la Loi sur la protection des renseignements
        personnels et les documents &eacute;lectroniques (LPRPDE), vous disposez des
        droits suivants :
      </P>
      <UL>
        <li>
          <strong>Acc&egrave;s :</strong> obtenir une copie de vos renseignements personnels
          que nous d&eacute;tenons
        </li>
        <li>
          <strong>Rectification :</strong> corriger les renseignements inexacts ou incomplets
        </li>
        <li>
          <strong>Suppression :</strong> demander la suppression de votre compte et
          l&rsquo;anonymisation de vos donn&eacute;es
        </li>
        <li>
          <strong>Portabilit&eacute; :</strong> recevoir vos donn&eacute;es dans un format structur&eacute;
          et couramment utilis&eacute;
        </li>
        <li>
          <strong>Retrait du consentement :</strong> retirer votre consentement &agrave; tout moment
        </li>
        <li>
          <strong>D&eacute;sindexation :</strong> demander la d&eacute;sindexation de vos renseignements
          personnels d&rsquo;un service de recherche
        </li>
      </UL>
      <P>
        Pour exercer ces droits, contactez le ROPPA &agrave;{" "}
        <a href="mailto:privacy@workon.ca" className="text-workon-primary font-medium hover:underline">
          privacy@workon.ca
        </a>
        . Nous r&eacute;pondrons dans un d&eacute;lai de 30 jours.
      </P>

      {/* ====== 8. Conservation ====== */}
      <SectionTitle id="conservation">8. Conservation des renseignements</SectionTitle>
      <P>
        Nous conservons vos renseignements personnels aussi longtemps que n&eacute;cessaire
        pour fournir nos services et respecter nos obligations l&eacute;gales :
      </P>
      <UL>
        <li><strong>Compte actif :</strong> dur&eacute;e de vie du compte</li>
        <li><strong>Donn&eacute;es de transaction :</strong> 7 ans (obligations fiscales et comptables)</li>
        <li><strong>Journaux techniques :</strong> 12 mois maximum</li>
        <li><strong>Apr&egrave;s suppression du compte :</strong> anonymisation dans les 30 jours, sauf obligations l&eacute;gales</li>
      </UL>

      {/* ====== 9. Sécurité ====== */}
      <SectionTitle id="securite">9. S&eacute;curit&eacute; des renseignements</SectionTitle>
      <P>
        Nous mettons en oeuvre des mesures de s&eacute;curit&eacute; techniques et
        organisationnelles pour prot&eacute;ger vos renseignements personnels :
      </P>
      <UL>
        <li>Chiffrement des donn&eacute;es en transit (HTTPS/TLS)</li>
        <li>Chiffrement des donn&eacute;es sensibles au repos</li>
        <li>Mots de passe hach&eacute;s avec algorithme s&eacute;curis&eacute;</li>
        <li>Contr&ocirc;le d&rsquo;acc&egrave;s strict aux donn&eacute;es</li>
        <li>Surveillance et journalisation des acc&egrave;s</li>
        <li>Donn&eacute;es de paiement trait&eacute;es exclusivement par Stripe (certifi&eacute; PCI DSS)</li>
      </UL>
      <P>
        En cas d&rsquo;incident de confidentialit&eacute;, nous vous en informerons conform&eacute;ment
        aux exigences de la Loi 25, incluant la notification &agrave; la Commission
        d&rsquo;acc&egrave;s &agrave; l&rsquo;information du Qu&eacute;bec (CAI) lorsque requis.
      </P>

      {/* ====== 10. Cookies ====== */}
      <SectionTitle id="cookies">10. T&eacute;moins (Cookies)</SectionTitle>
      <P>
        Nous utilisons des t&eacute;moins essentiels au fonctionnement de la plateforme :
      </P>
      <UL>
        <li><strong>T&eacute;moins d&rsquo;authentification :</strong> maintien de votre session connect&eacute;e</li>
        <li><strong>T&eacute;moins de pr&eacute;f&eacute;rences :</strong> langue, param&egrave;tres d&rsquo;affichage</li>
        <li><strong>T&eacute;moins analytiques :</strong> mesures d&rsquo;utilisation anonymis&eacute;es pour am&eacute;liorer le service</li>
      </UL>
      <P>
        Nous n&rsquo;utilisons pas de t&eacute;moins publicitaires &agrave; des fins de ciblage
        comportemental. Vous pouvez g&eacute;rer vos pr&eacute;f&eacute;rences de t&eacute;moins via les
        param&egrave;tres de votre navigateur.
      </P>

      {/* ====== 11. Transferts ====== */}
      <SectionTitle id="transferts">11. Transferts internationaux</SectionTitle>
      <P>
        Vos renseignements peuvent &ecirc;tre trait&eacute;s par des fournisseurs situ&eacute;s &agrave;
        l&rsquo;ext&eacute;rieur du Canada (notamment aux &Eacute;tats-Unis pour Stripe et certains
        services d&rsquo;h&eacute;bergement). Dans ce cas, nous nous assurons que des
        garanties contractuelles appropri&eacute;es sont en place pour prot&eacute;ger vos
        renseignements, conform&eacute;ment &agrave; la Loi 25.
      </P>

      {/* ====== 12. Mineurs ====== */}
      <SectionTitle id="mineurs">12. Mineurs</SectionTitle>
      <P>
        Nos services ne s&rsquo;adressent pas aux personnes de moins de 18 ans.
        Nous ne collectons pas sciemment de renseignements personnels de mineurs.
        Si nous d&eacute;couvrons que nous avons collect&eacute; des renseignements d&rsquo;un mineur,
        nous les supprimerons dans les meilleurs d&eacute;lais.
      </P>

      {/* ====== 13. Modifications ====== */}
      <SectionTitle id="modifications">13. Modifications de cette politique</SectionTitle>
      <P>
        Nous pouvons modifier cette politique de temps &agrave; autre. En cas de
        modification importante, nous vous en informerons par courriel ou via
        une notification sur la plateforme au moins 30 jours avant l&rsquo;entr&eacute;e en
        vigueur. Votre utilisation continue de nos services apr&egrave;s notification
        constitue votre acceptation des modifications.
      </P>

      {/* ====== 14. Plaintes ====== */}
      <SectionTitle id="plaintes">14. Plaintes</SectionTitle>
      <P>
        Si vous n&rsquo;&ecirc;tes pas satisfait de notre traitement de vos renseignements
        personnels, vous pouvez :
      </P>
      <UL>
        <li>Nous contacter &agrave; <a href="mailto:privacy@workon.ca" className="text-workon-primary font-medium hover:underline">privacy@workon.ca</a></li>
        <li>D&eacute;poser une plainte aupr&egrave;s de la Commission d&rsquo;acc&egrave;s &agrave; l&rsquo;information du Qu&eacute;bec (CAI)</li>
        <li>D&eacute;poser une plainte aupr&egrave;s du Commissariat &agrave; la protection de la vie priv&eacute;e du Canada</li>
      </UL>

      {/* ====== 15. Contact ====== */}
      <SectionTitle id="contact">15. Nous contacter</SectionTitle>
      <P>
        Pour toute question concernant cette politique ou vos renseignements
        personnels :
      </P>
      <InfoBox>
        <p className="font-semibold text-workon-ink">WorkOn Technologies Inc.</p>
        <p className="text-workon-gray mt-1">Qu&eacute;bec, Canada</p>
        <p className="text-workon-gray mt-1">
          Protection des donn&eacute;es :{" "}
          <a href="mailto:privacy@workon.ca" className="text-workon-primary font-medium hover:underline">
            privacy@workon.ca
          </a>
        </p>
        <p className="text-workon-gray mt-1">
          Questions g&eacute;n&eacute;rales :{" "}
          <a href="mailto:legal@workon.ca" className="text-workon-primary font-medium hover:underline">
            legal@workon.ca
          </a>
        </p>
      </InfoBox>

      {/* Version tag */}
      <div className="mt-12 pt-6 border-t border-workon-border flex flex-wrap items-center justify-between gap-4 text-sm text-workon-muted">
        <span>PRIVACY v{VERSION} &mdash; {LAST_UPDATED}</span>
        <Link href="/legal/terms" className="text-workon-primary hover:underline">
          Conditions d&rsquo;utilisation
        </Link>
      </div>
    </article>
  );
}
