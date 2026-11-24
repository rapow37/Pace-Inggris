import { auth, signOut } from "@/auth";

export const instant = false;

export default async function AppHome() {
  const session = await auth();

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Belajar</h1>
        <form action={doSignOut}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Keluar
          </button>
        </form>
      </div>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Halo, {session?.user?.name ?? session?.user?.email ?? "pelajar"}.
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        Learning path dan lesson menyusul di fase berikutnya.
      </p>
    </main>
  );
}
