#!/usr/bin/env node
/**
 * pricing-v2-phase3.js — CandidatIA
 * PRICING-v2 Phase 3 : frontend (PlanCard, billing, landing, i18n)
 *
 * Usage : node scripts/pricing-v2-phase3.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FRONTEND = path.join(ROOT, 'frontend');
const BACKUP_DIR = path.join(ROOT, '.backups', 'pricing-v2-p3-' + Date.now());

const log = {
  info: (m) => console.log('[INFO] ' + m),
  ok: (m) => console.log('[ OK ] ' + m),
  warn: (m) => console.log('[WARN] ' + m),
  err: (m) => console.log('[ERR ] ' + m),
  skip: (m) => console.log('[SKIP] ' + m),
  title: (m) => console.log('\n--- ' + m + ' ---'),
};

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function backupFile(p) {
  if (!fs.existsSync(p)) return;
  ensureDir(BACKUP_DIR);
  const rel = path.relative(ROOT, p);
  const bkp = path.join(BACKUP_DIR, rel);
  ensureDir(path.dirname(bkp));
  fs.copyFileSync(p, bkp);
}
function writeFile(p, content) { backupFile(p); ensureDir(path.dirname(p)); fs.writeFileSync(p, content, 'utf8'); }
function readFile(p) { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; }
function writeLines(p, lines) { writeFile(p, lines.join('\n') + '\n'); }

// ============================================================
// 1. PlanCard.tsx
// ============================================================

function fixPlanCard() {
  log.title('1. frontend/PlanCard.tsx');
  const filePath = path.join(FRONTEND, 'components', 'billing', 'PlanCard.tsx');

  const content = readFile(filePath);
  if (content && content.includes('isUnlimited') && content.includes('is_free')) {
    log.skip('PlanCard.tsx deja a jour');
    return;
  }

  writeLines(filePath, [
    '"use client";',
    '',
    'import { useTranslations } from "next-intl";',
    'import { cn } from "@/lib/utils";',
    '',
    'export interface Plan {',
    '  code: string;',
    '  name: string;',
    '  description?: string;',
    '  price_eur: number;',
    '  price_xof: number;',
    '  price_usd?: number;',
    '  credits: number;',
    '  is_free?: boolean;',
    '  features: string[];',
    '  highlight?: boolean;',
    '}',
    '',
    'export function PlanCard({',
    '  plan,',
    '  isCurrentPlan,',
    '  onSelect,',
    '  highlighted,',
    '}: {',
    '  plan: Plan;',
    '  isCurrentPlan: boolean;',
    '  onSelect: (code: string) => void;',
    '  highlighted?: boolean;',
    '}) {',
    '  const t = useTranslations("billing");',
    '  const isFree = plan.is_free === true || plan.code === "free";',
    '  const isHighlighted =',
    '    highlighted !== undefined ? highlighted : plan.highlight === true;',
    '  const isUnlimited = plan.credits >= 999999;',
    '',
    '  const creditsLabel = isUnlimited',
    '    ? t("credits_unlimited")',
    '    : plan.credits + " " + t("packs_count");',
    '',
    '  const priceLabel =',
    '    plan.price_eur === 0 ? t("free_label") : plan.price_eur.toFixed(2);',
    '',
    '  return (',
    '    <div',
    '      className={cn(',
    '        "relative bg-white rounded-xl border p-6 transition flex flex-col",',
    '        isHighlighted',
    '          ? "border-primary-500 shadow-lg shadow-primary-500/20"',
    '          : "border-slate-200 hover:border-primary-300"',
    '      )}',
    '    >',
    '      {isHighlighted && !isFree && (',
    '        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white bg-primary-600 rounded-full whitespace-nowrap">',
    '          {t("popular")}',
    '        </span>',
    '      )}',
    '',
    '      {isFree && (',
    '        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white bg-emerald-600 rounded-full whitespace-nowrap">',
    '          {t("free_badge")}',
    '        </span>',
    '      )}',
    '',
    '      <h3 className="text-lg font-bold text-dark mb-2">{plan.name}</h3>',
    '',
    '      {plan.description && (',
    '        <p className="text-xs text-slate-500 mb-3">{plan.description}</p>',
    '      )}',
    '',
    '      <div className="mb-4">',
    '        <span className="text-3xl font-bold text-dark">{priceLabel}</span>',
    '        {!isFree && <span className="text-slate-500 text-sm ml-1">EUR</span>}',
    '      </div>',
    '',
    '      <p className="text-sm text-slate-500 mb-6">{creditsLabel}</p>',
    '',
    '      <ul className="space-y-2 mb-6 flex-1">',
    '        {plan.features.map((feature, i) => (',
    '          <li',
    '            key={i}',
    '            className="flex items-start gap-2 text-sm text-slate-600"',
    '          >',
    '            <svg',
    '              width="16"',
    '              height="16"',
    '              viewBox="0 0 24 24"',
    '              fill="none"',
    '              stroke="currentColor"',
    '              strokeWidth="2"',
    '              className="text-emerald-500 shrink-0 mt-0.5"',
    '            >',
    '              <polyline points="20 6 9 17 4 12" />',
    '            </svg>',
    '            <span>{feature}</span>',
    '          </li>',
    '        ))}',
    '      </ul>',
    '',
    '      <button',
    '        onClick={() => onSelect(plan.code)}',
    '        disabled={isCurrentPlan}',
    '        className={cn(',
    '          "w-full py-2.5 rounded-lg font-semibold text-sm transition",',
    '          isCurrentPlan',
    '            ? "bg-slate-100 text-slate-400 cursor-not-allowed"',
    '            : isHighlighted',
    '            ? "bg-primary-600 text-white hover:bg-primary-700"',
    '            : isFree',
    '            ? "bg-emerald-600 text-white hover:bg-emerald-700"',
    '            : "bg-slate-100 text-slate-700 hover:bg-slate-200"',
    '        )}',
    '      >',
    '        {isCurrentPlan ? t("current_plan") : t("choose_plan")}',
    '      </button>',
    '    </div>',
    '  );',
    '}',
  ]);
  log.ok('PlanCard.tsx : 5 plans supportes');
}

// ============================================================
// 2. billing/page.tsx
// ============================================================

function fixBillingPage() {
  log.title('2. frontend/billing/page.tsx');
  const filePath = path.join(
    FRONTEND,
    'app',
    '[locale]',
    'dashboard',
    'billing',
    'page.tsx'
  );

  const content = readFile(filePath);
  if (!content) { log.err('billing/page.tsx introuvable'); return; }
  if (content.includes('is_free') && !content.includes('FEDAPAY_PRICES')) {
    log.skip('billing/page.tsx deja dynamique');
    return;
  }

  writeLines(filePath, [
    '"use client";',
    '',
    'import { useEffect, useState } from "react";',
    'import { useTranslations } from "next-intl";',
    'import { api } from "@/lib/api";',
    'import { useAuthStore } from "@/lib/store";',
    'import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";',
    'import { Alert } from "@/components/ui/Alert";',
    'import { PlanCard, Plan } from "@/components/billing/PlanCard";',
    '',
    'interface Payment {',
    '  id: string;',
    '  provider: string;',
    '  amount: number;',
    '  currency: string;',
    '  plan_purchased: string;',
    '  status: string;',
    '  created_at: string;',
    '}',
    '',
    'export default function BillingPage() {',
    '  const t = useTranslations("billing");',
    '  const { user } = useAuthStore();',
    '',
    '  const [plans, setPlans] = useState<Plan[]>([]);',
    '  const [providers, setProviders] = useState<string[]>([]);',
    '  const [payments, setPayments] = useState<Payment[]>([]);',
    '  const [selectedProvider, setSelectedProvider] = useState("fedapay");',
    '  const [loading, setLoading] = useState(true);',
    '  const [error, setError] = useState("");',
    '',
    '  useEffect(() => {',
    '    async function load() {',
    '      try {',
    '        const [plansRes, providersRes, paymentsRes, meRes] = await Promise.all([',
    '          api.get("/api/billing/plans"),',
    '          api.get("/api/billing/providers"),',
    '          api.get("/api/billing/payments"),',
    '          api.get("/api/auth/me"),',
    '        ]);',
    '',
    '        useAuthStore.getState().setUser(meRes.data);',
    '        setPlans(plansRes.data.plans);',
    '        setProviders(providersRes.data.providers);',
    '        setPayments(paymentsRes.data);',
    '        setSelectedProvider(providersRes.data.providers[0] || "fedapay");',
    '      } catch (err: any) {',
    '        setError(err.response?.data?.detail || "Erreur de chargement.");',
    '      } finally {',
    '        setLoading(false);',
    '      }',
    '    }',
    '    load();',
    '  }, []);',
    '',
    '  async function handleCheckout(planCode: string) {',
    '    if (planCode === "free") {',
    '      window.location.href = "/dashboard/generate";',
    '      return;',
    '    }',
    '',
    '    setError("");',
    '',
    '    try {',
    '      const { data } = await api.post("/api/billing/checkout", {',
    '        plan_code: planCode,',
    '        provider: selectedProvider,',
    '      });',
    '      window.location.href = data.checkout_url;',
    '    } catch (err: any) {',
    '      setError(err.response?.data?.detail || "Erreur de paiement.");',
    '    }',
    '  }',
    '',
    '  return (',
    '    <div className="max-w-7xl mx-auto space-y-8">',
    '      <div>',
    '        <h1 className="text-3xl font-bold text-dark mb-2">{t("title")}</h1>',
    '        <p className="text-slate-600">{t("subtitle")}</p>',
    '      </div>',
    '',
    '      {error && <Alert variant="error">{error}</Alert>}',
    '',
    '      <div>',
    '        <h2 className="text-xl font-bold text-dark mb-4">{t("plans_title")}</h2>',
    '        {loading ? (',
    '          <p className="text-slate-500 text-sm">{t("plans_loading")}</p>',
    '        ) : (',
    '          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">',
    '            {plans.map((plan) => (',
    '              <PlanCard',
    '                key={plan.code}',
    '                plan={plan}',
    '                isCurrentPlan={user?.plan === plan.code}',
    '                onSelect={handleCheckout}',
    '              />',
    '            ))}',
    '          </div>',
    '        )}',
    '      </div>',
    '',
    '      <Card>',
    '        <CardHeader>',
    '          <CardTitle>{t("payment_methods")}</CardTitle>',
    '        </CardHeader>',
    '        <CardContent>',
    '          {providers.length === 0 ? (',
    '            <Alert variant="info">{t("no_providers")}</Alert>',
    '          ) : (',
    '            <div className="flex flex-wrap gap-3">',
    '              {providers.map((p) => (',
    '                <button',
    '                  key={p}',
    '                  type="button"',
    '                  onClick={() => setSelectedProvider(p)}',
    '                  className={',
    '                    "px-4 py-2 rounded-lg border-2 text-sm font-medium transition " +',
    '                    (selectedProvider === p',
    '                      ? "border-primary-500 bg-primary-50 text-primary-700"',
    '                      : "border-slate-200 hover:border-primary-300 text-slate-600")',
    '                  }',
    '                >',
    '                  {p === "fedapay" && "Mobile Money (FedaPay)"}',
    '                  {p === "flutterwave" && "Carte bancaire"}',
    '                  {p === "raenest" && "Crypto (USDT/USDC)"}',
    '                </button>',
    '              ))}',
    '            </div>',
    '          )}',
    '        </CardContent>',
    '      </Card>',
    '',
    '      <Card>',
    '        <CardHeader>',
    '          <CardTitle>{t("history_title")}</CardTitle>',
    '        </CardHeader>',
    '        <CardContent>',
    '          {payments.length === 0 ? (',
    '            <p className="text-slate-500 text-sm text-center py-4">',
    '              {t("no_payments")}',
    '            </p>',
    '          ) : (',
    '            <div className="space-y-2">',
    '              {payments.map((p) => (',
    '                <div',
    '                  key={p.id}',
    '                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm"',
    '                >',
    '                  <div>',
    '                    <p className="font-medium text-slate-700">',
    '                      Plan {p.plan_purchased}',
    '                    </p>',
    '                    <p className="text-xs text-slate-500">',
    '                      {new Date(p.created_at).toLocaleString()}',
    '                    </p>',
    '                  </div>',
    '                  <div className="text-right">',
    '                    <p className="font-bold text-slate-700">',
    '                      {p.amount} {p.currency}',
    '                    </p>',
    '                    <p className="text-xs text-slate-500">{p.status}</p>',
    '                  </div>',
    '                </div>',
    '              ))}',
    '            </div>',
    '          )}',
    '        </CardContent>',
    '      </Card>',
    '    </div>',
    '  );',
    '}',
  ]);
  log.ok('billing/page.tsx : 5 plans dynamiques');
}

// ============================================================
// 3. Landing page.tsx
// ============================================================

function fixLandingPage() {
  log.title('3. frontend/landing page.tsx');
  const filePath = path.join(FRONTEND, 'app', '[locale]', 'page.tsx');

  const content = readFile(filePath);
  if (content && content.includes('plan_express_name') && content.includes('plan_pro_unlimited_name')) {
    log.skip('landing deja a jour');
    return;
  }

  writeLines(filePath, [
    'import { useTranslations } from "next-intl";',
    'import Link from "next/link";',
    'import { LandingFooter } from "@/components/Layout/LandingFooter";',
    '',
    'export default function HomePage() {',
    '  const t = useTranslations("landing");',
    '',
    '  const features = [',
    '    { title: t("feature_cv_title"), desc: t("feature_cv_desc"), icon: "[CV]" },',
    '    { title: t("feature_lettre_title"), desc: t("feature_lettre_desc"), icon: "[Lettre]" },',
    '    { title: t("feature_guide_title"), desc: t("feature_guide_desc"), icon: "[Guide]" },',
    '  ];',
    '',
    '  const steps = [',
    '    { step: "1", title: t("how_step1_title"), desc: t("how_step1_desc") },',
    '    { step: "2", title: t("how_step2_title"), desc: t("how_step2_desc") },',
    '    { step: "3", title: t("how_step3_title"), desc: t("how_step3_desc") },',
    '  ];',
    '',
    '  const plans = [',
    '    {',
    '      code: "free",',
    '      name: t("plan_free_name"),',
    '      price: "0",',
    '      features: [t("plan_free_f1"), t("plan_free_f2"), t("plan_free_f3")],',
    '      cta: t("plan_free_cta"),',
    '      highlighted: false,',
    '      isFree: true,',
    '    },',
    '    {',
    '      code: "express",',
    '      name: t("plan_express_name"),',
    '      price: "3",',
    '      features: [t("plan_express_f1"), t("plan_express_f2"), t("plan_express_f3")],',
    '      cta: t("plan_express_cta"),',
    '      highlighted: false,',
    '      isFree: false,',
    '    },',
    '    {',
    '      code: "active",',
    '      name: t("plan_active_name"),',
    '      price: "7.50",',
    '      features: [',
    '        t("plan_active_f1"),',
    '        t("plan_active_f2"),',
    '        t("plan_active_f3"),',
    '        t("plan_active_f4"),',
    '      ],',
    '      cta: t("plan_active_cta"),',
    '      highlighted: true,',
    '      isFree: false,',
    '    },',
    '    {',
    '      code: "intensive",',
    '      name: t("plan_intensive_name"),',
    '      price: "18",',
    '      features: [',
    '        t("plan_intensive_f1"),',
    '        t("plan_intensive_f2"),',
    '        t("plan_intensive_f3"),',
    '      ],',
    '      cta: t("plan_intensive_cta"),',
    '      highlighted: false,',
    '      isFree: false,',
    '    },',
    '    {',
    '      code: "pro_unlimited",',
    '      name: t("plan_pro_unlimited_name"),',
    '      price: "22",',
    '      features: [',
    '        t("plan_pro_unlimited_f1"),',
    '        t("plan_pro_unlimited_f2"),',
    '        t("plan_pro_unlimited_f3"),',
    '      ],',
    '      cta: t("plan_pro_unlimited_cta"),',
    '      highlighted: false,',
    '      isFree: false,',
    '    },',
    '  ];',
    '',
    '  return (',
    '    <main className="min-h-screen bg-white">',
    '      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">',
    '        <div className="container-main flex items-center justify-between py-4">',
    '          <div className="text-xl font-bold text-dark">',
    '            Candidat<span className="text-primary-500">IA</span>',
    '          </div>',
    '          <nav className="flex items-center gap-3">',
    '            <Link',
    '              href="/login"',
    '              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 transition"',
    '            >',
    '              {t("nav_login")}',
    '            </Link>',
    '            <Link',
    '              href="/register"',
    '              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition"',
    '            >',
    '              {t("nav_register")}',
    '            </Link>',
    '          </nav>',
    '        </div>',
    '      </header>',
    '',
    '      <section className="container-main py-20 md:py-28 text-center">',
    '        <span className="inline-block px-3 py-1 text-xs font-bold text-primary-700 bg-primary-50 rounded-full mb-6">',
    '          {t("badge_new")}',
    '        </span>',
    '        <h1 className="text-4xl md:text-6xl font-bold text-dark mb-6 leading-tight">',
    '          {t("hero_title")}',
    '        </h1>',
    '        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">',
    '          {t("hero_subtitle")}',
    '        </p>',
    '        <div className="flex flex-col sm:flex-row gap-4 justify-center">',
    '          <Link',
    '            href="/register"',
    '            className="px-6 py-3 text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition shadow-lg shadow-primary-500/30"',
    '          >',
    '            {t("cta_primary")}',
    '          </Link>',
    '          <Link',
    '            href="#how"',
    '            className="px-6 py-3 text-base font-semibold text-primary-600 bg-white border-2 border-primary-100 rounded-lg hover:border-primary-300 transition"',
    '          >',
    '            {t("cta_secondary")}',
    '          </Link>',
    '        </div>',
    '      </section>',
    '',
    '      <section id="features" className="container-main py-16 md:py-24">',
    '        <h2 className="text-3xl md:text-4xl font-bold text-dark text-center mb-4">',
    '          {t("features_title")}',
    '        </h2>',
    '        <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">',
    '          {t("features_subtitle")}',
    '        </p>',
    '',
    '        <div className="grid md:grid-cols-3 gap-6">',
    '          {features.map((feature, i) => (',
    '            <div',
    '              key={i}',
    '              className="p-6 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-lg transition"',
    '            >',
    '              <div className="text-lg font-bold text-primary-600 mb-4">',
    '                {feature.icon}',
    '              </div>',
    '              <h3 className="text-lg font-bold text-dark mb-3">',
    '                {feature.title}',
    '              </h3>',
    '              <p className="text-slate-600 text-sm leading-relaxed">',
    '                {feature.desc}',
    '              </p>',
    '            </div>',
    '          ))}',
    '        </div>',
    '      </section>',
    '',
    '      <section id="how" className="bg-slate-50 py-16 md:py-24">',
    '        <div className="container-main">',
    '          <h2 className="text-3xl md:text-4xl font-bold text-dark text-center mb-12">',
    '            {t("how_title")}',
    '          </h2>',
    '',
    '          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">',
    '            {steps.map((item, i) => (',
    '              <div key={i} className="text-center">',
    '                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">',
    '                  {item.step}',
    '                </div>',
    '                <h3 className="text-lg font-bold text-dark mb-2">{item.title}</h3>',
    '                <p className="text-slate-600 text-sm">{item.desc}</p>',
    '              </div>',
    '            ))}',
    '          </div>',
    '        </div>',
    '      </section>',
    '',
    '      <section id="pricing" className="container-main py-16 md:py-24">',
    '        <h2 className="text-3xl md:text-4xl font-bold text-dark text-center mb-4">',
    '          {t("pricing_title")}',
    '        </h2>',
    '        <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">',
    '          {t("pricing_subtitle")}',
    '        </p>',
    '',
    '        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">',
    '          {plans.map((plan) => (',
    '            <div',
    '              key={plan.code}',
    '              className={',
    '                "relative p-5 rounded-xl border-2 flex flex-col " +',
    '                (plan.highlighted',
    '                  ? "border-primary-500 shadow-lg"',
    '                  : plan.isFree',
    '                  ? "border-emerald-300"',
    '                  : "border-slate-200")',
    '              }',
    '            >',
    '              {plan.highlighted && (',
    '                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white bg-primary-600 rounded-full whitespace-nowrap">',
    '                  {t("plan_popular")}',
    '                </span>',
    '              )}',
    '              {plan.isFree && (',
    '                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white bg-emerald-600 rounded-full whitespace-nowrap">',
    '                  {t("plan_free_badge")}',
    '                </span>',
    '              )}',
    '              <h3 className="text-base font-bold text-dark mb-2">',
    '                {plan.name}',
    '              </h3>',
    '              <div className="mb-4">',
    '                <span className="text-3xl font-bold text-dark">{plan.price}</span>',
    '                <span className="text-slate-500 ml-1 text-sm">EUR</span>',
    '              </div>',
    '              <ul className="space-y-2 mb-6 flex-1">',
    '                {plan.features.map((f, j) => (',
    '                  <li',
    '                    key={j}',
    '                    className="flex items-start gap-2 text-xs text-slate-600"',
    '                  >',
    '                    <span className="text-emerald-500">-</span>',
    '                    <span>{f}</span>',
    '                  </li>',
    '                ))}',
    '              </ul>',
    '              <Link',
    '                href="/register"',
    '                className={',
    '                  "block text-center py-2.5 rounded-lg font-semibold text-sm transition " +',
    '                  (plan.highlighted',
    '                    ? "bg-primary-600 text-white hover:bg-primary-700"',
    '                    : plan.isFree',
    '                    ? "bg-emerald-600 text-white hover:bg-emerald-700"',
    '                    : "bg-slate-100 text-slate-700 hover:bg-slate-200")',
    '                }',
    '              >',
    '                {plan.cta}',
    '              </Link>',
    '            </div>',
    '          ))}',
    '        </div>',
    '      </section>',
    '',
    '      <section className="bg-gradient-to-br from-dark to-primary-900 py-16 md:py-24">',
    '        <div className="container-main text-center">',
    '          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">',
    '            {t("cta_final_title")}',
    '          </h2>',
    '          <p className="text-primary-100 max-w-2xl mx-auto mb-8">',
    '            {t("cta_final_subtitle")}',
    '          </p>',
    '          <Link',
    '            href="/register"',
    '            className="inline-block px-8 py-3 text-base font-semibold text-primary-700 bg-white rounded-lg hover:bg-primary-50 transition"',
    '          >',
    '            {t("cta_final_button")}',
    '          </Link>',
    '        </div>',
    '      </section>',
    '',
    '      <LandingFooter />',
    '    </main>',
    '  );',
    '}',
  ]);
  log.ok('landing page.tsx : 5 plans B2C');
}

// ============================================================
// 4. messages/fr.json
// ============================================================

function fixMessagesFr() {
  log.title('4. frontend/messages/fr.json');
  const filePath = path.join(FRONTEND, 'messages', 'fr.json');
  const content = readFile(filePath);

  if (!content) { log.err('fr.json introuvable'); return; }

  let json;
  try { json = JSON.parse(content); }
  catch (e) { log.err('fr.json invalide : ' + e.message); return; }

  if (!json.billing) json.billing = {};
  json.billing.free_label = "Gratuit";
  json.billing.free_badge = "GRATUIT";
  json.billing.packs_count = "pack(s)";
  json.billing.credits_unlimited = "Illimite";

  if (!json.landing) json.landing = {};
  const L = json.landing;

  L.plan_free_name = "Decouverte";
  L.plan_free_cta = "Commencer gratuitement";
  L.plan_free_f1 = "1 pack unique";
  L.plan_free_f2 = "CV + Lettre + Guide";
  L.plan_free_f3 = "Filigrane CandidatIA";
  L.plan_free_badge = "GRATUIT";

  L.plan_express_name = "Express";
  L.plan_express_cta = "Choisir Express";
  L.plan_express_f1 = "1 pack sans filigrane";
  L.plan_express_f2 = "CV methode STAR";
  L.plan_express_f3 = "Lettre personnalisee";

  L.plan_active_name = "Candidature Active";
  L.plan_active_cta = "Choisir Candidature Active";
  L.plan_active_f1 = "5 packs";
  L.plan_active_f2 = "Guide d entretien enrichi";
  L.plan_active_f3 = "Relances automatiques";
  L.plan_active_f4 = "Sans filigrane";

  L.plan_intensive_name = "Recherche Intensive";
  L.plan_intensive_cta = "Choisir Recherche Intensive";
  L.plan_intensive_f1 = "15 packs";
  L.plan_intensive_f2 = "Coaching IA";
  L.plan_intensive_f3 = "Support prioritaire";

  L.plan_pro_unlimited_name = "Pro Illimite";
  L.plan_pro_unlimited_cta = "Passer au Pro Illimite";
  L.plan_pro_unlimited_f1 = "Packs illimites";
  L.plan_pro_unlimited_f2 = "Coaching premium";
  L.plan_pro_unlimited_f3 = "Support VIP";

  writeFile(filePath, JSON.stringify(json, null, 2) + '\n');
  log.ok('fr.json : cles plans B2C');
}

// ============================================================
// 5. messages/en.json
// ============================================================

function fixMessagesEn() {
  log.title('5. frontend/messages/en.json');
  const filePath = path.join(FRONTEND, 'messages', 'en.json');
  const content = readFile(filePath);

  if (!content) { log.err('en.json introuvable'); return; }

  let json;
  try { json = JSON.parse(content); }
  catch (e) { log.err('en.json invalide : ' + e.message); return; }

  if (!json.billing) json.billing = {};
  json.billing.free_label = "Free";
  json.billing.free_badge = "FREE";
  json.billing.packs_count = "pack(s)";
  json.billing.credits_unlimited = "Unlimited";

  if (!json.landing) json.landing = {};
  const L = json.landing;

  L.plan_free_name = "Discovery";
  L.plan_free_cta = "Start for free";
  L.plan_free_f1 = "1 free pack";
  L.plan_free_f2 = "CV + Cover Letter + Guide";
  L.plan_free_f3 = "CandidatIA watermark";
  L.plan_free_badge = "FREE";

  L.plan_express_name = "Express";
  L.plan_express_cta = "Choose Express";
  L.plan_express_f1 = "1 pack without watermark";
  L.plan_express_f2 = "STAR method CV";
  L.plan_express_f3 = "Personalized cover letter";

  L.plan_active_name = "Active Application";
  L.plan_active_cta = "Choose Active";
  L.plan_active_f1 = "5 packs";
  L.plan_active_f2 = "Enhanced interview guide";
  L.plan_active_f3 = "Automatic follow-ups";
  L.plan_active_f4 = "No watermark";

  L.plan_intensive_name = "Intensive Search";
  L.plan_intensive_cta = "Choose Intensive";
  L.plan_intensive_f1 = "15 packs";
  L.plan_intensive_f2 = "AI coaching";
  L.plan_intensive_f3 = "Priority support";

  L.plan_pro_unlimited_name = "Pro Unlimited";
  L.plan_pro_unlimited_cta = "Go Pro Unlimited";
  L.plan_pro_unlimited_f1 = "Unlimited packs";
  L.plan_pro_unlimited_f2 = "Premium coaching";
  L.plan_pro_unlimited_f3 = "VIP support";

  writeFile(filePath, JSON.stringify(json, null, 2) + '\n');
  log.ok('en.json : cles plans B2C');
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('\n=====================================================');
  console.log('  PRICING-v2 PHASE 3 : Frontend');
  console.log('=====================================================\n');
  console.log('Backups : ' + BACKUP_DIR + '\n');

  const tasks = [
    ['PlanCard.tsx', fixPlanCard],
    ['billing/page.tsx', fixBillingPage],
    ['landing page.tsx', fixLandingPage],
    ['messages/fr.json', fixMessagesFr],
    ['messages/en.json', fixMessagesEn],
  ];

  const results = [];
  for (const t of tasks) {
    try {
      t[1]();
      results.push({ name: t[0], ok: true });
    } catch (e) {
      log.err(t[0] + ' : ' + e.message);
      results.push({ name: t[0], ok: false, error: e.message });
    }
  }

  console.log('\n--- RESUME ---');
  for (const r of results) {
    console.log('  ' + (r.ok ? '[OK]' : '[!!]') + ' ' + r.name + (r.error ? ' -- ' + r.error : ''));
  }

  console.log('\n--- ETAPES SUIVANTES ---');
  console.log('  1. Type-check :');
  console.log('       cd frontend');
  console.log('       npm run type-check');
  console.log('');
  console.log('  2. Build :');
  console.log('       npm run build');
  console.log('');
  console.log('  3. Dev :');
  console.log('       npm run dev');
  console.log('');
  console.log('  4. Tester dans le navigateur :');
  console.log('       http://localhost:3000/fr           (landing 5 plans)');
  console.log('       http://localhost:3000/fr/dashboard/billing');
  console.log('       http://localhost:3000/en/dashboard/billing');
  console.log('');
}

main();