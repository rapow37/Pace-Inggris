import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { gradeExercise } from "@/domains/lesson/answer";
import { answerInputSchema, exerciseSchema } from "@/domains/lesson/schema";
import { HEARTS_MAX, regenHearts } from "@/domains/gamification/hearts";
import { review, DEFAULT_ITEM_STATE } from "@/domains/gamification/srs";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  clientEventId: z.string().min(1),
  items: z.array(z.object({ exerciseId: z.string().min(1), input: answerInputSchema })).min(1),
});

type Json = Record<string, unknown>;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const userId = session.user.id;
  const { clientEventId, items } = parsed.data;
  const now = new Date();

  if (await prisma.xpEvent.findUnique({ where: { clientEventId } })) {
    return NextResponse.json({ duplicate: true });
  }

  const exerciseRows = await prisma.exercise.findMany({ select: { payloadJson: true } });
  const byContentId = new Map<string, ReturnType<typeof exerciseSchema.parse>>();
  for (const row of exerciseRows) {
    const id = (row.payloadJson as Json)?.id;
    if (typeof id === "string") {
      byContentId.set(id, exerciseSchema.parse(row.payloadJson));
    }
  }

  const graded = items
    .map((item) => {
      const exercise = byContentId.get(item.exerciseId);
      if (!exercise) {
        return null;
      }
      return { itemId: item.exerciseId, correct: gradeExercise(exercise, item.input) };
    })
    .filter((value): value is { itemId: string; correct: boolean } => value !== null);

  await prisma.$transaction(async (tx) => {
    await tx.xpEvent.create({ data: { userId, amount: 0, source: "review", clientEventId } });

    for (const item of graded) {
      const existing = await tx.userItemState.findUnique({
        where: { userId_itemId: { userId, itemId: item.itemId } },
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
        where: { userId_itemId: { userId, itemId: item.itemId } },
        create: {
          userId,
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

    const heartsRow = await tx.hearts.findUnique({ where: { userId } });
    const base = heartsRow
      ? { count: heartsRow.count, nextRefillAt: heartsRow.nextRefillAt }
      : { count: HEARTS_MAX, nextRefillAt: null };
    const regenerated = regenHearts(base, now);
    const count = Math.min(HEARTS_MAX, regenerated.count + 1);
    await tx.hearts.upsert({
      where: { userId },
      create: {
        userId,
        count,
        nextRefillAt: count >= HEARTS_MAX ? null : regenerated.nextRefillAt,
      },
      update: { count, nextRefillAt: count >= HEARTS_MAX ? null : regenerated.nextRefillAt },
    });
  });

  return NextResponse.json({ ok: true });
}
