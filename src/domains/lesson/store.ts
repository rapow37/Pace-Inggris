"use client";

import { create } from "zustand";

import type { AnswerInput, Exercise } from "./schema";

type Persisted = {
  queue: string[];
  index: number;
  answers: Record<string, AnswerInput>;
  results: Record<string, boolean>;
  retried: string[];
  startedAt: number;
};

type LessonStore = Persisted & {
  lessonId: string | null;
  finished: boolean;
  hydrate: (lessonId: string, exercises: Exercise[]) => void;
  submit: (exercise: Exercise, input: AnswerInput, correct: boolean) => void;
  advance: () => void;
  restart: () => void;
};

const storageKey = (lessonId: string) => `tbb:lesson:${lessonId}`;

function save(lessonId: string, state: Persisted) {
  try {
    window.localStorage.setItem(storageKey(lessonId), JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

export const useLessonStore = create<LessonStore>((set, get) => ({
  lessonId: null,
  queue: [],
  index: 0,
  answers: {},
  results: {},
  retried: [],
  startedAt: 0,
  finished: false,

  hydrate: (lessonId, exercises) => {
    if (get().lessonId === lessonId && get().queue.length > 0) {
      return;
    }

    const saved = window.localStorage.getItem(storageKey(lessonId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Persisted;
        set({
          lessonId,
          ...parsed,
          finished: parsed.index >= parsed.queue.length,
        });
        return;
      } catch {
        // fall through to a fresh attempt
      }
    }

    const fresh: Persisted = {
      queue: exercises.map((exercise) => exercise.id),
      index: 0,
      answers: {},
      results: {},
      retried: [],
      startedAt: Date.now(),
    };
    save(lessonId, fresh);
    set({ lessonId, ...fresh, finished: false });
  },

  submit: (exercise, input, correct) => {
    const state = get();
    const answers = { ...state.answers, [exercise.id]: input };
    const results = { ...state.results, [exercise.id]: correct };
    let queue = state.queue;
    let retried = state.retried;
    if (!correct && !retried.includes(exercise.id)) {
      queue = [...queue, exercise.id];
      retried = [...retried, exercise.id];
    }
    const next: Persisted = {
      queue,
      index: state.index,
      answers,
      results,
      retried,
      startedAt: state.startedAt,
    };
    if (state.lessonId) {
      save(state.lessonId, next);
    }
    set({ answers, results, queue, retried });
  },

  advance: () => {
    const state = get();
    const index = state.index + 1;
    const finished = index >= state.queue.length;
    if (state.lessonId) {
      save(state.lessonId, {
        queue: state.queue,
        index,
        answers: state.answers,
        results: state.results,
        retried: state.retried,
        startedAt: state.startedAt,
      });
    }
    set({ index, finished });
  },

  restart: () => {
    const state = get();
    if (state.lessonId) {
      try {
        window.localStorage.removeItem(storageKey(state.lessonId));
      } catch {
        // ignore
      }
    }
    set({
      index: 0,
      answers: {},
      results: {},
      retried: [],
      startedAt: Date.now(),
      finished: false,
    });
  },
}));
