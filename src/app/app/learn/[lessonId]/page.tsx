import { LessonRunner } from "@/components/lesson/lesson-runner";

export const instant = false;

export default async function LearnPage({ params }: PageProps<"/app/learn/[lessonId]">) {
  const { lessonId } = await params;
  return <LessonRunner lessonId={lessonId} />;
}
