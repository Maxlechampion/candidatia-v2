import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-main flex items-center justify-between py-4">
          <Link href="/" className="text-xl font-bold text-dark">
            Candidat<span className="text-primary-500">IA</span>
          </Link>
          <Link href="/" className="text-sm text-slate-600 hover:text-primary-600">
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <article className="container-main max-w-3xl py-12">
        <h1 className="text-3xl font-bold text-dark mb-2">
          Conditions Générales d'Utilisation
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Dernière mise à jour : 1er octobre 2026
        </p>

        <div className="space-y-6 text-slate-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              Article 1 – Objet et acceptation
            </h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (« CGU ») régissent
              l'accès et l'utilisation de la plateforme CandidatIA, accessible à
              l'adresse https://candidatia.com (le « Service »), éditée par
              CandidatIA, dont le siège est situé au Bénin.
            </p>
            <p className="mt-2">
              En créant un compte ou en utilisant le Service, l'utilisateur accepte
              sans réserve les présentes CGU, conformément à la loi n° 2017-20 du
              20 avril 2018 portant Code du numérique en République du Bénin.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              Article 2 – Description du Service
            </h2>
            <p>
              CandidatIA est un service en ligne de génération automatique de
              documents de candidature assistée par intelligence artificielle.
              Il permet à l'utilisateur de générer :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Un curriculum vitae (CV) optimisé</li>
              <li>Une lettre de motivation personnalisée</li>
              <li>Un guide de préparation à l'entretien</li>
              <li>Des brouillons de relance</li>
            </ul>
            <p className="mt-2">
              Le Service ne garantit en aucun cas l'obtention d'un emploi
              ou d'un entretien.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              Article 3 – Compte utilisateur
            </h2>
            <p>
              L'accès au Service nécessite la création d'un compte.
              L'utilisateur s'engage à fournir des informations exactes et à jour,
              et à préserver la confidentialité de ses identifiants de connexion.
            </p>
            <p className="mt-2">
              Toute activité effectuée depuis le compte de l'utilisateur est
              réputée effectuée par ce dernier.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              Article 4 – Prix et paiement
            </h2>
            <p>
              Les prix des différents plans sont indiqués en francs CFA (XOF)
              sur la page Tarifs. Le paiement peut être effectué par les moyens
              suivants :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Mobile Money (MTN MoMo, Moov Money, Celtiis Cash) via FedaPay</li>
              <li>Carte bancaire (Visa, Mastercard) via Flutterwave</li>
              <li>Cryptomonnaies stables (USDT, USDC) via Raenest</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              Article 5 – Droit de rétractation
            </h2>
            <p>
              Conformément aux articles 347 et 348 du Code du numérique, le
              consommateur dispose d'un délai de <strong>quinze (15) jours
              ouvrables</strong> pour exercer son droit de rétractation, sans
              avoir à justifier sa décision.
            </p>
            <p className="mt-2">
              <strong>Exception :</strong> Conformément à l'article 354 du Code
              du numérique, le droit de rétractation est perdu lorsque le service
              a été fourni dans sa totalité. Les contenus numériques (CV, lettre,
              guide) générés et téléchargés ne sont pas éligibles au droit de
              rétractation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              Article 6 – Propriété intellectuelle
            </h2>
            <p>
              Les documents générés par le Service appartiennent à l'utilisateur.
              Le code source, la marque CandidatIA et l'ensemble des éléments
              techniques de la plateforme sont la propriété exclusive de CandidatIA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              Article 7 – Responsabilité contractuelle
            </h2>
            <p>
              Conformément à l'article 329 du Code du numérique, CandidatIA est
              responsable de plein droit de la bonne exécution des obligations
              résultant des présentes CGU, sauf preuve que l'inexécution est
              imputable à l'utilisateur, à un tiers, ou à un cas de force majeure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              Article 8 – Communications commerciales
            </h2>
            <p>
              Conformément aux articles 330 à 332 du Code du numérique, toute
              prospection directe par courrier électronique est soumise au
              consentement préalable et exprès de l'utilisateur.
            </p>
            <p className="mt-2">
              L'utilisateur peut retirer son consentement à tout moment. Toute
              communication commerciale comportera la mention « Publicité » de
              manière claire et lisible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              Article 9 – Droit applicable et juridiction
            </h2>
            <p>
              Les présentes CGU sont soumises au droit béninois. Tout litige
              relatif à leur interprétation ou à leur exécution relève de la
              compétence exclusive des tribunaux de Cotonou.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              Article 10 – Modification des CGU
            </h2>
            <p>
              CandidatIA se réserve le droit de modifier les présentes CGU à tout
              moment. Les utilisateurs seront informés par email au moins 15 jours
              avant l'entrée en vigueur des modifications.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-sm text-slate-500">
          <p>CandidatIA – Déclaration APDP n° [à compléter après déclaration]</p>
          <p className="mt-1">Pour toute question : contact@candidatia.com</p>
        </div>
      </article>
    </main>
  );
}
