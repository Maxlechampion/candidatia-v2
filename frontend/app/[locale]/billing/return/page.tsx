"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle, Loader2, Clock, ArrowRight, RefreshCw } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type VerifyStatus = "loading" | "success" | "failed" | "pending" | "error";

interface VerifyResponse {
  status: "verified" | "already_processed" | "pending";
  payment_id: string;
  new_status: "success" | "failed" | "pending" | "cancelled" | "refunded";
  real_status?: string;
}

function BillingReturnContent() {
  const t = useTranslations("billing");
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // FedaPay renvoie ?id=XXX, on accepte aussi ?reference=XXX
  const reference = searchParams.get("reference") || searchParams.get("id");

  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setError("Reference de transaction manquante.");
      return;
    }

    let isCancelled = false;

    const verifyPayment = async () => {
      try {
        setStatus("loading");
        const { data } = await api.get<VerifyResponse>("/api/billing/verify", {
          params: { reference },
        });

        if (isCancelled) return;

        setPaymentId(data.payment_id);

        if (data.new_status === "success") {
          setStatus("success");
        } else if (data.new_status === "failed" || data.new_status === "cancelled") {
          setStatus("failed");
        } else {
          setStatus("pending");
        }
      } catch (err: any) {
        if (isCancelled) return;
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "Erreur de verification.";
        setError(msg);
        setStatus("error");
      }
    };

    verifyPayment();

    return () => {
      isCancelled = true;
    };
  }, [reference]);

  const handleRetry = () => {
    setStatus("loading");
    setError(null);
    window.location.reload();
  };

  const handleBackToDashboard = () => {
    router.push(`/${params.locale}/dashboard/billing`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Verification du paiement...</CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Nous confirmons votre transaction aupres de FedaPay.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl text-emerald-700">Paiement confirme !</CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Votre compte a ete credite. Merci pour votre achat.
              </p>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-700">Paiement echoue</CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Votre transaction n'a pas pu etre validee. Aucun debit n'a ete effectue.
              </p>
            </>
          )}

          {status === "pending" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl text-amber-700">Paiement en cours</CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Votre paiement est en cours de traitement.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-700">Erreur de verification</CardTitle>
              <p className="text-sm text-red-600 mt-2">
                {error || "Impossible de verifier votre paiement."}
              </p>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {reference && (
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Reference</p>
              <p className="font-mono text-sm text-slate-700 break-all">{reference}</p>
            </div>
          )}

          {paymentId && (
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide">ID Paiement</p>
              <p className="font-mono text-xs text-slate-700 break-all">{paymentId}</p>
            </div>
          )}

          {status === "success" && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
              <p className="text-sm text-emerald-800 font-medium">
                Vos credits ont ete ajoutes a votre compte !
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4">
            {status === "success" && (
              <Button onClick={handleBackToDashboard} className="w-full bg-primary-600 hover:bg-primary-700">
                Acceder au dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {status === "failed" && (
              <Button onClick={handleBackToDashboard} className="w-full bg-primary-600 hover:bg-primary-700">
                Retour a la facturation
              </Button>
            )}

            {status === "pending" && (
              <Button onClick={handleBackToDashboard} className="w-full bg-primary-600 hover:bg-primary-700">
                Acceder au dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {status === "error" && (
              <>
                <Button onClick={handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reessayer
                </Button>
                <Button variant="outline" onClick={handleBackToDashboard} className="w-full">
                  Retour a la facturation
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <BillingReturnContent />
    </Suspense>
  );
}
