import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Torang Bisa</h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Belajar singkat 3–5 menit, sambil main. Terjaga setiap hari lewat streak.
      </p>
      <Link
        href="/login"
        className="flex h-12 items-center justify-center rounded-lg bg-emerald-600 px-6 font-medium text-white transition-colors hover:bg-emerald-700"
      >
        Mulai belajar
      </Link>
    </main>
  );
}
