import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { exerciseSchema, type Exercise } from "@/domains/lesson/schema";
import { prisma } from "@/lib/prisma";

type Json = Record<string, unknown>;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const due = await prisma.userItemState.findMany({
    where: { userId: session.user.id, dueAt: { lte: new Date() } },
    orderBy: { dueAt: "asc" },
    take: 10,
  });

  if (due.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const wanted = new Set(due.map((row) => row.itemId));
  const exercises = await prisma.exercise.findMany({
    select: { lessonId: true, payloadJson: true },
  });
  const byContentId = new Map<string, { lessonId: string; payload: Exercise }>();
  for (const row of exercises) {
    const id = (row.payloadJson as Json)?.id;
    if (typeof id === "string" && wanted.has(id)) {
      byContentId.set(id, {
        lessonId: row.lessonId,
        payload: exerciseSchema.parse(row.payloadJson),
      });
    }
  }

  const items = due
    .map((row) => {
      const found = byContentId.get(row.itemId);
      if (!found) {
        return null;
      }
      return { lessonId: found.lessonId, exercise: found.payload };
    })
    .filter((item): item is { lessonId: string; exercise: Exercise } => item !== null);

  return NextResponse.json({ items });
}
