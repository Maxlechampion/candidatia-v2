"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

interface Generation {
  id: string;
  output_language: string;
  score_matching: number | null;
  status: string;
  created_at: string;
  zip_path: string | null;
  has_documents: boolean;
}

const LANG_LABELS: Record<string, string> = {
  fr: "Francais",
  en: "English",
  es: "Espanol",
  de: "Deutsch",
  pt: "Portugues",
  ar: "Arabic",
};

export default function HistoryPage() {
  const t = useTranslations("history");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get<Generation[]>("/api/generations");
        setGenerations(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark mb-2">{t("title")}</h1>
        <p className="text-slate-600">{t("subtitle")}</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>
            {generations.length} {generations.length === 1 ? "pack" : "packs"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-500 text-sm">Chargement...</p>
          ) : generations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="mb-2">{t("empty")}</p>
              <p className="text-sm">{t("empty_hint")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {generations.map((gen) => (
                <div
                  key={gen.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-primary-300 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-700">
                        Pack en{" "}
                        {LANG_LABELS[gen.output_language] ||
                          gen.output_language.toUpperCase()}
                      </p>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          gen.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {gen.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(gen.created_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    {gen.score_matching && (
                      <div className="mb-1">
                        <span className="text-sm font-bold text-primary-600">
                          {gen.score_matching}
                        </span>
                        <span className="text-xs text-slate-400">/100</span>
                      </div>
                    )}
                    {gen.has_documents && (
                      <span className="text-xs text-slate-500">
                        CV - Lettre - Guide
                      </span>
                    )}
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
