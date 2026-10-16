"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("candidatia_token")
      : null;

    if (!token) {
      router.replace("/login");
    }
  }, [router, isAuthenticated]);

  return <>{children}</>;
}
