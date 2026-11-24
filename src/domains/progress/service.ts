import {
  HEARTS_MAX,
  loseHearts,
  regenHearts,
  type HeartsState,
} from "@/domains/gamification/hearts";
import { review, DEFAULT_ITEM_STATE } from "@/domains/gamification/srs";
import { applyActivity, dayKey, type StreakState } from "@/domains/gamification/streak";
import { prisma } from "@/lib/prisma";

function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function streakFromRow(
  row: {
    current: number;
    longest: number;
    lastActiveDate: Date | null;
    freezes: number;
  } | null,
): StreakState {
  if (!row) {
    return { current: 0, longest: 0, lastActiveDate: null, freezes: 0 };
  }
  return {
    current: row.current,
    longest: row.longest,
    lastActiveDate: row.lastActiveDate ? row.lastActiveDate.toISOString().slice(0, 10) : null,
    freezes: row.freezes,
  };
}

export async function todayXp(userId: string, timezone: string, now: Date = new Date()) {
  const since = new Date(now.getTime() - 26 * 60 * 60 * 1000);
  const events = await prisma.xpEvent.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { amount: true, createdAt: true },
  });
  const today = dayKey(now, timezone);
  return events
    .filter((event) => dayKey(event.createdAt, timezone) === today)
    .reduce((sum, event) => sum + event.amount, 0);
}

export async function getStatus(userId: string, now: Date = new Date()) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true, dailyGoal: true },
  });
  const timezone = user?.timezone ?? "Asia/Jakarta";
  const dailyGoal = user?.dailyGoal ?? 20;

  const [streakRow, heartsRow, dueCount, xpToday] = await Promise.all([
    prisma.streak.findUnique({ where: { userId } }),
    prisma.hearts.findUnique({ where: { userId } }),
    prisma.userItemState.count({ where: { userId, dueAt: { lte: now } } }),
    todayXp(userId, timezone, now),
  ]);

  const heartsBase: HeartsState = heartsRow
    ? { count: heartsRow.count, nextRefillAt: heartsRow.nextRefillAt }
    : { count: HEARTS_MAX, nextRefillAt: null };
  const hearts = regenHearts(heartsBase, now);

  return {
    xpToday,
    dailyGoal,
    goalReached: xpToday >= dailyGoal,
    streak: { current: streakRow?.current ?? 0, longest: streakRow?.longest ?? 0 },
    hearts: { count: hearts.count, nextRefillAt: hearts.nextRefillAt },
    dueCount,
  };
}

export async function recordLessonCompletion(args: {
  userId: string;
  xp: number;
  accuracy: number;
  itemResults: { itemId: string; correct: boolean }[];
  now?: Date;
}) {
  const now = args.now ?? new Date();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: args.userId },
      select: { timezone: true },
    });

    const streakRow = await tx.streak.findUnique({ where: { userId: args.userId } });
    const today = dayKey(now, user.timezone);
    const streakResult = applyActivity(streakFromRow(streakRow), today);
    const lastActiveDate = toDateOnly(streakResult.state.lastActiveDate ?? today);

    await tx.streak.upsert({
      where: { userId: args.userId },
      create: {
        userId: args.userId,
        current: streakResult.state.current,
        longest: streakResult.state.longest,
        lastActiveDate,
        freezes: streakResult.state.freezes,
      },
      update: {
        current: streakResult.state.current,
        longest: streakResult.state.longest,
        lastActiveDate,
        freezes: streakResult.state.freezes,
      },
    });

    const heartsRow = await tx.hearts.findUnique({ where: { userId: args.userId } });
    const heartsBase: HeartsState = heartsRow
      ? { count: heartsRow.count, nextRefillAt: heartsRow.nextRefillAt }
      : { count: HEARTS_MAX, nextRefillAt: null };
    const regenerated = regenHearts(heartsBase, now);
    const wrong = args.itemResults.filter((item) => !item.correct).length;
    const afterLoss = loseHearts(regenerated, wrong, now);

    await tx.hearts.upsert({
      where: { userId: args.userId },
      create: {
        userId: args.userId,
        count: afterLoss.count,
        nextRefillAt: afterLoss.nextRefillAt,
      },
      update: { count: afterLoss.count, nextRefillAt: afterLoss.nextRefillAt },
    });

    for (const item of args.itemResults) {
      const existing = await tx.userItemState.findUnique({
        where: { userId_itemId: { userId: args.userId, itemId: item.itemId } },
      });
      const previous = existing
        ? {
            ease: existing.ease,
            intervalDays: existing.intervalDays,
            reps: existing.reps,
            lapses: existing.lapses,
          }
        : DEFAULT_ITEM_STATE;
      const next = review(previous, item.correct, now);

      await tx.userItemState.upsert({
        where: { userId_itemId: { userId: args.userId, itemId: item.itemId } },
        create: {
          userId: args.userId,
          itemId: item.itemId,
          ease: next.ease,
          intervalDays: next.intervalDays,
          reps: next.reps,
          lapses: next.lapses,
          dueAt: next.dueAt,
        },
        update: {
          ease: next.ease,
          intervalDays: next.intervalDays,
          reps: next.reps,
          lapses: next.lapses,
          dueAt: next.dueAt,
        },
      });
    }

    return {
      streak: { current: streakResult.state.current, longest: streakResult.state.longest },
      streakExtended: streakResult.extended,
      usedFreeze: streakResult.usedFreeze,
      hearts: { count: afterLoss.count },
    };
  });
}
