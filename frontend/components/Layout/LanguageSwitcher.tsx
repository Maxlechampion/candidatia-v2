"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/navigation";
import { useTransition } from "react";

type Locale = "fr" | "en";

const LANGUAGES: readonly { code: Locale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(newLocale: Locale) {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  }

  return (
    <div className="flex items-center gap-1">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          disabled={isPending}
          onClick={() => switchLocale(lang.code)}
          className={`px-2 py-1 text-xs font-medium rounded transition disabled:opacity-50 ${
            locale === lang.code
              ? "bg-primary-100 text-primary-700"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          }`}
          aria-label={`Changer en ${lang.label}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}