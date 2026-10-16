"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RelanceCard, Relance } from "@/components/relance/RelanceCard";
import { ScheduleModal } from "@/components/relance/ScheduleModal";

export default function RelancesPage() {
  const t = useTranslations("relances");
  const [relances, setRelances] = useState<Relance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  async function load() {
    try {
      const { data } = await api.get<Relance[]>("/api/relance");
      setRelances(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(id: string) {
    if (!confirm(t("confirm_cancel"))) return;
    try {
      await api.post(`/api/relance/${id}/cancel`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur");
    }
  }

  async function handleMarkSent(id: string) {
    if (!confirm(t("confirm_sent"))) return;
    try {
      await api.post(`/api/relance/${id}/mark-sent`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark mb-2">{t("title")}</h1>
          <p className="text-slate-600">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowModal(true)}>{t("new")}</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <p className="text-slate-500 text-sm">Chargement...</p>
      ) : relances.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 mb-2">{t("empty")}</p>
          <p className="text-sm text-slate-400">{t("empty_hint")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {relances.map((r) => (
            <RelanceCard
              key={r.id}
              relance={r}
              onCancel={handleCancel}
              onMarkSent={handleMarkSent}
            />
          ))}
        </div>
      )}

      <ScheduleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={load}
      />
    </div>
  );
}
