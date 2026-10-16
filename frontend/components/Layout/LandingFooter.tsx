import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-main py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-lg font-bold text-dark mb-4">
              Candidat<span className="text-primary-500">IA</span>
            </div>
            <p className="text-sm text-slate-500">
              Generez votre pack de candidature complet en 1 clic grace a l IA.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-dark mb-4 text-sm">Produit</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/#features" className="hover:text-primary-600">Fonctionnalites</Link></li>
              <li><Link href="/#pricing" className="hover:text-primary-600">Tarifs</Link></li>
              <li><Link href="/#how" className="hover:text-primary-600">Comment ca marche</Link></li>
              <li><Link href="/register" className="hover:text-primary-600">Essai gratuit</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-dark mb-4 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/legal/terms" className="hover:text-primary-600">Conditions d utilisation</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-primary-600">Confidentialite</Link></li>
              <li><Link href="/legal/cookies" className="hover:text-primary-600">Cookies</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-dark mb-4 text-sm">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="mailto:contact@candidatia.com" className="hover:text-primary-600">contact@candidatia.com</a></li>
              <li><a href="https://twitter.com/candidatia" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">Twitter</a></li>
              <li><a href="https://linkedin.com/company/candidatia" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
          <p>&copy; 2026 CandidatIA. Tous droits reserves.</p>
        </div>
      </div>
    </footer>
  );
}
