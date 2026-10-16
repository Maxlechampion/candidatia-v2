"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const LANGUAGES = [
  { code: "fr", label: "Francais" },
  { code: "en", label: "English" },
  { code: "es", label: "Espanol" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Portugais" },
  { code: "ar", label: "Arabic" },
];

// ============================================================
// Encart dedie quand le quota est epuise
// ============================================================
function QuotaExceededBanner({
  title,
  description,
  ctaPrimary,
  ctaSecondary,
}: {
  title: string;
  description: string;
  ctaPrimary: string;
  ctaSecondary: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-700"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-amber-900 mb-1">{title}</h2>
          <p className="text-sm text-amber-800 leading-relaxed mb-5">{description}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/billing">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto">
                {ctaPrimary}
              </Button>
            </Link>
            <Link href="/dashboard/billing">
              <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 w-full sm:w-auto">
                {ctaSecondary}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  const router = useRouter();
  const t = useTranslations("generate");
  const tq = useTranslations("quota");

  const [profilTexte, setProfilTexte] = useState("");
  const [offreTexte, setOffreTexte] = useState("");
  const [profilFile, setProfilFile] = useState<File | null>(null);
  const [offreFile, setOffreFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("fr");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  function handleProfilFile(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) setProfilFile(e.target.files[0]);
  }

  function handleOffreFile(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) setOffreFile(e.target.files[0]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setQuotaExceeded(false);

    if (!profilFile && !profilTexte.trim()) {
      setError(t("error_profile"));
      return;
    }
    if (!offreFile && !offreTexte.trim()) {
      setError(t("error_offer"));
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      if (profilFile) formData.append("fichier_profil", profilFile);
      else formData.append("texte_profil", profilTexte);
      if (offreFile) formData.append("fichier_offre", offreFile);
      else formData.append("texte_offre", offreTexte);

      formData.append("output_language", language);
      formData.append("inclure_relance", "false");
      formData.append("relance_wait_days", "7");

      const response = await api.post("/api/generate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });

      // Telecharger le ZIP
      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Pack_Candidature_IA.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      try {
        const { data: userData } = await api.get("/api/auth/me");
        useAuthStore.getState().setUser(userData);
      } catch {}

      router.push("/dashboard/history");
    } catch (err: any) {
      // 1. Verifier si c'est une erreur de quota (402 / QUOTA_EXCEEDED)
      const status = err?.response?.status;
      let payload: any = null;

      try {
        if (err.response?.data instanceof Blob) {
          const text = await err.response.data.text();
          payload = JSON.parse(text);
        } else if (err.response?.data) {
          payload = err.response.data;
        }
      } catch {}

      if (status === 402 || payload?.error_code === "QUOTA_EXCEEDED") {
        setQuotaExceeded(true);
        setLoading(false);
        return;
      }

      // 2. Sinon erreur generique
      const message =
        payload?.detail ||
        payload?.message ||
        "Erreur lors de la generation.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark mb-2">{t("title")}</h1>
        <p className="text-slate-600">{t("subtitle")}</p>
      </div>

      {quotaExceeded && (
        <QuotaExceededBanner
          title={tq("exceeded_title")}
          description={tq("exceeded_description")}
          ctaPrimary={tq("cta_primary")}
          ctaSecondary={tq("cta_secondary")}
        />
      )}

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("step_profile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("file_label")}
              </label>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleProfilFile}
                className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            <div className="text-center text-sm text-slate-400">{t("or")}</div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("text_label")}
              </label>
              <textarea
                value={profilTexte}
                onChange={(e) => setProfilTexte(e.target.value)}
                placeholder={t("profile_placeholder")}
                rows={6}
                className="w-full px-4 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("step_offer")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("file_label")}
              </label>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleOffreFile}
                className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            <div className="text-center text-sm text-slate-400">{t("or")}</div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("text_label")}
              </label>
              <textarea
                value={offreTexte}
                onChange={(e) => setOffreTexte(e.target.value)}
                placeholder={t("offer_placeholder")}
                rows={6}
                className="w-full px-4 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("step_language")}</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={loading} size="lg">
            {loading ? t("submitting") : t("submit")}
          </Button>
        </div>

        {loading && (
          <Alert variant="info">{t("generating_info")}</Alert>
        )}
      </form>
    </div>
  );
}
