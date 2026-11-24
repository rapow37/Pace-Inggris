import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { isEmailEnabled, isGoogleEnabled } from "@/env";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await auth();
  if (session) {
    redirect("/app");
  }

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
        <h1 className="text-2xl font-semibold">Masuk ke Torang Bisa</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Lanjutkan belajar dan simpan progresmu di semua perangkat.
        </p>
      </div>

      {isGoogleEnabled ? (
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="h-12 w-full rounded-lg border border-zinc-300 font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Lanjut dengan Google
          </button>
        </form>
      ) : null}

      {isEmailEnabled ? (
        <form action={signInWithEmail} className="space-y-3">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@contoh.com"
            className="h-12 w-full rounded-lg border border-zinc-300 px-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="submit"
            className="h-12 w-full rounded-lg bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Kirim tautan masuk
          </button>
        </form>
      ) : null}

      {!isGoogleEnabled && !isEmailEnabled ? (
        <p
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
        >
          Belum ada metode masuk yang aktif. Atur kredensial Google atau Resend di berkas
          <code className="mx-1 rounded bg-black/10 px-1">.env</code>
          untuk mengaktifkan login.
        </p>
      ) : null}
    </main>
  );
}
