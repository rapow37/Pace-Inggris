import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { gradeExercise } from "@/domains/lesson/answer";
import { answerInputSchema, exerciseSchema } from "@/domains/lesson/schema";
import { computeXp, MIN_MS_PER_EXERCISE, XP_BASE } from "@/domains/gamification/xp";
import { recordLessonCompletion } from "@/domains/progress/service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  clientEventId: z.string().min(1),
  durationMs: z.number().int().min(0).optional(),
  answers: z.array(z.object({ exerciseId: z.string().min(1), input: answerInputSchema })),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { clientEventId, durationMs, answers } = parsed.data;
  const userId = session.user.id;

  const duplicate = await prisma.xpEvent.findUnique({ where: { clientEventId } });
  if (duplicate) {
    return NextResponse.json({ duplicate: true, xp: duplicate.amount });
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
  if (!lesson) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const correctness: boolean[] = [];
  const itemResults: { itemId: string; correct: boolean }[] = [];
  for (const row of lesson.exercises) {
    const exercise = exerciseSchema.parse(row.payloadJson);
    const given = answers.find((answer) => answer.exerciseId === exercise.id);
    const correct = given ? gradeExercise(exercise, given.input) : false;
    correctness.push(correct);
    itemResults.push({ itemId: exercise.id, correct });
  }

  const { xp, accuracy, combo } = computeXp({ correctness });

  const minMs = lesson.exercises.length * MIN_MS_PER_EXERCISE;
  const tooFast = (durationMs ?? minMs) < minMs;
  const awardedXp = tooFast ? Math.min(xp, XP_BASE) : xp;

  const existing = await prisma.userLessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: id } },
  });
  const bestAccuracy = Math.max(existing?.bestAccuracy ?? 0, accuracy);

  await prisma.$transaction([
    prisma.xpEvent.create({
      data: { userId, amount: awardedXp, source: "lesson", clientEventId },
    }),
    prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: id } },
      create: {
        userId,
        lessonId: id,
        status: "completed",
        bestAccuracy,
        completedAt: new Date(),
      },
      update: { status: "completed", bestAccuracy, completedAt: new Date() },
    }),
  ]);

  const gamification = await recordLessonCompletion({
    userId,
    xp: awardedXp,
    accuracy,
    itemResults,
  });

  return NextResponse.json({
    xp: awardedXp,
    accuracy,
    combo,
    flagged: tooFast,
    streak: gamification.streak,
    streakExtended: gamification.streakExtended,
    hearts: gamification.hearts,
  });
}
