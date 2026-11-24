import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getCoursePath } from "@/domains/lesson/repository";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const path = await getCoursePath(id, session?.user?.id);

  if (!path) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(path);
}
