import Link from "next/link";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex flex-col">
      <header className="p-6">
        <Link href="/" className="inline-block text-xl font-bold text-dark">
          Candidat<span className="text-primary-500">IA</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-dark mb-2">{title}</h1>
            {subtitle && <p className="text-slate-600">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>

      <footer className="p-6 text-center text-sm text-slate-500">
        <p>&copy; 2026 CandidatIA</p>
      </footer>
    </div>
  );
}
