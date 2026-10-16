"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const router = useRouter();
  const t = useTranslations("auth");
  const { user, clearAuth, hydrate, setUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  useEffect(() => {
    if (!mounted) return;
    async function refreshUser() {
      try {
        const { data } = await api.get("/api/auth/me");
        setUser(data);
      } catch {}
    }
    refreshUser();
  }, [mounted, setUser]);

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <LanguageSwitcher />

        {mounted && user && (
          <>
            <div className="text-right text-sm border-l border-slate-200 pl-4">
              <p className="font-medium text-slate-700">
                {user.full_name || user.email}
              </p>
              <p className="text-xs text-slate-500">
                {user.credits} credits - Plan {user.plan}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              {t("logout")}
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
