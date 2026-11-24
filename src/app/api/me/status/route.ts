import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getStatus } from "@/domains/progress/service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getStatus(session.user.id));
}
