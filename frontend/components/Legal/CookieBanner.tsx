"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "candidatia_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function acceptAll() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      essential: true,
      analytics: true,
      date: new Date().toISOString(),
    }));
    setVisible(false);
  }

  function acceptEssentialOnly() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      essential: true,
      analytics: false,
      date: new Date().toISOString(),
    }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] bg-white border-t border-slate-200 shadow-lg">
      <div className="container-main py-4 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-1 text-sm text-slate-600">
          <p className="font-medium text-dark mb-1">
            Nous respectons votre vie privée
          </p>
          <p>
            Nous utilisons des cookies pour assurer le fonctionnement du
            Service et, avec votre accord, pour mesurer son audience. Vous
            pouvez accepter tous les cookies ou uniquement ceux nécessaires. 
            <Link href="/legal/cookies" className="text-primary-600 hover:underline">
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={acceptEssentialOnly}>
            Essentiels uniquement
          </Button>
          <Button size="sm" onClick={acceptAll}>
            Tout accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
