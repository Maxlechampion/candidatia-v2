import { useTranslations } from "next-intl";
import Link from "next/link";
import { LandingFooter } from "@/components/Layout/LandingFooter";

export default function HomePage() {
  const t = useTranslations("landing");

  const features = [
    { title: t("feature_cv_title"), desc: t("feature_cv_desc"), icon: "[CV]" },
    { title: t("feature_lettre_title"), desc: t("feature_lettre_desc"), icon: "[Lettre]" },
    { title: t("feature_guide_title"), desc: t("feature_guide_desc"), icon: "[Guide]" },
  ];

  const steps = [
    { step: "1", title: t("how_step1_title"), desc: t("how_step1_desc") },
    { step: "2", title: t("how_step2_title"), desc: t("how_step2_desc") },
    { step: "3", title: t("how_step3_title"), desc: t("how_step3_desc") },
  ];

  const plans = [
    {
      code: "free",
      name: t("plan_free_name"),
      price: "0",
      features: [t("plan_free_f1"), t("plan_free_f2"), t("plan_free_f3")],
      cta: t("plan_free_cta"),
      highlighted: false,
      isFree: true,
    },
    {
      code: "express",
      name: t("plan_express_name"),
      price: "3",
      features: [t("plan_express_f1"), t("plan_express_f2"), t("plan_express_f3")],
      cta: t("plan_express_cta"),
      highlighted: false,
      isFree: false,
    },
    {
      code: "active",
      name: t("plan_active_name"),
      price: "7.50",
      features: [
        t("plan_active_f1"),
        t("plan_active_f2"),
        t("plan_active_f3"),
        t("plan_active_f4"),
      ],
      cta: t("plan_active_cta"),
      highlighted: true,
      isFree: false,
    },
    {
      code: "intensive",
      name: t("plan_intensive_name"),
      price: "18",
      features: [
        t("plan_intensive_f1"),
        t("plan_intensive_f2"),
        t("plan_intensive_f3"),
      ],
      cta: t("plan_intensive_cta"),
      highlighted: false,
      isFree: false,
    },
    {
      code: "pro_unlimited",
      name: t("plan_pro_unlimited_name"),
      price: "22",
      features: [
        t("plan_pro_unlimited_f1"),
        t("plan_pro_unlimited_f2"),
        t("plan_pro_unlimited_f3"),
      ],
      cta: t("plan_pro_unlimited_cta"),
      highlighted: false,
      isFree: false,
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container-main flex items-center justify-between py-4">
          <div className="text-xl font-bold text-dark">
            Candidat<span className="text-primary-500">IA</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 transition"
            >
              {t("nav_login")}
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition"
            >
              {t("nav_register")}
            </Link>
          </nav>
        </div>
      </header>

      <section className="container-main py-20 md:py-28 text-center">
        <span className="inline-block px-3 py-1 text-xs font-bold text-primary-700 bg-primary-50 rounded-full mb-6">
          {t("badge_new")}
        </span>
        <h1 className="text-4xl md:text-6xl font-bold text-dark mb-6 leading-tight">
          {t("hero_title")}
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
          {t("hero_subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-6 py-3 text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition shadow-lg shadow-primary-500/30"
          >
            {t("cta_primary")}
          </Link>
          <Link
            href="#how"
            className="px-6 py-3 text-base font-semibold text-primary-600 bg-white border-2 border-primary-100 rounded-lg hover:border-primary-300 transition"
          >
            {t("cta_secondary")}
          </Link>
        </div>
      </section>

      <section id="features" className="container-main py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-dark text-center mb-4">
          {t("features_title")}
        </h2>
        <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">
          {t("features_subtitle")}
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="p-6 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-lg transition"
            >
              <div className="text-lg font-bold text-primary-600 mb-4">{feature.icon}</div>
              <h3 className="text-lg font-bold text-dark mb-3">{feature.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="bg-slate-50 py-16 md:py-24">
        <div className="container-main">
          <h2 className="text-3xl md:text-4xl font-bold text-dark text-center mb-12">
            {t("how_title")}
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-dark mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="container-main py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-dark text-center mb-4">
          {t("pricing_title")}
        </h2>
        <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">
          {t("pricing_subtitle")}
        </p>

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.code}
              className={
                "relative p-5 rounded-xl border-2 flex flex-col " +
                (plan.highlighted
                  ? "border-primary-500 shadow-lg"
                  : plan.isFree
                  ? "border-emerald-300"
                  : "border-slate-200")
              }
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white bg-primary-600 rounded-full whitespace-nowrap">
                  {t("plan_popular")}
                </span>
              )}
              {plan.isFree && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white bg-emerald-600 rounded-full whitespace-nowrap">
                  {t("plan_free_badge")}
                </span>
              )}
              <h3 className="text-base font-bold text-dark mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-dark">{plan.price}</span>
                <span className="text-slate-500 ml-1 text-sm">EUR</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="text-emerald-500">-</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={
                  "block text-center py-2.5 rounded-lg font-semibold text-sm transition " +
                  (plan.highlighted
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : plan.isFree
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200")
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-dark to-primary-900 py-16 md:py-24">
        <div className="container-main text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("cta_final_title")}
          </h2>
          <p className="text-primary-100 max-w-2xl mx-auto mb-8">
            {t("cta_final_subtitle")}
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 text-base font-semibold text-primary-700 bg-white rounded-lg hover:bg-primary-50 transition"
          >
            {t("cta_final_button")}
          </Link>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
