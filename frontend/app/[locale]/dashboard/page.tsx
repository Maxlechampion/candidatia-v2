"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Stats {
  total_generations: number;
  average_score: number;
  credits_remaining: number;
  plan: string;
}

export default function DashboardHome() {
  const { user } = useAuthStore();
  const t = useTranslations("dashboard");

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get<Stats>("/api/generations/stats");
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark mb-2">
          {t("welcome")} {user?.full_name || "!"}
        </h1>
        <p className="text-slate-600">{t("ready")}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              {t("stat_packs")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-dark">
              {loading ? "..." : stats?.total_generations ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              {t("stat_score")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-dark">
              {loading ? "..." : stats?.average_score ?? 0}
              <span className="text-base text-slate-400 font-normal">/100</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              {t("stat_credits")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-dark">
              {loading ? "..." : stats?.credits_remaining ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Plan {stats?.plan ?? "free"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("quick_actions")}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Link href="/dashboard/generate">
            <Button>{t("action_generate")}</Button>
          </Link>
          <Link href="/dashboard/history">
            <Button variant="outline">{t("action_history")}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}