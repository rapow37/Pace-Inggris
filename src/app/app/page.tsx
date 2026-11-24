import Link from "next/link";

import { auth, signOut } from "@/auth";
import { PathView } from "@/components/lesson/path-view";
import { StatusBar } from "@/components/lesson/status-bar";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/i18n/server";

export const instant = false;

export default async function AppHome() {
  const session = await auth();
  const t = await getTranslator();

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("learn.heading")}</h1>
          <p className="text-sm text-muted-fg">
            {t("app.greeting", {
              name: session?.user?.name ?? session?.user?.email ?? "pelajar",
            })}
          </p>
        </div>
        <form action={doSignOut}>
          <Button type="submit" variant="outline">
            {t("app.signOut")}
          </Button>
        </form>
      </div>

      <StatusBar />

      <PathView courseSlug="english-id" />

      <Link href="/app/settings" className="inline-block text-sm underline">
        {t("settings.title")}
      </Link>
    </main>
  );
}
