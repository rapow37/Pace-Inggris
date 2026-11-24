import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { deleteAccount } from "@/lib/account";

const bodySchema = z.object({ confirm: z.literal("DELETE") });

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  await deleteAccount(session.user.id);
  return NextResponse.json({ deleted: true });
}
