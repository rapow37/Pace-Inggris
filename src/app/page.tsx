import Link from "next/link";

import { getTranslator } from "@/i18n/server";

export const instant = false;

export default async function Home() {
  const t = await getTranslator();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Torang Bisa</h1>
      <p className="max-w-md text-lg text-muted-fg">{t("home.tagline")}</p>
      <Link
        href="/login"
        className="flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-medium text-primary-fg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {t("home.cta")}
      </Link>
    </main>
  );
}
