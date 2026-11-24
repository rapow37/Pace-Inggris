import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { exportAccountData } from "@/lib/account";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const data = await exportAccountData(session.user.id);
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: {
      "Content-Disposition": 'attachment; filename="torang-bisa-export.json"',
    },
  });
}
