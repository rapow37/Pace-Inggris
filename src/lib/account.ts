import { prisma } from "@/lib/prisma";

export async function exportAccountData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      locale: true,
      timezone: true,
      createdAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const [lessonProgress, itemStates, xpEvents, streak, hearts] = await Promise.all([
    prisma.userLessonProgress.findMany({ where: { userId } }),
    prisma.userItemState.findMany({ where: { userId } }),
    prisma.xpEvent.findMany({ where: { userId } }),
    prisma.streak.findUnique({ where: { userId } }),
    prisma.hearts.findUnique({ where: { userId } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user,
    lessonProgress,
    itemStates,
    xpEvents,
    streak,
    hearts,
  };
}

export async function deleteAccount(userId: string) {
  const anonymizedEmail = `deleted+${userId}@deleted.invalid`;

  await prisma.$transaction([
    prisma.pushSubscription.deleteMany({ where: { userId } }),
    prisma.userLessonProgress.deleteMany({ where: { userId } }),
    prisma.userItemState.deleteMany({ where: { userId } }),
    prisma.xpEvent.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.streak.deleteMany({ where: { userId } }),
    prisma.hearts.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), email: anonymizedEmail, name: null, image: null },
    }),
  ]);
}
