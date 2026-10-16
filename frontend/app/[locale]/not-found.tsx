import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-primary-600 mb-4">404</div>
        <h1 className="text-2xl font-bold text-dark mb-4">Page introuvable</h1>
        <p className="text-slate-600 mb-8">
          La page que vous cherchez n existe pas ou a ete deplacee.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition"
        >
          Retour a l accueil
        </Link>
      </div>
    </main>
  );
}
