import Link from "next/link";

export default function CookiesPage() {
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
          Politique de Cookies
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Dernière mise à jour : 1er octobre 2026
        </p>

        <div className="space-y-6 text-slate-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              1. Qu'est-ce qu'un cookie ?
            </h2>
            <p>
              Un cookie est un petit fichier texte déposé sur votre appareil
              lors de la visite d'un site web. Il permet de conserver des
              informations relatives à votre navigation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              2. Cookies utilisés sur CandidatIA
            </h2>
            <div className="space-y-4 mt-4">

              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-dark mb-2">
                  Cookies essentiels
                </h3>
                <p className="text-sm">
                  Nécessaires au fonctionnement du Service. Ils permettent
                  l'authentification (jeton JWT), la gestion de session et la
                  mémorisation de la langue préférée. Ces cookies ne peuvent
                  pas être désactivés.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-dark mb-2">
                  Cookies analytiques
                </h3>
                <p className="text-sm">
                  Utilisés pour mesurer l'audience de manière anonyme et
                  améliorer le Service. Vous pouvez les refuser sans impact
                  sur votre navigation.
                </p>
              </div>

            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              3. Durée de conservation
            </h2>
            <p>
              Conformément aux recommandations de l'APDP, la durée de vie des
              cookies n'excède pas treize (13) mois.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              4. Gérer vos préférences
            </h2>
            <p>
              Vous pouvez à tout moment modifier vos préférences en matière de
              cookies via le bandeau qui s'affiche lors de votre première
              visite, ou en configurant votre navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark mb-3">
              5. Plus d'informations
            </h2>
            <p>
              Pour toute question relative à notre utilisation des cookies,
              contactez-nous à : <strong>contact@candidatia.com</strong>.
            </p>
          </section>

        </div>
      </article>
    </main>
  );
}
