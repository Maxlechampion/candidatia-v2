"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface Plan {
  code: string;
  name: string;
  description?: string;
  price_eur: number;
  price_xof: number;
  price_usd?: number;
  credits: number;
  is_free?: boolean;
  features: string[];
  highlight?: boolean;
}

export function PlanCard({
  plan,
  isCurrentPlan,
  onSelect,
  highlighted,
}: {
  plan: Plan;
  isCurrentPlan: boolean;
  onSelect: (code: string) => void;
  highlighted?: boolean;
}) {
  const t = useTranslations("billing");
  const isFree = plan.is_free === true || plan.code === "free";
  const isHighlighted = highlighted !== undefined ? highlighted : plan.highlight === true;
  const isUnlimited = plan.credits >= 999999;

  const creditsLabel = isUnlimited
    ? t("credits_unlimited")
    : plan.credits + " " + t("packs_count");

  const priceLabel =
    plan.price_eur === 0 ? t("free_label") : plan.price_eur.toFixed(2);

  return (
    <div
      className={cn(
        "relative bg-white rounded-xl border p-6 transition flex flex-col",
        isHighlighted
          ? "border-primary-500 shadow-lg shadow-primary-500/20"
          : "border-slate-200 hover:border-primary-300"
      )}
    >
      {isHighlighted && !isFree && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white bg-primary-600 rounded-full whitespace-nowrap">
          {t("popular")}
        </span>
      )}

      {isFree && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white bg-emerald-600 rounded-full whitespace-nowrap">
          {t("free_badge")}
        </span>
      )}

      <h3 className="text-lg font-bold text-dark mb-2">{plan.name}</h3>

      {plan.description && (
        <p className="text-xs text-slate-500 mb-3">{plan.description}</p>
      )}

      <div className="mb-4">
        <span className="text-3xl font-bold text-dark">{priceLabel}</span>
        {!isFree && <span className="text-slate-500 text-sm ml-1">EUR</span>}
      </div>

      <p className="text-sm text-slate-500 mb-6">{creditsLabel}</p>

      <ul className="space-y-2 mb-6 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-emerald-500 shrink-0 mt-0.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan.code)}
        disabled={isCurrentPlan}
        className={cn(
          "w-full py-2.5 rounded-lg font-semibold text-sm transition",
          isCurrentPlan
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : isHighlighted
            ? "bg-primary-600 text-white hover:bg-primary-700"
            : isFree
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        )}
      >
        {isCurrentPlan ? t("current_plan") : t("choose_plan")}
      </button>
    </div>
  );
}
