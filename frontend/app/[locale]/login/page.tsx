"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api, AuthResponse } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { AuthLayout } from "@/components/Layout/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post<AuthResponse>("/api/auth/login", {
        email,
        password,
      });
      setAuth(data.user, data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      const message = err.response?.data?.detail || "Erreur de connexion.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={t("login_title")} subtitle={t("login_subtitle")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label={t("email")}
          type="email"
          name="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Input
          label={t("password")}
          type="password"
          name="password"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <Button type="submit" loading={loading} className="w-full" size="lg">
          {t("login_cta")}
        </Button>

        <p className="text-center text-sm text-slate-600 pt-2">
          {t("no_account")}{" "}
          <Link href="/register" className="font-semibold text-primary-600 hover:underline">
            {t("register_cta")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
