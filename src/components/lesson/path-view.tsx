"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { useMessages } from "@/i18n/client";

type PathResponse = {
  course: { id: string; slug: string; title: string };
  units: {
    id: string;
    title: string;
    skills: {
      id: string;
      icon: string | null;
      lessons: {
        id: string;
        title: string;
        estMinutes: number;
        completed: boolean;
        locked: boolean;
      }[];
    }[];
  }[];
};

export function PathView({ courseSlug }: { courseSlug: string }) {
  const t = useMessages();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["path", courseSlug],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseSlug}/path`);
      if (!res.ok) {
        throw new Error("failed");
      }
      return (await res.json()) as PathResponse;
    },
  });

  if (isLoading) {
    return <p className="text-muted-fg">{t["learn.loading"]}</p>;
  }

  if (isError || !data) {
    return <p className="text-danger">{t["settings.error"]}</p>;
  }

  return (
    <div className="space-y-8">
      {data.units.map((unit) => (
        <section key={unit.id} className="space-y-3">
          <h2 className="text-lg font-semibold">{unit.title}</h2>
          {unit.skills.map((skill) => (
            <div key={skill.id} className="space-y-2">
              {skill.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {skill.icon ? `${skill.icon} ` : ""}
                      {lesson.title}
                    </p>
                    <p className="text-sm text-muted-fg">{lesson.estMinutes} min</p>
                  </div>
                  {lesson.locked ? (
                    <span className="text-sm text-muted-fg">🔒 {t["learn.locked"]}</span>
                  ) : (
                    <Link
                      href={`/app/learn/${lesson.id}`}
                      className="flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {lesson.completed ? t["learn.resume"] : t["learn.start"]}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
