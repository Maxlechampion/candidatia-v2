#!/usr/bin/env node
/**
 * setup-phase7b.js — CandidatIA
 * Phase 7b : Pages Auth (Login + Register) + composants UI
 *
 * Crée dans frontend/ :
 *   - components/ui/Button.tsx
 *   - components/ui/Input.tsx
 *   - components/ui/Card.tsx
 *   - components/ui/Alert.tsx
 *   - components/Layout/AuthLayout.tsx
 *   - app/[locale]/login/page.tsx
 *   - app/[locale]/register/page.tsx
 *   - lib/utils.ts
 *
 * Usage : node setup-phase7b.js
 * Prérequis : avoir exécuté setup-phase7a.js + npm install
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FRONTEND = path.join(ROOT, 'frontend');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeLines(relPath, lines) {
  const fullPath = path.join(FRONTEND, relPath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, lines.join('\n') + '\n', 'utf-8');
  console.log('  OK  ' + relPath);
}

function logHeader(title) {
  console.log('');
  console.log('='.repeat(70));
  console.log('  ' + title);
  console.log('='.repeat(70));
  console.log('');
}

function logStep(step) {
  console.log('');
  console.log('> ' + step);
}

logHeader('CandidatIA — Setup Phase 7b : Pages Auth');

if (!fs.existsSync(path.join(FRONTEND, 'package.json'))) {
  console.error('');
  console.error('  ERREUR : Le dossier frontend/ est introuvable.');
  console.error('  Execute d abord setup-phase7a.js.');
  console.error('');
  process.exit(1);
}

console.log('  Frontend : ' + FRONTEND);

// ============================================================
// 1. LIB/UTILS.TS
// ============================================================

logStep('1. lib/utils.ts (helper cn)');

writeLines('lib/utils.ts', [
  'import { type ClassValue, clsx } from "clsx";',
  'import { twMerge } from "tailwind-merge";',
  '',
  'export function cn(...inputs: ClassValue[]) {',
  '  return twMerge(clsx(inputs));',
  '}',
]);

// ============================================================
// 2. COMPOSANTS UI
// ============================================================

logStep('2. components/ui/Button.tsx');

writeLines('components/ui/Button.tsx', [
  'import { forwardRef, ButtonHTMLAttributes } from "react";',
  'import { cn } from "@/lib/utils";',
  '',
  'export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {',
  '  variant?: "primary" | "secondary" | "outline" | "ghost";',
  '  size?: "sm" | "md" | "lg";',
  '  loading?: boolean;',
  '}',
  '',
  'export const Button = forwardRef<HTMLButtonElement, ButtonProps>(',
  '  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {',
  '    const baseStyles =',
  '      "inline-flex items-center justify-center font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";',
  '',
  '    const variants = {',
  '      primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",',
  '      secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400",',
  '      outline: "bg-white text-primary-600 border-2 border-primary-100 hover:border-primary-300 focus:ring-primary-500",',
  '      ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400",',
  '    };',
  '',
  '    const sizes = {',
  '      sm: "px-3 py-1.5 text-sm",',
  '      md: "px-4 py-2.5 text-base",',
  '      lg: "px-6 py-3 text-base",',
  '    };',
  '',
  '    return (',
  '      <button',
  '        ref={ref}',
  '        className={cn(baseStyles, variants[variant], sizes[size], className)}',
  '        disabled={disabled || loading}',
  '        {...props}',
  '      >',
  '        {loading ? (',
  '          <span className="flex items-center gap-2">',
  '            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />',
  '            {children}',
  '          </span>',
  '        ) : (',
  '          children',
  '        )}',
  '      </button>',
  '    );',
  '  }',
  ');',
  '',
  'Button.displayName = "Button";',
]);

logStep('3. components/ui/Input.tsx');

writeLines('components/ui/Input.tsx', [
  'import { forwardRef, InputHTMLAttributes } from "react";',
  'import { cn } from "@/lib/utils";',
  '',
  'export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {',
  '  label?: string;',
  '  error?: string;',
  '  hint?: string;',
  '}',
  '',
  'export const Input = forwardRef<HTMLInputElement, InputProps>(',
  '  ({ className, label, error, hint, id, ...props }, ref) => {',
  '    const inputId = id || props.name;',
  '',
  '    return (',
  '      <div className="w-full">',
  '        {label && (',
  '          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1.5">',
  '            {label}',
  '          </label>',
  '        )}',
  '        <input',
  '          ref={ref}',
  '          id={inputId}',
  '          className={cn(',
  '            "w-full px-4 py-2.5 text-base border rounded-lg transition",',
  '            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",',
  '            error',
  '              ? "border-red-300 bg-red-50"',
  '              : "border-slate-300 bg-white hover:border-slate-400",',
  '            className',
  '          )}',
  '          {...props}',
  '        />',
  '        {hint && !error && (',
  '          <p className="mt-1 text-xs text-slate-500">{hint}</p>',
  '        )}',
  '        {error && (',
  '          <p className="mt-1 text-xs text-red-600">{error}</p>',
  '        )}',
  '      </div>',
  '    );',
  '  }',
  ');',
  '',
  'Input.displayName = "Input";',
]);

logStep('4. components/ui/Card.tsx');

writeLines('components/ui/Card.tsx', [
  'import { HTMLAttributes } from "react";',
  'import { cn } from "@/lib/utils";',
  '',
  'export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {',
  '  return (',
  '    <div',
  '      className={cn("bg-white rounded-xl border border-slate-200 shadow-sm", className)}',
  '      {...props}',
  '    />',
  '  );',
  '}',
  '',
  'export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {',
  '  return <div className={cn("p-6 pb-4", className)} {...props} />;',
  '}',
  '',
  'export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {',
  '  return <h3 className={cn("text-lg font-bold text-dark", className)} {...props} />;',
  '}',
  '',
  'export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {',
  '  return <div className={cn("p-6 pt-0", className)} {...props} />;',
  '}',
]);

logStep('5. components/ui/Alert.tsx');

writeLines('components/ui/Alert.tsx', [
  'import { HTMLAttributes } from "react";',
  'import { cn } from "@/lib/utils";',
  '',
  'export interface AlertProps extends HTMLAttributes<HTMLDivElement> {',
  '  variant?: "info" | "success" | "error" | "warning";',
  '}',
  '',
  'export function Alert({ className, variant = "info", children, ...props }: AlertProps) {',
  '  const variants = {',
  '    info: "bg-blue-50 border-blue-200 text-blue-800",',
  '    success: "bg-emerald-50 border-emerald-200 text-emerald-800",',
  '    error: "bg-red-50 border-red-200 text-red-800",',
  '    warning: "bg-amber-50 border-amber-200 text-amber-800",',
  '  };',
  '',
  '  return (',
  '    <div',
  '      className={cn("p-4 rounded-lg border text-sm", variants[variant], className)}',
  '      {...props}',
  '    >',
  '      {children}',
  '    </div>',
  '  );',
  '}',
]);

// ============================================================
// 6. AUTH LAYOUT
// ============================================================

logStep('6. components/Layout/AuthLayout.tsx');

writeLines('components/Layout/AuthLayout.tsx', [
  'import Link from "next/link";',
  'import { ReactNode } from "react";',
  '',
  'interface AuthLayoutProps {',
  '  children: ReactNode;',
  '  title: string;',
  '  subtitle?: string;',
  '}',
  '',
  'export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {',
  '  return (',
  '    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex flex-col">',
  '      <header className="p-6">',
  '        <Link href="/" className="inline-block text-xl font-bold text-dark">',
  '          Candidat<span className="text-primary-500">IA</span>',
  '        </Link>',
  '      </header>',
  '',
  '      <main className="flex-1 flex items-center justify-center px-4 py-8">',
  '        <div className="w-full max-w-md">',
  '          <div className="text-center mb-8">',
  '            <h1 className="text-3xl font-bold text-dark mb-2">{title}</h1>',
  '            {subtitle && <p className="text-slate-600">{subtitle}</p>}',
  '          </div>',
  '          {children}',
  '        </div>',
  '      </main>',
  '',
  '      <footer className="p-6 text-center text-sm text-slate-500">',
  '        <p>&copy; 2026 CandidatIA</p>',
  '      </footer>',
  '    </div>',
  '  );',
  '}',
]);

// ============================================================
// 7. PAGE LOGIN
// ============================================================

logStep('7. app/[locale]/login/page.tsx');

writeLines('app/[locale]/login/page.tsx', [
  '"use client";',
  '',
  'import { useState, FormEvent } from "react";',
  'import Link from "next/link";',
  'import { useRouter } from "next/navigation";',
  'import { api, AuthResponse } from "@/lib/api";',
  'import { useAuthStore } from "@/lib/store";',
  'import { AuthLayout } from "@/components/Layout/AuthLayout";',
  'import { Input } from "@/components/ui/Input";',
  'import { Button } from "@/components/ui/Button";',
  'import { Alert } from "@/components/ui/Alert";',
  '',
  'export default function LoginPage() {',
  '  const router = useRouter();',
  '  const setAuth = useAuthStore((s) => s.setAuth);',
  '',
  '  const [email, setEmail] = useState("");',
  '  const [password, setPassword] = useState("");',
  '  const [loading, setLoading] = useState(false);',
  '  const [error, setError] = useState("");',
  '',
  '  async function handleSubmit(e: FormEvent) {',
  '    e.preventDefault();',
  '    setError("");',
  '    setLoading(true);',
  '',
  '    try {',
  '      const { data } = await api.post<AuthResponse>("/api/auth/login", {',
  '        email,',
  '        password,',
  '      });',
  '',
  '      setAuth(data.user, data.access_token);',
  '      router.push("/dashboard");',
  '    } catch (err: any) {',
  '      const message =',
  '        err.response?.data?.detail ||',
  '        "Erreur de connexion. Verifiez vos identifiants.";',
  '      setError(message);',
  '    } finally {',
  '      setLoading(false);',
  '    }',
  '  }',
  '',
  '  return (',
  '    <AuthLayout title="Connexion" subtitle="Accedez a votre tableau de bord">',
  '      <form onSubmit={handleSubmit} className="space-y-4">',
  '        {error && <Alert variant="error">{error}</Alert>}',
  '',
  '        <Input',
  '          label="Email"',
  '          type="email"',
  '          name="email"',
  '          placeholder="votre@email.com"',
  '          value={email}',
  '          onChange={(e) => setEmail(e.target.value)}',
  '          required',
  '          autoComplete="email"',
  '        />',
  '',
  '        <Input',
  '          label="Mot de passe"',
  '          type="password"',
  '          name="password"',
  '          placeholder="••••••••"',
  '          value={password}',
  '          onChange={(e) => setPassword(e.target.value)}',
  '          required',
  '          autoComplete="current-password"',
  '        />',
  '',
  '        <Button type="submit" loading={loading} className="w-full" size="lg">',
  '          Se connecter',
  '        </Button>',
  '',
  '        <p className="text-center text-sm text-slate-600 pt-2">',
  '          Pas encore de compte ?{" "}',
  '          <Link href="/register" className="font-semibold text-primary-600 hover:underline">',
  '            Creer un compte',
  '          </Link>',
  '        </p>',
  '      </form>',
  '    </AuthLayout>',
  '  );',
  '}',
]);

// ============================================================
// 8. PAGE REGISTER
// ============================================================

logStep('8. app/[locale]/register/page.tsx');

writeLines('app/[locale]/register/page.tsx', [
  '"use client";',
  '',
  'import { useState, FormEvent } from "react";',
  'import Link from "next/link";',
  'import { useRouter } from "next/navigation";',
  'import { api, AuthResponse } from "@/lib/api";',
  'import { useAuthStore } from "@/lib/store";',
  'import { AuthLayout } from "@/components/Layout/AuthLayout";',
  'import { Input } from "@/components/ui/Input";',
  'import { Button } from "@/components/ui/Button";',
  'import { Alert } from "@/components/ui/Alert";',
  '',
  'export default function RegisterPage() {',
  '  const router = useRouter();',
  '  const setAuth = useAuthStore((s) => s.setAuth);',
  '',
  '  const [fullName, setFullName] = useState("");',
  '  const [email, setEmail] = useState("");',
  '  const [password, setPassword] = useState("");',
  '  const [loading, setLoading] = useState(false);',
  '  const [error, setError] = useState("");',
  '',
  '  async function handleSubmit(e: FormEvent) {',
  '    e.preventDefault();',
  '    setError("");',
  '',
  '    if (password.length < 8) {',
  '      setError("Le mot de passe doit faire au moins 8 caracteres.");',
  '      return;',
  '    }',
  '',
  '    setLoading(true);',
  '',
  '    try {',
  '      const { data } = await api.post<AuthResponse>("/api/auth/register", {',
  '        email,',
  '        password,',
  '        full_name: fullName || null,',
  '      });',
  '',
  '      setAuth(data.user, data.access_token);',
  '      router.push("/dashboard");',
  '    } catch (err: any) {',
  '      const message =',
  '        err.response?.data?.detail ||',
  '        "Erreur lors de la creation du compte.";',
  '      setError(message);',
  '    } finally {',
  '      setLoading(false);',
  '    }',
  '  }',
  '',
  '  return (',
  '    <AuthLayout',
  '      title="Creer un compte"',
  '      subtitle="Commencez gratuitement avec 1 pack offert"',
  '    >',
  '      <form onSubmit={handleSubmit} className="space-y-4">',
  '        {error && <Alert variant="error">{error}</Alert>}',
  '',
  '        <Input',
  '          label="Nom complet"',
  '          type="text"',
  '          name="fullName"',
  '          placeholder="Jean Dupont"',
  '          value={fullName}',
  '          onChange={(e) => setFullName(e.target.value)}',
  '          autoComplete="name"',
  '        />',
  '',
  '        <Input',
  '          label="Email"',
  '          type="email"',
  '          name="email"',
  '          placeholder="votre@email.com"',
  '          value={email}',
  '          onChange={(e) => setEmail(e.target.value)}',
  '          required',
  '          autoComplete="email"',
  '        />',
  '',
  '        <Input',
  '          label="Mot de passe"',
  '          type="password"',
  '          name="password"',
  '          placeholder="••••••••"',
  '          value={password}',
  '          onChange={(e) => setPassword(e.target.value)}',
  '          required',
  '          autoComplete="new-password"',
  '          hint="Au moins 8 caracteres"',
  '        />',
  '',
  '        <Button type="submit" loading={loading} className="w-full" size="lg">',
  '          Creer mon compte',
  '        </Button>',
  '',
  '        <p className="text-center text-sm text-slate-600 pt-2">',
  '          Deja un compte ?{" "}',
  '          <Link href="/login" className="font-semibold text-primary-600 hover:underline">',
  '            Se connecter',
  '          </Link>',
  '        </p>',
  '      </form>',
  '    </AuthLayout>',
  '  );',
  '}',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 7b terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - frontend/lib/utils.ts');
console.log('    - frontend/components/ui/Button.tsx');
console.log('    - frontend/components/ui/Input.tsx');
console.log('    - frontend/components/ui/Card.tsx');
console.log('    - frontend/components/ui/Alert.tsx');
console.log('    - frontend/components/Layout/AuthLayout.tsx');
console.log('    - frontend/app/[locale]/login/page.tsx');
console.log('    - frontend/app/[locale]/register/page.tsx');
console.log('');
console.log('  VERIFICATION :');
console.log('');
console.log('  1. Si le serveur tourne deja (npm run dev), le rechargement est automatique.');
console.log('     Sinon, lance : cd frontend && npm run dev');
console.log('');
console.log('  2. Ouvrir dans le navigateur :');
console.log('     http://localhost:3000/login');
console.log('     http://localhost:3000/register');
console.log('');
console.log('  3. Tu verras les formulaires fonctionnels connectes au backend !');
console.log('');
console.log('  Prochaine etape : setup-phase7c.js (Dashboard + Generate)');
console.log('');