"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ExerciseView } from "@/components/lesson/exercises";
import { Button } from "@/components/ui/button";
import { gradeExercise } from "@/domains/lesson/answer";
import type { AnswerInput, Exercise } from "@/domains/lesson/schema";
import { useLessonStore } from "@/domains/lesson/store";
import { useTranslator } from "@/i18n/client";

type LessonResponse = {
  id: string;
  title: string;
  exercises: { order: number; difficulty: number; payload: Exercise }[];
};

type CompleteResponse = { xp: number; accuracy: number };

export function LessonRunner({ lessonId }: { lessonId: string }) {
  const t = useTranslator();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      const res = await fetch(`/api/lessons/${lessonId}`);
      if (!res.ok) {
        throw new Error("failed");
      }
      return (await res.json()) as LessonResponse;
    },
  });

  const [value, setValue] = useState<AnswerInput | null>(null);
  const [answered, setAnswered] = useState(false);
  const clientEventId = useRef<string | null>(null);
  if (clientEventId.current === null) {
    clientEventId.current = crypto.randomUUID();
  }

  const queue = useLessonStore((state) => state.queue);
  const index = useLessonStore((state) => state.index);
  const finished = useLessonStore((state) => state.finished);
  const results = useLessonStore((state) => state.results);
  const submit = useLessonStore((state) => state.submit);
  const advance = useLessonStore((state) => state.advance);
  const restart = useLessonStore((state) => state.restart);

  const exercises = useMemo(() => data?.exercises.map((row) => row.payload) ?? [], [data]);
  const byId = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises],
  );

  const hydrated = useRef(false);
  useEffect(() => {
    if (!data || hydrated.current) {
      return;
    }
    hydrated.current = true;
    useLessonStore.getState().hydrate(
      lessonId,
      data.exercises.map((row) => row.payload),
    );
  }, [data, lessonId]);

  const complete = useMutation({
    mutationFn: async () => {
      const state = useLessonStore.getState();
      const answers = Object.entries(state.answers).map(([exerciseId, input]) => ({
        exerciseId,
        input,
      }));
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEventId: clientEventId.current,
          durationMs: Date.now() - state.startedAt,
          answers,
        }),
      });
      if (!res.ok) {
        throw new Error("complete failed");
      }
      return (await res.json()) as CompleteResponse;
    },
  });

  const {
    mutate: submitComplete,
    isIdle,
    isError: completeError,
    data: completeData,
    reset,
  } = complete;

  useEffect(() => {
    if (finished && isIdle) {
      submitComplete();
    }
  }, [finished, isIdle, submitComplete]);

  const currentId = queue[index];
  const currentExercise = currentId ? byId.get(currentId) : undefined;
  const isCorrect = currentId ? results[currentId] : undefined;

  function check() {
    if (!currentExercise || !value) {
      return;
    }
    submit(currentExercise, value, gradeExercise(currentExercise, value));
    setAnswered(true);
  }

  function next() {
    setAnswered(false);
    setValue(null);
    advance();
  }

  if (isLoading) {
    return <p className="px-6 py-16 text-muted-fg">{t("learn.loading")}</p>;
  }

  if (isError || !data) {
    return (
      <div className="space-y-4 px-6 py-16">
        <p className="text-muted-fg">{t("settings.error")}</p>
        <Button onClick={() => refetch()}>{t("learn.retry")}</Button>
      </div>
    );
  }

  if (finished) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 space-y-6 px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">{t("learn.finish")}</h1>
        {completeError ? (
          <p className="text-danger">{t("settings.error")}</p>
        ) : completeData ? (
          <>
            <p className="text-3xl font-bold text-primary">
              {t("learn.xp", { xp: completeData.xp })}
            </p>
            <p className="text-muted-fg">
              {t("learn.accuracy", { percent: Math.round(completeData.accuracy * 100) })}
            </p>
          </>
        ) : (
          <p className="text-muted-fg">{t("learn.loading")}</p>
        )}
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/app"
            className="flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-medium text-primary-fg"
          >
            {t("learn.back")}
          </Link>
          <Button
            variant="ghost"
            onClick={() => {
              restart();
              hydrated.current = false;
              clientEventId.current = crypto.randomUUID();
              reset();
              refetch();
            }}
          >
            {t("learn.retry")}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-fg/10">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.round((index / Math.max(queue.length, 1)) * 100)}%` }}
          />
        </div>
        <p className="text-right text-sm text-muted-fg">
          {t("learn.progress", { current: index + 1, total: queue.length })}
        </p>
      </div>

      {currentExercise ? (
        <section className="space-y-6">
          {"prompt" in currentExercise && currentExercise.prompt ? (
            <h1 className="text-xl font-semibold">{currentExercise.prompt}</h1>
          ) : null}

          <ExerciseView
            exercise={currentExercise}
            value={value}
            onChange={setValue}
            disabled={answered}
          />

          {answered ? (
            <div
              role="status"
              className={`rounded-lg border p-4 ${
                isCorrect
                  ? "border-emerald-500/50 text-emerald-700 dark:text-emerald-300"
                  : "border-danger/50 text-danger"
              }`}
            >
              <p className="font-medium">{isCorrect ? t("learn.correct") : t("learn.incorrect")}</p>
              {"explanation" in currentExercise && currentExercise.explanation ? (
                <p className="mt-1 text-sm">{currentExercise.explanation}</p>
              ) : null}
            </div>
          ) : null}

          <Button
            onClick={answered ? next : check}
            disabled={!answered && !value}
            className="w-full"
          >
            {answered ? t("learn.next") : t("learn.check")}
          </Button>
        </section>
      ) : null}
    </main>
  );
}
