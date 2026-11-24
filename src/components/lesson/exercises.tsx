"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import type { AnswerInput, Exercise } from "@/domains/lesson/schema";

type Of<T extends Exercise["type"]> = Extract<Exercise, { type: T }>;

type Props<T extends Exercise["type"]> = {
  exercise: Of<T>;
  value: AnswerInput | null;
  onChange: (input: AnswerInput | null) => void;
  disabled: boolean;
};

function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    h = (Math.imul(h, 48271) + 11) >>> 0;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function MultipleChoice({ exercise, value, onChange, disabled }: Props<"multiple_choice">) {
  return (
    <div className="grid gap-3">
      {exercise.options.map((option, index) => {
        const selected = value?.kind === "index" && value.index === index;
        return (
          <Button
            key={`${option}-${index}`}
            type="button"
            variant={selected ? "primary" : "outline"}
            disabled={disabled}
            onClick={() => onChange({ kind: "index", index })}
            className="justify-start"
          >
            {option}
          </Button>
        );
      })}
    </div>
  );
}

export function TranslateBuild({ exercise, value, onChange, disabled }: Props<"translate_build">) {
  const t = useMessages();
  const pool = useMemo(
    () => seededShuffle([...exercise.answerTokens, ...exercise.distractors], exercise.id),
    [exercise],
  );
  const tokens = useMemo(() => (value?.kind === "tokens" ? value.tokens : []), [value]);

  const remaining = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const token of tokens) {
      counts[token] = (counts[token] ?? 0) + 1;
    }
    const used: Record<string, number> = {};
    const result: boolean[] = pool.map((token) => {
      used[token] = (used[token] ?? 0) + 1;
      return used[token]! > (counts[token] ?? 0);
    });
    return result;
  }, [pool, tokens]);

  function setTokens(next: string[]) {
    onChange(next.length > 0 ? { kind: "tokens", tokens: next } : null);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-fg">{t["learn.tapWords"]}</p>
      <div className="flex min-h-14 flex-wrap items-center gap-2 rounded-lg border border-border p-2">
        {tokens.length === 0 ? (
          <span className="px-2 text-sm text-muted-fg">…</span>
        ) : (
          tokens.map((token, index) => (
            <Button
              key={`${token}-${index}`}
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => setTokens(tokens.filter((_, i) => i !== index))}
            >
              {token}
            </Button>
          ))
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {pool.map((token, index) => (
          <Button
            key={`${token}-${index}`}
            type="button"
            variant="ghost"
            disabled={disabled || remaining[index]}
            onClick={() => setTokens([...tokens, token])}
          >
            {token}
          </Button>
        ))}
      </div>
    </div>
  );
}

function TextExercise({
  value,
  onChange,
  disabled,
  audioUrl,
}: {
  value: AnswerInput | null;
  onChange: (input: AnswerInput | null) => void;
  disabled: boolean;
  audioUrl?: string;
}) {
  const t = useMessages();
  const text = value?.kind === "text" ? value.text : "";

  return (
    <div className="space-y-4">
      {audioUrl ? (
        <Button type="button" variant="outline" onClick={() => new Audio(audioUrl).play()}>
          🔊 {t["learn.play"]}
        </Button>
      ) : null}
      <Input
        value={text}
        disabled={disabled}
        placeholder={t["learn.typeHere"]}
        autoComplete="off"
        autoCapitalize="off"
        onChange={(event) =>
          onChange(event.target.value ? { kind: "text", text: event.target.value } : null)
        }
      />
    </div>
  );
}

export function TypeAnswer({ value, onChange, disabled }: Props<"type_answer">) {
  return <TextExercise value={value} onChange={onChange} disabled={disabled} />;
}

export function Listening({ exercise, value, onChange, disabled }: Props<"listening">) {
  return (
    <TextExercise
      value={value}
      onChange={onChange}
      disabled={disabled}
      audioUrl={exercise.audioUrl}
    />
  );
}

export function MatchPairs({ exercise, onChange, disabled }: Props<"match_pairs">) {
  const t = useMessages();
  const rights = useMemo(
    () =>
      seededShuffle(
        exercise.pairs.map((pair) => pair.right),
        exercise.id,
      ),
    [exercise],
  );
  const [assigned, setAssigned] = useState<Record<string, string>>({});

  function assign(left: string, right: string) {
    const next = { ...assigned, [left]: right };
    setAssigned(next);
    const pairs = exercise.pairs
      .filter((pair) => next[pair.left])
      .map((pair) => ({ left: pair.left, right: next[pair.left]! }));
    onChange(pairs.length === exercise.pairs.length ? { kind: "pairs", pairs } : null);
  }

  const usedRights = Object.values(assigned);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-fg">{t["learn.matchHint"]}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          {exercise.pairs.map((pair) => (
            <div
              key={pair.left}
              className="flex h-12 items-center justify-between rounded-lg border border-border px-3"
            >
              <span>{pair.left}</span>
              <span className="text-muted-fg">{assigned[pair.left] ?? "—"}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          {rights.map((right) => (
            <Button
              key={right}
              type="button"
              variant="outline"
              disabled={disabled || usedRights.includes(right)}
              onClick={() => {
                const pending = exercise.pairs.find((pair) => !assigned[pair.left]);
                if (pending) {
                  assign(pending.left, right);
                }
              }}
            >
              {right}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExerciseView(props: {
  exercise: Exercise;
  value: AnswerInput | null;
  onChange: (input: AnswerInput | null) => void;
  disabled: boolean;
}) {
  const { exercise } = props;
  switch (exercise.type) {
    case "multiple_choice":
      return <MultipleChoice {...props} exercise={exercise} />;
    case "translate_build":
      return <TranslateBuild {...props} exercise={exercise} />;
    case "type_answer":
      return <TypeAnswer {...props} exercise={exercise} />;
    case "listening":
      return <Listening {...props} exercise={exercise} />;
    case "match_pairs":
      return <MatchPairs {...props} exercise={exercise} />;
    default:
      return null;
  }
}
