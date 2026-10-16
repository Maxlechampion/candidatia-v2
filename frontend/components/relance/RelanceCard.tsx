"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface Relance {
  id: string;
  company_name: string;
  job_title: string;
  wait_days: number;
  scheduled_date: string;
  email_draft: string;
  status: string;
}

export function RelanceCard({
  relance,
  onCancel,
  onMarkSent,
}: {
  relance: Relance;
  onCancel: (id: string) => void;
  onMarkSent: (id: string) => void;
}) {
  const t = useTranslations("relances");
  const [showDraft, setShowDraft] = useState(false);

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: t("status_pending"), color: "bg-blue-100 text-blue-700" },
    reminded: { label: t("status_reminded"), color: "bg-amber-100 text-amber-700" },
    sent: { label: t("status_sent"), color: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: t("status_cancelled"), color: "bg-slate-100 text-slate-500" },
  };

  const statusInfo = statusLabels[relance.status] || statusLabels.pending;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-dark truncate">{relance.job_title}</h3>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-1">{relance.company_name}</p>
            <p className="text-xs text-slate-500">
              {t("scheduled_for")} {new Date(relance.scheduled_date).toLocaleDateString()} 
              ({relance.wait_days} {t("days")})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setShowDraft((v) => !v)}>
            {showDraft ? t("hide_draft") : t("view_draft")}
          </Button>

          {relance.status === "pending" && (
            <Button variant="ghost" size="sm" onClick={() => onCancel(relance.id)}>
              {t("cancel")}
            </Button>
          )}

          {(relance.status === "pending" || relance.status === "reminded") && (
            <Button size="sm" onClick={() => onMarkSent(relance.id)}>
              {t("mark_sent")}
            </Button>
          )}
        </div>

        {showDraft && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-bold text-slate-700 mb-2">{t("draft_label")}</p>
            <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
              {relance.email_draft}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
