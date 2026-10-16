"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

const WAIT_OPTIONS = [3, 5, 7, 10, 14, 21, 30];

export function ScheduleModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("relances");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [waitDays, setWaitDays] = useState(7);
  const [language, setLanguage] = useState("fr");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/relance/schedule", {
        company_name: companyName,
        job_title: jobTitle,
        wait_days: waitDays,
        language,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur de programmation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-dark">{t("modal_title")}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">x</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            label={t("modal_company")}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="TechCorp"
            required
          />

          <Input
            label={t("modal_job")}
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Developpeur Python Senior"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("modal_delay")}
            </label>
            <select
              value={waitDays}
              onChange={(e) => setWaitDays(Number(e.target.value))}
              className="w-full px-4 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {WAIT_OPTIONS.map((d) => (
                <option key={d} value={d}>{d} {t("days")}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("modal_language")}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="fr">Francais</option>
              <option value="en">English</option>
              <option value="es">Espanol</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              {t("cancel")}
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              {t("modal_submit")}
            </Button>
          </div>

          {loading && <Alert variant="info">{t("modal_loading")}</Alert>}
        </form>
      </div>
    </div>
  );
}
