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

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const setAuth = useAuthStore((s) => s.setAuth);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post<AuthResponse>("/api/auth/register", {
        email,
        password,
        full_name: fullName || null,
      });
      setAuth(data.user, data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      const message = err.response?.data?.detail || "Erreur lors de la creation du compte.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={t("register_title")} subtitle={t("register_subtitle")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label={t("full_name")}
          type="text"
          name="fullName"
          placeholder="Jean Dupont"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />

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
          autoComplete="new-password"
          hint={t("password_hint")}
        />

        <Button type="submit" loading={loading} className="w-full" size="lg">
          {t("register_cta")}
        </Button>

        <p className="text-center text-sm text-slate-600 pt-2">
          {t("already_account")}{" "}
          <Link href="/login" className="font-semibold text-primary-600 hover:underline">
            {t("login_cta")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
