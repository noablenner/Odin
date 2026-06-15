import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { legal } from "@/lib/config";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment Odin collecte, utilise et protège vos données, y compris les données des outils connectés via OAuth.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      intro={`La présente politique explique quelles données ${legal.productName} traite, pourquoi, et comment vous gardez le contrôle.`}
    >
      <h2 id="editeur">1. Éditeur du service</h2>
      <p>
        {legal.productName} est édité par <strong>{legal.legalEntity}</strong>, dont
        le siège est situé à <strong>{legal.address}</strong>. Le service est accessible
        à l&apos;adresse <a href={legal.domain}>{legal.domain}</a>. Pour toute question
        relative à vos données, écrivez à{" "}
        <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>.
      </p>

      <h2 id="donnees">2. Données que nous collectons</h2>
      <ul>
        <li>
          <strong>Données de compte</strong> : adresse e-mail, informations
          d&apos;authentification et préférences de configuration de votre agent.
        </li>
        <li>
          <strong>Contenu que vous importez</strong> : documents, notes et URL ajoutés à
          la mémoire de votre agent, ainsi que l&apos;historique de vos conversations.
        </li>
        <li>
          <strong>Données des outils connectés via OAuth</strong> : lorsque vous
          connectez un compte tiers (Airtable, Google Drive, Gmail, Google Sheets,
          Microsoft Outlook/Excel, etc.), {legal.productName} accède aux données
          nécessaires pour exécuter vos demandes (par ex. enregistrements, fichiers,
          e-mails, événements). Les jetons d&apos;accès sont stockés chiffrés.
        </li>
        <li>
          <strong>Données techniques</strong> : journaux de connexion et données
          d&apos;usage strictement nécessaires au fonctionnement et à la sécurité.
        </li>
      </ul>

      <h2 id="finalites">3. Finalités et base légale (RGPD)</h2>
      <ul>
        <li>
          <strong>Fournir le service</strong> (exécution du contrat) : faire fonctionner
          votre agent, répondre à vos demandes et agir sur vos outils connectés.
        </li>
        <li>
          <strong>Sécurité et prévention des abus</strong> (intérêt légitime).
        </li>
        <li>
          <strong>Facturation</strong> (exécution du contrat / obligation légale) pour
          les offres payantes.
        </li>
        <li>
          <strong>Communication</strong> liée au service (intérêt légitime ou
          consentement selon le cas).
        </li>
      </ul>

      <h2 id="usage-oauth">4. Utilisation des données des comptes connectés</h2>
      <p>
        Les données auxquelles {legal.productName} accède via les comptes que vous
        connectez (Airtable, Gmail, Google Drive, Microsoft, etc.) sont utilisées{" "}
        <strong>uniquement pour vous fournir le service</strong> : permettre à votre
        agent de lire et d&apos;agir sur ces données à votre demande. Ces données{" "}
        <strong>
          ne sont jamais vendues, ni partagées à des fins publicitaires, ni utilisées
          pour entraîner des modèles d&apos;IA généraux
        </strong>
        . Elles ne sont accessibles qu&apos;à vous et aux traitements automatisés
        nécessaires à votre usage.
      </p>

      <h2 id="sous-traitants">5. Sous-traitants et services tiers</h2>
      <p>
        Pour fournir le service, nous faisons appel à des prestataires qui agissent comme
        sous-traitants :
      </p>
      <ul>
        <li>
          <strong>OpenAI</strong> — modèles d&apos;IA traitant vos requêtes (les
          fournisseurs de modèles ne réutilisent pas ces données via l&apos;API pour
          entraîner leurs modèles).
        </li>
        <li>
          <strong>Supabase</strong> — base de données, authentification et stockage.
        </li>
        <li>
          <strong>Railway</strong> et <strong>Vercel</strong> — hébergement de
          l&apos;application et du site.
        </li>
        <li>
          <strong>Airtable, Google et Microsoft</strong> — uniquement lorsque vous
          connectez ces comptes via OAuth, et dans la limite des autorisations que vous
          accordez.
        </li>
      </ul>
      <p>
        {/* TODO: ajuster la liste des sous-traitants à votre stack réelle */}
        Chaque prestataire n&apos;accède qu&apos;aux données nécessaires à sa fonction.
      </p>

      <h2 id="conservation">6. Durée de conservation</h2>
      <p>
        Vos données sont conservées tant que votre compte est actif. Le contenu importé et
        l&apos;historique sont conservés jusqu&apos;à leur suppression par vos soins. À la
        suppression de votre compte, vos données sont effacées sous un délai raisonnable
        {" "}
        {/* TODO: préciser le délai exact, ex. 30 jours */}
        (sauf obligations légales de conservation, par ex. facturation).
      </p>

      <h2 id="droits">7. Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez des droits d&apos;accès, de rectification,
        d&apos;effacement, de portabilité, de limitation et d&apos;opposition. Pour les
        exercer, écrivez à{" "}
        <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>. Vous pouvez
        également introduire une réclamation auprès de votre autorité de protection des
        données (en France, la CNIL).
      </p>

      <h2 id="revocation">8. Révoquer un accès OAuth et supprimer vos données</h2>
      <ul>
        <li>
          <strong>Révoquer un accès</strong> : dans l&apos;application, ouvrez
          l&apos;onglet <em>Connecteurs</em> et cliquez sur <em>Déconnecter</em> pour le
          service concerné. Vous pouvez aussi retirer l&apos;autorisation directement
          depuis votre compte Airtable, Google ou Microsoft.
        </li>
        <li>
          <strong>Supprimer vos données</strong> : supprimez des éléments de mémoire
          individuellement, ou supprimez votre compte depuis l&apos;onglet{" "}
          <em>Paramètres</em> (zone de danger), ce qui efface l&apos;ensemble de vos
          données. Vous pouvez également nous en faire la demande par e-mail.
        </li>
      </ul>

      <h2 id="securite">9. Sécurité</h2>
      <p>
        Les identifiants des comptes connectés sont chiffrés au repos (AES-256). Les accès
        sont cloisonnés par utilisateur et protégés par authentification. Les échanges
        sont chiffrés en transit (TLS).
      </p>

      <h2 id="cookies">10. Cookies</h2>
      <p>
        Le site utilise un stockage local strictement nécessaire (par ex. mémoriser le
        thème clair/sombre). L&apos;application utilise des cookies/jetons
        d&apos;authentification indispensables à la connexion. Aucun cookie publicitaire
        n&apos;est utilisé.
      </p>

      <h2 id="modifications">11. Modifications</h2>
      <p>
        Cette politique peut évoluer. En cas de changement important, nous vous en
        informerons via le service. La date de dernière mise à jour figure en haut de
        cette page.
      </p>

      <h2 id="contact">12. Contact</h2>
      <p>
        Pour toute question relative à la confidentialité :{" "}
        <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>. Pour
        l&apos;assistance générale :{" "}
        <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a>.
      </p>
    </LegalLayout>
  );
}
