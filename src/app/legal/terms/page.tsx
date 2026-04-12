/**
 * Terms of Service Page - WorkOn
 * Version: TERMS v2.0
 * Effective Date: 2026-04-11
 *
 * Conformite: Loi 25 (Quebec), Code civil du Quebec
 *
 * POSITIONNEMENT LEGAL CRITIQUE:
 * - WorkOn est une PLATEFORME DE MISE EN RELATION
 * - WorkOn n'est PAS un employeur
 * - WorkOn n'exerce AUCUN lien de subordination
 * - Les travailleurs sont des TRAVAILLEURS AUTONOMES INDEPENDANTS
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description:
    "Conditions generales d'utilisation de WorkOn, plateforme de mise en relation pour travailleurs autonomes au Quebec.",
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

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-6 p-5 bg-workon-accent-subtle border border-workon-accent/20 rounded-lg">
      {children}
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-6 p-5 bg-workon-bg-cream border border-workon-border rounded-lg">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function TermsPage() {
  return (
    <article>
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-workon-ink mb-4">
          Conditions g&eacute;n&eacute;rales d&rsquo;utilisation
        </h1>
        <div className="flex flex-wrap gap-3 text-sm text-workon-muted">
          <span className="px-3 py-1 bg-workon-primary-subtle text-workon-primary rounded-full font-medium">
            Version {VERSION}
          </span>
          <span className="py-1">En vigueur depuis le {EFFECTIVE_DATE}</span>
          <span className="py-1">Derni&egrave;re mise &agrave; jour : {LAST_UPDATED}</span>
        </div>
      </header>

      {/* ====== 1. Acceptation ====== */}
      <SectionTitle id="acceptation">1. Acceptation des conditions</SectionTitle>
      <P>
        Les pr&eacute;sentes conditions d&rsquo;utilisation (&laquo;&nbsp;Conditions&nbsp;&raquo;) r&eacute;gissent votre
        utilisation de la plateforme WorkOn, exploit&eacute;e par WorkOn Technologies Inc.
        (&laquo;&nbsp;WorkOn&nbsp;&raquo;, &laquo;&nbsp;nous&nbsp;&raquo;, &laquo;&nbsp;notre&nbsp;&raquo;), soci&eacute;t&eacute; constitu&eacute;e en vertu des lois du Qu&eacute;bec.
      </P>
      <P>
        En cr&eacute;ant un compte ou en utilisant nos services, vous acceptez d&rsquo;&ecirc;tre
        li&eacute; par ces Conditions et notre{" "}
        <Link href="/legal/privacy" className="text-workon-primary font-medium hover:underline">
          Politique de confidentialit&eacute;
        </Link>
        . Si vous n&rsquo;acceptez pas ces Conditions, veuillez ne pas utiliser la
        plateforme.
      </P>

      {/* ====== 2. Description ====== */}
      <SectionTitle id="description">2. Description du service</SectionTitle>
      <P>
        WorkOn est une <strong>plateforme technologique de mise en relation</strong> qui
        permet &agrave; des travailleurs autonomes ind&eacute;pendants, des employeurs et des
        clients r&eacute;sidentiels de se connecter pour des missions de services au Qu&eacute;bec.
      </P>

      <Callout>
        <h3 className="text-base font-semibold text-workon-accent mb-3">
          Important — Ce que WorkOn n&rsquo;est PAS
        </h3>
        <UL>
          <li>WorkOn <strong>n&rsquo;est pas</strong> un employeur</li>
          <li>WorkOn <strong>n&rsquo;est pas</strong> une agence de placement de personnel</li>
          <li>WorkOn <strong>ne fournit pas</strong> de services de travail</li>
          <li>WorkOn <strong>n&rsquo;exerce aucun</strong> lien de subordination sur les travailleurs</li>
          <li>WorkOn <strong>ne donne aucune</strong> directive op&eacute;rationnelle aux travailleurs</li>
          <li>WorkOn <strong>ne garantit pas</strong> de revenus, de missions ou de volume de travail</li>
        </UL>
      </Callout>

      {/* ====== 3. Statut TA ====== */}
      <SectionTitle id="statut-ta">3. Statut des travailleurs autonomes</SectionTitle>
      <P>
        Les utilisateurs offrant des services via la plateforme sont des{" "}
        <strong>travailleurs autonomes ind&eacute;pendants</strong> au sens du Code civil du Qu&eacute;bec
        et de la Loi sur les normes du travail. Ils ne sont pas des employ&eacute;s de WorkOn, des
        clients ou des employeurs utilisant la plateforme.
      </P>

      <SubTitle>3.1 Ind&eacute;pendance des travailleurs</SubTitle>
      <P>Les travailleurs autonomes :</P>
      <UL>
        <li>Choisissent librement les missions qu&rsquo;ils acceptent ou refusent</li>
        <li>Fixent leurs propres tarifs et conditions de travail</li>
        <li>D&eacute;terminent leurs horaires et m&eacute;thodes de travail</li>
        <li>Utilisent leurs propres outils et &eacute;quipements</li>
        <li>Peuvent offrir leurs services &agrave; d&rsquo;autres clients en dehors de la plateforme</li>
        <li>N&rsquo;ont aucune obligation d&rsquo;exclusivit&eacute; envers WorkOn</li>
      </UL>

      <SubTitle>3.2 Responsabilit&eacute;s des travailleurs</SubTitle>
      <P>Chaque travailleur autonome est enti&egrave;rement responsable de :</P>
      <UL>
        <li>La qualit&eacute; de ses services</li>
        <li>Ses obligations fiscales (d&eacute;clarations, imp&ocirc;ts, TPS/TVQ)</li>
        <li>Ses assurances professionnelles et de responsabilit&eacute; civile</li>
        <li>Ses permis et certifications professionnelles requises</li>
        <li>Sa conformit&eacute; &agrave; la r&eacute;glementation de la CNESST, le cas &eacute;ch&eacute;ant</li>
        <li>Sa conformit&eacute; aux lois et r&egrave;glements applicables</li>
      </UL>

      {/* ====== 4. Contrats ====== */}
      <SectionTitle id="contrats">4. Contrats de service</SectionTitle>
      <P>
        Chaque mission convenue via la plateforme constitue un contrat de service
        distinct entre le travailleur autonome et le client ou l&rsquo;employeur.
        WorkOn n&rsquo;est pas partie &agrave; ce contrat.
      </P>
      <P>
        La plateforme peut faciliter la cr&eacute;ation d&rsquo;un document contractuel
        num&eacute;rique entre les parties, mais ce contrat lie uniquement les parties
        concern&eacute;es.
      </P>

      {/* ====== 5. Comptes ====== */}
      <SectionTitle id="comptes">5. Cr&eacute;ation de compte</SectionTitle>
      <P>
        Pour utiliser la plateforme, vous devez cr&eacute;er un compte et fournir des
        informations exactes et compl&egrave;tes. Vous &ecirc;tes responsable de :
      </P>
      <UL>
        <li>Maintenir la confidentialit&eacute; de vos identifiants de connexion</li>
        <li>Toutes les activit&eacute;s effectu&eacute;es depuis votre compte</li>
        <li>Mettre &agrave; jour vos informations si elles changent</li>
        <li>Nous informer imm&eacute;diatement de tout acc&egrave;s non autoris&eacute;</li>
      </UL>
      <P>Vous devez avoir au moins 18 ans pour utiliser la plateforme.</P>

      {/* ====== 6. Utilisation acceptable ====== */}
      <SectionTitle id="utilisation">6. Utilisation acceptable</SectionTitle>
      <P>En utilisant la plateforme, vous acceptez de ne pas :</P>
      <UL>
        <li>Fournir de fausses informations ou usurper une identit&eacute;</li>
        <li>Utiliser la plateforme &agrave; des fins ill&eacute;gales</li>
        <li>Harceler, menacer ou discriminer d&rsquo;autres utilisateurs</li>
        <li>Publier du contenu offensant, diffamatoire ou inappropri&eacute;</li>
        <li>Contourner les mesures de s&eacute;curit&eacute; de la plateforme</li>
        <li>Utiliser des robots, scripts ou m&eacute;thodes automatis&eacute;es non autoris&eacute;es</li>
        <li>Interf&eacute;rer avec le bon fonctionnement de la plateforme</li>
        <li>Contourner le syst&egrave;me de paiement de la plateforme</li>
      </UL>

      {/* ====== 7. Paiements ====== */}
      <SectionTitle id="paiements">7. Paiements et frais</SectionTitle>

      <SubTitle>7.1 Traitement des paiements</SubTitle>
      <P>
        Les paiements sont trait&eacute;s par notre partenaire{" "}
        <a
          href="https://stripe.com/legal"
          target="_blank"
          rel="noopener noreferrer"
          className="text-workon-primary font-medium hover:underline"
        >
          Stripe
        </a>
        . En utilisant les fonctionnalit&eacute;s de paiement, vous acceptez &eacute;galement les
        conditions de service de Stripe.
      </P>

      <SubTitle>7.2 Syst&egrave;me d&rsquo;entiercement (escrow)</SubTitle>
      <P>
        Pour prot&eacute;ger les deux parties, les fonds sont d&eacute;pos&eacute;s en entiercement lors de
        la confirmation d&rsquo;une mission. Les fonds sont lib&eacute;r&eacute;s au travailleur autonome une
        fois la mission compl&eacute;t&eacute;e et approuv&eacute;e par le client, ou selon les termes du contrat
        de service.
      </P>

      <SubTitle>7.3 Commission de la plateforme</SubTitle>
      <P>
        WorkOn per&ccedil;oit une commission de 10 &agrave; 15&nbsp;% sur les transactions effectu&eacute;es
        via la plateforme. Le taux exact est clairement indiqu&eacute; avant la confirmation
        de chaque transaction. Cette commission couvre les co&ucirc;ts d&rsquo;exploitation de la
        plateforme, incluant le traitement des paiements, le support et la mise en
        relation.
      </P>

      <SubTitle>7.4 Responsabilit&eacute; fiscale</SubTitle>
      <P>
        Chaque utilisateur est responsable de ses propres obligations fiscales,
        y compris la d&eacute;claration des revenus et le paiement des taxes applicables
        (TPS/TVQ). WorkOn n&rsquo;&eacute;met pas de feuillets fiscaux T4 &mdash; les travailleurs
        autonomes doivent d&eacute;clarer leurs revenus comme travailleurs ind&eacute;pendants.
      </P>

      {/* ====== 8. Annulations ====== */}
      <SectionTitle id="annulations">8. Annulations et litiges</SectionTitle>
      <P>
        Les modalit&eacute;s d&rsquo;annulation sont convenues entre les parties &agrave; chaque
        mission. En cas de litige entre utilisateurs, WorkOn peut offrir une
        m&eacute;diation, mais n&rsquo;est pas responsable des diff&eacute;rends entre les parties.
      </P>

      {/* ====== 9. PI ====== */}
      <SectionTitle id="propriete-intellectuelle">9. Propri&eacute;t&eacute; intellectuelle</SectionTitle>
      <P>
        La plateforme WorkOn, incluant son code, son design, ses marques et son
        contenu, est la propri&eacute;t&eacute; de WorkOn Technologies Inc. et est prot&eacute;g&eacute;e
        par les lois sur la propri&eacute;t&eacute; intellectuelle.
      </P>
      <P>
        Le contenu que vous publiez sur la plateforme reste votre propri&eacute;t&eacute;.
        En le publiant, vous accordez &agrave; WorkOn une licence non exclusive, libre de
        redevances, pour l&rsquo;afficher et le distribuer dans le cadre du service.
      </P>

      {/* ====== 10. Limitation ====== */}
      <SectionTitle id="limitation">10. Limitation de responsabilit&eacute;</SectionTitle>
      <P>
        WorkOn fournit la plateforme &laquo;&nbsp;telle quelle&nbsp;&raquo; et &laquo;&nbsp;selon disponibilit&eacute;&nbsp;&raquo;.
        Dans les limites permises par la loi :
      </P>
      <UL>
        <li>WorkOn ne garantit pas la disponibilit&eacute; ininterrompue de la plateforme</li>
        <li>WorkOn n&rsquo;est pas responsable des actions, de la qualit&eacute; des services ou de la conduite des utilisateurs</li>
        <li>WorkOn n&rsquo;est pas responsable des dommages indirects, accessoires ou cons&eacute;cutifs</li>
        <li>La responsabilit&eacute; totale de WorkOn est limit&eacute;e aux frais que vous avez pay&eacute;s &agrave; WorkOn au cours des 12 derniers mois</li>
      </UL>

      {/* ====== 11. Indemnisation ====== */}
      <SectionTitle id="indemnisation">11. Indemnisation</SectionTitle>
      <P>
        Vous acceptez d&rsquo;indemniser et de d&eacute;gager WorkOn de toute
        responsabilit&eacute; pour toute r&eacute;clamation, perte ou dommage d&eacute;coulant de :
      </P>
      <UL>
        <li>Votre utilisation de la plateforme</li>
        <li>Votre violation de ces Conditions</li>
        <li>Votre violation des droits de tiers</li>
        <li>Les services que vous fournissez ou recevez via la plateforme</li>
      </UL>

      {/* ====== 12. Résiliation ====== */}
      <SectionTitle id="resiliation">12. Suspension et r&eacute;siliation</SectionTitle>
      <P>
        WorkOn peut suspendre ou r&eacute;silier votre acc&egrave;s &agrave; la plateforme en cas de
        violation de ces Conditions ou pour toute autre raison l&eacute;gitime, avec
        ou sans pr&eacute;avis.
      </P>
      <P>
        Vous pouvez supprimer votre compte &agrave; tout moment via les param&egrave;tres de
        votre profil. La suppression entra&icirc;ne l&rsquo;anonymisation de vos donn&eacute;es
        personnelles conform&eacute;ment &agrave; notre Politique de confidentialit&eacute;.
      </P>

      {/* ====== 13. Modifications ====== */}
      <SectionTitle id="modifications">13. Modifications des conditions</SectionTitle>
      <P>
        Nous pouvons modifier ces Conditions de temps &agrave; autre. En cas de
        modification importante, nous vous en informerons par courriel ou via
        une notification sur la plateforme au moins 30 jours avant l&rsquo;entr&eacute;e
        en vigueur.
      </P>
      <P>
        Votre utilisation continue de la plateforme apr&egrave;s l&rsquo;entr&eacute;e en vigueur
        des modifications constitue votre acceptation des nouvelles Conditions.
      </P>

      {/* ====== 14. Droit applicable ====== */}
      <SectionTitle id="droit-applicable">14. Droit applicable et juridiction</SectionTitle>
      <P>
        Ces Conditions sont r&eacute;gies par les lois de la province de Qu&eacute;bec et les
        lois f&eacute;d&eacute;rales du Canada applicables. Tout litige sera soumis &agrave; la
        comp&eacute;tence exclusive des tribunaux du district judiciaire de Montr&eacute;al,
        Qu&eacute;bec.
      </P>

      {/* ====== 15. Divisibilité ====== */}
      <SectionTitle id="divisibilite">15. Divisibilit&eacute;</SectionTitle>
      <P>
        Si une disposition de ces Conditions est jug&eacute;e invalide ou inapplicable,
        les autres dispositions restent en vigueur. La disposition invalide sera
        modifi&eacute;e dans la mesure minimale n&eacute;cessaire pour la rendre applicable.
      </P>

      {/* ====== 16. Contact ====== */}
      <SectionTitle id="contact">16. Nous contacter</SectionTitle>
      <P>Pour toute question concernant ces Conditions :</P>
      <InfoBox>
        <p className="font-semibold text-workon-ink">WorkOn Technologies Inc.</p>
        <p className="text-workon-gray mt-1">Qu&eacute;bec, Canada</p>
        <p className="text-workon-gray mt-1">
          Courriel :{" "}
          <a href="mailto:legal@workon.ca" className="text-workon-primary font-medium hover:underline">
            legal@workon.ca
          </a>
        </p>
      </InfoBox>

      {/* Version tag */}
      <div className="mt-12 pt-6 border-t border-workon-border text-sm text-workon-muted">
        TERMS v{VERSION} &mdash; {LAST_UPDATED}
      </div>
    </article>
  );
}
