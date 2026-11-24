import { auth, signOut } from "@/auth";
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("app.title")}</h1>
        <form action={doSignOut}>
          <Button type="submit" variant="outline">
            {t("app.signOut")}
          </Button>
        </form>
      </div>
      <p className="mt-4 text-muted-fg">
        {t("app.greeting", { name: session?.user?.name ?? session?.user?.email ?? "pelajar" })}
      </p>
      <p className="mt-2 text-sm text-muted-fg">{t("app.comingSoon")}</p>
    </main>
  );
}
