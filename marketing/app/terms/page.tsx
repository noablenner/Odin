import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { legal } from "@/lib/config";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description:
    "Les conditions qui régissent l'utilisation du service Odin : comptes, abonnement, usage acceptable et responsabilités.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Conditions d'utilisation"
      intro={`En utilisant ${legal.productName}, vous acceptez les présentes conditions.`}
    >
      <h2 id="service">1. Description du service</h2>
      <p>
        {legal.productName} est un assistant IA pour entreprises qui se connecte à vos
        outils et à votre base de connaissances afin de répondre à vos demandes et
        d&apos;exécuter des actions sur plusieurs canaux (web, WhatsApp, Telegram). Le
        service est fourni par <strong>{legal.legalEntity}</strong>.
      </p>

      <h2 id="comptes">2. Comptes</h2>
      <p>
        Vous êtes responsable de l&apos;exactitude des informations de votre compte et de
        la confidentialité de vos identifiants. Vous devez disposer des droits nécessaires
        sur les comptes et données que vous connectez à {legal.productName}.
      </p>

      <h2 id="abonnement">3. Abonnement et paiement</h2>
      <p>
        Certaines fonctionnalités nécessitent un abonnement payant. Les prix, paliers et
        modalités de facturation sont indiqués sur la page Tarifs. Sauf mention contraire,
        les abonnements sont renouvelés automatiquement et peuvent être résiliés à tout
        moment, avec effet à la fin de la période en cours.
        {" "}
        {/* TODO: préciser les conditions de remboursement / résiliation exactes */}
      </p>

      <h2 id="usage">4. Usage acceptable</h2>
      <ul>
        <li>Ne pas utiliser le service à des fins illégales ou frauduleuses.</li>
        <li>
          Ne pas tenter de compromettre la sécurité, l&apos;intégrité ou la disponibilité
          du service.
        </li>
        <li>
          Ne pas importer ou traiter de données pour lesquelles vous n&apos;avez pas les
          droits requis, ni de contenu portant atteinte aux droits de tiers.
        </li>
        <li>
          Respecter les conditions d&apos;utilisation des services tiers que vous
          connectez (Airtable, Google, Microsoft, etc.).
        </li>
      </ul>

      <h2 id="pi">5. Propriété intellectuelle</h2>
      <p>
        {legal.productName}, sa marque et son logiciel restent la propriété de{" "}
        {legal.legalEntity}. Vous conservez l&apos;entière propriété de vos données et du
        contenu que vous importez. Vous nous accordez uniquement les droits nécessaires
        pour héberger et traiter ce contenu afin de vous fournir le service.
      </p>

      <h2 id="responsabilite">6. Limitation de responsabilité</h2>
      <p>
        Le service est fourni « en l&apos;état ». Les réponses générées par l&apos;IA
        peuvent comporter des erreurs ; elles ne constituent pas un conseil professionnel
        et doivent être vérifiées avant toute décision importante. Dans les limites
        autorisées par la loi, {legal.legalEntity} ne saurait être tenue responsable des
        dommages indirects résultant de l&apos;utilisation du service.
      </p>

      <h2 id="resiliation">7. Résiliation</h2>
      <p>
        Vous pouvez cesser d&apos;utiliser le service et supprimer votre compte à tout
        moment. Nous pouvons suspendre ou résilier un accès en cas de violation des
        présentes conditions.
      </p>

      <h2 id="droit">8. Droit applicable</h2>
      <p>
        {/* TODO: préciser le droit applicable et la juridiction compétente */}
        Les présentes conditions sont régies par le droit applicable au siège de{" "}
        {legal.legalEntity} [À COMPLÉTER]. Tout litige sera soumis aux tribunaux
        compétents de ce ressort.
      </p>

      <h2 id="contact">9. Contact</h2>
      <p>
        Pour toute question relative à ces conditions :{" "}
        <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a>.
      </p>
    </LegalLayout>
  );
}
