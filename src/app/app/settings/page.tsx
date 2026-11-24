import Link from "next/link";

import { DeleteAccount } from "@/components/delete-account";
import { getTranslator } from "@/i18n/server";

export const instant = false;

export default async function SettingsPage() {
  const t = await getTranslator();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-6 py-16">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>

      <section className="space-y-3">
        <a
          href="/api/me/export"
          download="torang-bisa-export.json"
          className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-5 font-medium transition-colors hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t("settings.export")}
        </a>
      </section>

      <section className="space-y-3">
        <DeleteAccount
          labels={{
            delete: t("settings.delete"),
            confirm: t("settings.deleteConfirm"),
            yes: t("settings.deleteYes"),
            cancel: t("settings.deleteCancel"),
            error: t("settings.error"),
          }}
        />
      </section>

      <div>
        <Link href="/app" className="text-sm underline">
          {t("settings.back")}
        </Link>
      </div>
    </main>
  );
}
