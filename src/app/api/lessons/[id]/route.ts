import { NextResponse } from "next/server";

import { getLesson } from "@/domains/lesson/repository";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getLesson(id);

  if (!lesson) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(lesson);
}
