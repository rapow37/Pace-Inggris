import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isEmailEnabled, isGoogleEnabled } from "@/env";
import { getTranslator } from "@/i18n/server";

export const instant = false;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await auth();
  if (session) {
    redirect("/app");
  }

  const t = await getTranslator();
  const googleEnabled = isGoogleEnabled();
  const emailEnabled = isEmailEnabled();
  const { callbackUrl } = await searchParams;
  const redirectTo = typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/app";

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo });
  }

  async function signInWithEmail(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    await signIn("resend", { email, redirectTo });
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("login.title")}</h1>
        <p className="text-sm text-muted-fg">{t("login.subtitle")}</p>
      </div>

      {googleEnabled ? (
        <form action={signInWithGoogle}>
          <Button type="submit" variant="outline" className="w-full">
            {t("login.google")}
          </Button>
        </form>
      ) : null}

      {emailEnabled ? (
        <form action={signInWithEmail} className="space-y-3">
          <label htmlFor="email" className="block text-sm font-medium">
            {t("login.emailLabel")}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@contoh.com"
          />
          <Button type="submit" className="w-full">
            {t("login.emailSubmit")}
          </Button>
        </form>
      ) : null}

      {!googleEnabled && !emailEnabled ? (
        <p
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
        >
          {t("login.noProvider")}
        </p>
      ) : null}
    </main>
  );
}
