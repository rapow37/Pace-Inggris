import type { AnswerInput, Exercise } from "./schema";

export function normalizeAnswer(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1,
        (prev[j] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
    }
    prev = current;
  }
  return prev[b.length] ?? 0;
}

export function matchesText(input: string, accepted: string[], maxDistance = 1): boolean {
  const normalized = normalizeAnswer(input);
  return accepted.some((candidate) => {
    const target = normalizeAnswer(candidate);
    if (target === normalized) {
      return true;
    }
    return normalized.length > 0 && levenshtein(normalized, target) <= maxDistance;
  });
}

function tokensEqual(input: string[], target: string[]): boolean {
  if (input.length !== target.length) {
    return false;
  }
  return input.every(
    (token, index) => normalizeAnswer(token) === normalizeAnswer(target[index] ?? ""),
  );
}

export function gradeExercise(exercise: Exercise, answer: AnswerInput): boolean {
  switch (exercise.type) {
    case "multiple_choice": {
      return answer.kind === "index" && answer.index === exercise.correctIndex;
    }
    case "translate_build": {
      if (answer.kind !== "tokens") {
        return false;
      }
      if (tokensEqual(answer.tokens, exercise.answerTokens)) {
        return true;
      }
      return exercise.acceptedVariants.some((variant) => tokensEqual(answer.tokens, variant));
    }
    case "type_answer": {
      return (
        answer.kind === "text" &&
        matchesText(answer.text, [exercise.answer, ...exercise.acceptedVariants])
      );
    }
    case "listening": {
      return (
        answer.kind === "text" &&
        matchesText(answer.text, [exercise.answer, ...exercise.acceptedVariants])
      );
    }
    case "match_pairs": {
      if (answer.kind !== "pairs") {
        return false;
      }
      return exercise.pairs.every((pair) =>
        answer.pairs.some(
          (given) =>
            normalizeAnswer(given.left) === normalizeAnswer(pair.left) &&
            normalizeAnswer(given.right) === normalizeAnswer(pair.right),
        ),
      );
    }
    default:
      return false;
  }
}
