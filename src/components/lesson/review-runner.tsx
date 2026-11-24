"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { ExerciseView } from "@/components/lesson/exercises";
import { Button } from "@/components/ui/button";
import { gradeExercise } from "@/domains/lesson/answer";
import type { AnswerInput, Exercise } from "@/domains/lesson/schema";
import { useTranslator } from "@/i18n/client";

type DueItem = { lessonId: string; exercise: Exercise };

export function ReviewRunner() {
  const t = useTranslator();
  const { data, isLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const res = await fetch("/api/reviews/due");
      if (!res.ok) {
        throw new Error("failed");
      }
      return (await res.json()) as { items: DueItem[] };
    },
  });

  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<AnswerInput | null>(null);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const answers = useRef<{ exerciseId: string; input: AnswerInput; correct: boolean }[]>([]);
  const clientEventId = useRef<string | null>(null);
  if (clientEventId.current === null) {
    clientEventId.current = crypto.randomUUID();
  }

  const items = useMemo(() => data?.items ?? [], [data]);
  const current = items[index];

  const complete = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reviews/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEventId: clientEventId.current,
          items: answers.current.map((item) => ({
            exerciseId: item.exerciseId,
            input: item.input,
          })),
        }),
      });
      if (!res.ok) {
        throw new Error("failed");
      }
      return res.json();
    },
  });

  function check() {
    if (!current || !value) {
      return;
    }
    const correct = gradeExercise(current.exercise, value);
    answers.current = [
      ...answers.current,
      { exerciseId: current.exercise.id, input: value, correct },
    ];
    setAnswered(correct);
  }

  function next() {
    setAnswered(null);
    setValue(null);
    if (index + 1 >= items.length) {
      complete.mutate();
    } else {
      setIndex(index + 1);
    }
  }

  if (isLoading) {
    return <p className="px-6 py-16 text-muted-fg">{t("learn.loading")}</p>;
  }

  if (items.length === 0) {
    return <p className="px-6 py-16 text-muted-fg">{t("review.empty")}</p>;
  }

  if (complete.isSuccess) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 space-y-6 px-6 py-16 text-center">
        <p className="text-lg font-medium">{t("review.done")}</p>
        <Link
          href="/app"
          className="inline-flex h-12 items-center rounded-lg bg-primary px-6 font-medium text-primary-fg"
        >
          {t("learn.back")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <p className="text-right text-sm text-muted-fg">
        {t("learn.progress", { current: index + 1, total: items.length })}
      </p>

      {current ? (
        <section className="space-y-6">
          {"prompt" in current.exercise && current.exercise.prompt ? (
            <h1 className="text-xl font-semibold">{current.exercise.prompt}</h1>
          ) : null}

          <ExerciseView
            exercise={current.exercise}
            value={value}
            onChange={setValue}
            disabled={answered !== null}
          />

          {answered !== null ? (
            <div
              role="status"
              className={`rounded-lg border p-4 ${
                answered ? "border-emerald-500/50" : "border-danger/50 text-danger"
              }`}
            >
              {answered ? t("learn.correct") : t("learn.incorrect")}
            </div>
          ) : null}

          <Button
            onClick={answered !== null ? next : check}
            disabled={answered === null && !value}
            className="w-full"
          >
            {answered !== null ? t("learn.next") : t("learn.check")}
          </Button>
        </section>
      ) : null}
    </main>
  );
}
