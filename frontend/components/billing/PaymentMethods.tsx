"use client";

import { cn } from "@/lib/utils";

export interface PaymentMethod {
  id: string;
  provider: string;
  label: string;
  description: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "mobile_money",
    provider: "fedapay",
    label: "Mobile Money",
    description: "MTN MoMo, Moov, Celtiis (Benin)",
  },
  {
    id: "card",
    provider: "fedapay",
    label: "Carte bancaire",
    description: "Visa, Mastercard",
  },
  {
    id: "crypto",
    provider: "raenest",
    label: "Crypto (USDT/USDC)",
    description: "Paiement en stablecoins",
  },
];

export function PaymentMethods({
  availableProviders,
  selectedMethodId,
  onSelect,
}: {
  availableProviders: string[];
  selectedMethodId: string;
  onSelect: (method: PaymentMethod) => void;
}) {
  return (
    <div className="space-y-3">
      {PAYMENT_METHODS.map((method) => {
        const isAvailable = availableProviders.includes(method.provider);
        const isSelected = selectedMethodId === method.id;

        return (
          <button
            key={method.id}
            type="button"
            disabled={!isAvailable}
            onClick={() => onSelect(method)}
            className={cn(
              "w-full p-4 rounded-lg border-2 text-left transition flex items-center gap-3",
              !isAvailable
                ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                : isSelected
                ? "border-primary-500 bg-primary-50"
                : "border-slate-200 hover:border-primary-300 bg-white"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                isSelected ? "border-primary-500" : "border-slate-300"
              )}
            >
              {isSelected && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-700">{method.label}</p>
              <p className="text-xs text-slate-500">{method.description}</p>
            </div>
            {!isAvailable && (
              <span className="text-xs text-slate-400">Indisponible</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
