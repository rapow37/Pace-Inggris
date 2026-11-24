import { exerciseSchema, type Exercise } from "./schema";
import { prisma } from "@/lib/prisma";

type Json = Record<string, unknown>;

function lessonTitle(contentJson: unknown, order: number): string {
  const title = (contentJson as Json | null)?.title;
  return typeof title === "string" ? title : `Lesson ${order}`;
}

export async function getCoursePath(slug: string, userId?: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          skills: {
            orderBy: { order: "asc" },
            include: { lessons: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });

  if (!course) {
    return null;
  }

  const completedRows = userId
    ? await prisma.userLessonProgress.findMany({
        where: { userId, status: "completed" },
        select: { lessonId: true },
      })
    : [];
  const completed = new Set(completedRows.map((row) => row.lessonId));

  const orderedLessons: string[] = [];
  for (const unit of course.units) {
    for (const skill of unit.skills) {
      for (const lesson of skill.lessons) {
        orderedLessons.push(lesson.id);
      }
    }
  }

  const unlocked = new Set<string>();
  let previousCompleted = true;
  for (const lessonId of orderedLessons) {
    if (previousCompleted) {
      unlocked.add(lessonId);
    }
    previousCompleted = completed.has(lessonId);
  }

  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      sourceLang: course.sourceLang,
      targetLang: course.targetLang,
    },
    units: course.units.map((unit) => ({
      id: unit.id,
      order: unit.order,
      title: unit.title,
      skills: unit.skills.map((skill) => ({
        id: skill.id,
        order: skill.order,
        title: skill.title,
        icon: skill.icon,
        lessons: skill.lessons.map((lesson) => ({
          id: lesson.id,
          order: lesson.order,
          title: lessonTitle(lesson.contentJson, lesson.order),
          estMinutes: lesson.estMinutes,
          completed: completed.has(lesson.id),
          locked: !unlocked.has(lesson.id),
        })),
      })),
    })),
  };
}

export type CoursePath = NonNullable<Awaited<ReturnType<typeof getCoursePath>>>;

export async function getLesson(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { exercises: { orderBy: { order: "asc" } } },
  });

  if (!lesson) {
    return null;
  }

  const exercises = lesson.exercises.map((row) => ({
    order: row.order,
    difficulty: row.difficulty,
    payload: exerciseSchema.parse(row.payloadJson) as Exercise,
  }));

  return {
    id: lesson.id,
    order: lesson.order,
    estMinutes: lesson.estMinutes,
    title: lessonTitle(lesson.contentJson, lesson.order),
    exercises,
  };
}

export type LessonDetail = NonNullable<Awaited<ReturnType<typeof getLesson>>>;
