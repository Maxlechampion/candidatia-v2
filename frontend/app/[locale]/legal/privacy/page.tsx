import Link from "next/link";

export default function PrivacyPage() {
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
          Politique de Confidentialité
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Dernière mise à jour : 1er octobre 2026
        </p>

        <div className="space-y-6 text-slate-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              1. Responsable du traitement
            </h2>
            <p>
              Le responsable du traitement des données personnelles collectées
              via la plateforme CandidatIA est :
            </p>
            <p className="mt-2">
              <strong>CandidatIA</strong><br />
              Adresse : [à compléter], Bénin<br />
              Email : contact@candidatia.com
            </p>
            <p className="mt-2">
              Conformément à la loi n° 2017-20 portant Code du numérique,
              CandidatIA a effectué une déclaration auprès de l'Autorité de
              Protection des Données Personnelles (APDP) sous le numéro
              [à compléter après déclaration].
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              2. Données collectées
            </h2>
            <p>Nous collectons les catégories de données suivantes :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Données d'identité :</strong> nom complet, adresse email</li>
              <li><strong>Données professionnelles :</strong> contenu du CV, expériences, formations, compétences</li>
              <li><strong>Données de paiement :</strong> historique des transactions (nous ne stockons pas les numéros de carte)</li>
              <li><strong>Données de connexion :</strong> adresse IP, journaux de connexion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              3. Finalités du traitement
            </h2>
            <p>Vos données sont traitées pour les finalités suivantes :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Génération des documents de candidature (CV, lettre, guide)</li>
              <li>Gestion de votre compte utilisateur</li>
              <li>Traitement des paiements et gestion des crédits</li>
              <li>Envoi de communications transactionnelles (confirmations, rappels)</li>
              <li>Amélioration du Service</li>
            </ul>
            <p className="mt-2">
              Conformément à l'article 383 du Code du numérique, ces finalités
              sont déterminées, explicites et légitimes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              4. Destinataires des données
            </h2>
            <p>
              Vos données peuvent être transmises aux sous-traitants suivants,
              dans la stricte mesure nécessaire à l'exécution de leurs missions :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Supabase</strong> (base de données) – hébergement sécurisé</li>
              <li><strong>Brevo</strong> (envoi d'emails transactionnels)</li>
              <li><strong>FedaPay, Flutterwave, Raenest</strong> (traitement des paiements)</li>
              <li><strong>Groq, Google</strong> (fournisseurs d'intelligence artificielle)</li>
            </ul>
            <p className="mt-2">
              Certains de ces sous-traitants sont situés hors du Bénin. Ces
              transferts sont encadrés conformément aux articles 391 et suivants
              du Code du numérique, qui exigent un niveau de protection équivalent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              5. Durée de conservation
            </h2>
            <p>
              Conformément à l'article 383.6 du Code du numérique, vos données
              sont conservées pour une durée limitée à celle nécessaire à
              l'atteinte des finalités :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Données de compte :</strong> supprimées dans les 30 jours suivant la désinscription</li>
              <li><strong>Données transactionnelles :</strong> conservées pendant la durée légale obligatoire (10 ans)</li>
              <li><strong>Cookies :</strong> durée maximale de 13 mois</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              6. Vos droits
            </h2>
            <p>
              Conformément aux articles 437 à 448 du Code du numérique, vous
              disposez des droits suivants :
            </p>

            <div className="mt-4 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-dark mb-2">Droit d'accès</h3>
                <p className="text-sm">
                  Vous pouvez demander à consulter l'intégralité des données vous
                  concernant. Le responsable du traitement doit répondre dans un
                  délai maximum de <strong>soixante (60) jours</strong>.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-dark mb-2">Droit d'opposition</h3>
                <p className="text-sm">
                  Vous pouvez vous opposer, gratuitement et sans justification, à
                  ce que vos données soient utilisées à des fins de prospection
                  commerciale. Le responsable du traitement doit répondre dans un
                  délai maximum de <strong>trente (30) jours</strong>.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-dark mb-2">Droit de rectification et de suppression</h3>
                <p className="text-sm">
                  Vous pouvez demander la correction ou la suppression de vos
                  données inexactes, incomplètes ou dont la collecte est interdite.
                  Le responsable du traitement doit répondre dans un délai maximum
                  de <strong>quarante-cinq (45) jours</strong>.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-dark mb-2">Droit à la portabilité</h3>
                <p className="text-sm">
                  Vous pouvez recevoir vos données dans un format structuré,
                  couramment utilisé et lisible par machine, et les transmettre
                  à un autre responsable de traitement.
                </p>
              </div>
            </div>

            <p className="mt-4">
              Pour exercer ces droits, adressez une demande écrite, datée et
              signée à : <strong>contact@candidatia.com</strong>, accompagnée
              d'une copie de votre pièce d'identité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">7. Sécurité</h2>
            <p>
              Conformément à l'article 426 du Code du numérique, CandidatIA met
              en œuvre les mesures techniques et organisationnelles suivantes :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Chiffrement des mots de passe (bcrypt)</li>
              <li>Chiffrement des communications (HTTPS/TLS)</li>
              <li>Contrôle d'accès aux données personnelles</li>
              <li>Surveillance des violations de données</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">8. Réclamation</h2>
            <p>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez
              introduire une réclamation auprès de l'Autorité de Protection des
              Données Personnelles (APDP) du Bénin :
            </p>
            <p className="mt-2">
              APDP – Rue 6.076, Aidjèdo, Immeuble El MARZOUK Joël, Cotonou<br />
              Téléphone : (+229) 21 32 57 88<br />
              Email : contact@apdp.bj<br />
              Site : www.apdp.bj
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              9. Modification de la politique
            </h2>
            <p>
              La présente politique peut être modifiée à tout moment. Les
              utilisateurs seront informés par email de toute modification
              substantielle au moins 15 jours avant son entrée en vigueur.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-sm text-slate-500">
          <p>CandidatIA – Déclaration APDP n° [à compléter après déclaration]</p>
        </div>
      </article>
    </main>
  );
}
