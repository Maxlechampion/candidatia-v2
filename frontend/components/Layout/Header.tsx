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
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
      <div className="flex-1 lg:hidden">
        <span className="text-base font-bold text-dark">
          Candidat<span className="text-primary-500">IA</span>
        </span>
      </div>
      <div className="hidden lg:flex flex-1" />

      <div className="flex items-center gap-2 sm:gap-4">
        <LanguageSwitcher />

        {mounted && user && (
          <>
            <div className="hidden md:block text-right text-sm border-l border-slate-200 pl-4">
              <p className="font-medium text-slate-700 truncate max-w-[200px]">
                {user.full_name || user.email}
              </p>
              <p className="text-xs text-slate-500">
                {user.credits} credits
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <span className="hidden sm:inline">{t("logout")}</span>
              <span className="sm:hidden">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
