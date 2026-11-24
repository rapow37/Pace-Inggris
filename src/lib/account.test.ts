import { describe, expect, it } from "vitest";

import { deleteAccount, exportAccountData } from "./account";
import { prisma } from "./prisma";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("account data (FR-5)", () => {
  it("exports user data then anonymizes and deletes related rows", async () => {
    const stamp = Date.now();
    const email = `test+${stamp}@example.test`;

    const user = await prisma.user.create({
      data: { email, name: "Test User", timezone: "Asia/Jakarta" },
    });

    await prisma.xpEvent.create({
      data: { userId: user.id, amount: 10, source: "lesson", clientEventId: `evt-${stamp}` },
    });
    await prisma.streak.create({ data: { userId: user.id, current: 3, longest: 3 } });

    const data = await exportAccountData(user.id);
    expect(data?.user.email).toBe(email);
    expect(data?.xpEvents).toHaveLength(1);
    expect(data?.streak?.current).toBe(3);

    await deleteAccount(user.id);

    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.email).toBe(`deleted+${user.id}@deleted.invalid`);
    expect(after?.name).toBeNull();
    expect(after?.deletedAt).not.toBeNull();
    expect(await prisma.xpEvent.count({ where: { userId: user.id } })).toBe(0);
    expect(await prisma.streak.findUnique({ where: { userId: user.id } })).toBeNull();

    await deleteAccount(user.id);
    const stillThere = await prisma.user.findUnique({ where: { id: user.id } });
    expect(stillThere?.deletedAt).not.toBeNull();

    await prisma.user.delete({ where: { id: user.id } });
  });
});
