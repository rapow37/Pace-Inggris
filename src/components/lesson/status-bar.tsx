"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { useTranslator } from "@/i18n/client";

type Status = {
  xpToday: number;
  dailyGoal: number;
  goalReached: boolean;
  streak: { current: number; longest: number };
  hearts: { count: number; nextRefillAt: string | null };
  dueCount: number;
};

export function StatusBar() {
  const t = useTranslator();
  const { data } = useQuery({
    queryKey: ["status"],
    queryFn: async () => {
      const res = await fetch("/api/me/status");
      if (!res.ok) {
        throw new Error("failed");
      }
      return (await res.json()) as Status;
    },
  });

  if (!data) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <span aria-label={t("status.streak", { count: data.streak.current })}>
        🔥 {data.streak.current}
      </span>
      <span aria-label={t("status.hearts", { count: data.hearts.count })}>
        ❤️ {data.hearts.count}
      </span>
      <span
        aria-label={t("status.goal", { done: data.xpToday, goal: data.dailyGoal })}
        className={data.goalReached ? "text-primary" : "text-muted-fg"}
      >
        ⭐ {data.xpToday}/{data.dailyGoal}
      </span>
      {data.dueCount > 0 ? (
        <Link href="/app/review" className="underline">
          {t("status.review")} ({data.dueCount})
        </Link>
      ) : null}
    </div>
  );
}
