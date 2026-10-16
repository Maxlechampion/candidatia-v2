"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { PlanCard, Plan } from "@/components/billing/PlanCard";

interface Payment {
  id: string;
  provider: string;
  amount: number;
  currency: string;
  plan_purchased: string;
  status: string;
  created_at: string;
}

export default function BillingPage() {
  const t = useTranslations("billing");
  const { user } = useAuthStore();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("fedapay");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [plansRes, providersRes, paymentsRes, meRes] = await Promise.all([
          api.get("/api/billing/plans"),
          api.get("/api/billing/providers"),
          api.get("/api/billing/payments"),
          api.get("/api/auth/me"),
        ]);

        
        useAuthStore.getState().setUser(meRes.data);
        setPlans(plansRes.data.plans || []);
        setProviders(providersRes.data.providers || []);
        setPayments(paymentsRes.data.payments || []);
        setSelectedProvider(providersRes.data.providers[0] || "fedapay");
      } catch (err: any) {
        setError(err.response?.data?.detail || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCheckout(planCode: string) {
    if (planCode === "free") {
      window.location.href = "/dashboard/generate";
      return;
    }

    setError("");

    try {
      const { data } = await api.post("/api/billing/checkout", {
        plan_code: planCode,
        provider: selectedProvider,
      });
      window.location.href = data.checkout_url;
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur de paiement.");
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-dark mb-2">{t("title")}</h1>
        <p className="text-slate-600">{t("subtitle")}</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <h2 className="text-xl font-bold text-dark mb-4">{t("plans_title")}</h2>
        {loading ? (
          <p className="text-slate-500 text-sm">{t("plans_loading")}</p>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.code}
                plan={plan}
                isCurrentPlan={user?.plan === plan.code}
                onSelect={handleCheckout}
              />
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("payment_methods")}</CardTitle>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <Alert variant="info">{t("no_providers")}</Alert>
          ) : (
            <div className="flex flex-wrap gap-3">
              {providers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedProvider(p)}
                  className={
                    "px-4 py-2 rounded-lg border-2 text-sm font-medium transition " +
                    (selectedProvider === p
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-slate-200 hover:border-primary-300 text-slate-600")
                  }
                >
                  {p === "fedapay" && "Mobile Money (FedaPay)"}
                  {p === "flutterwave" && "Carte bancaire"}
                  {p === "raenest" && "Crypto (USDT/USDC)"}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("history_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">
              {t("no_payments")}
            </p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-700">
                      Plan {p.plan_purchased}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(p.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-700">
                      {p.amount} {p.currency}
                    </p>
                    <p className="text-xs text-slate-500">{p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
