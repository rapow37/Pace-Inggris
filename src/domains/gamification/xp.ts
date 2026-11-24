export const XP_BASE = 10;
export const MIN_MS_PER_EXERCISE = 700;

export function accuracy(correctCount: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return correctCount / total;
}

export function accuracyBonus(acc: number): number {
  return Math.round(5 * acc);
}

export function comboBonus(maxConsecutiveCorrect: number): number {
  return Math.min(5, Math.floor(maxConsecutiveCorrect / 3));
}

export function maxConsecutive(results: boolean[]): number {
  let best = 0;
  let current = 0;
  for (const ok of results) {
    current = ok ? current + 1 : 0;
    if (current > best) {
      best = current;
    }
  }
  return best;
}

export function computeXp(args: { correctness: boolean[] }): {
  xp: number;
  accuracy: number;
  combo: number;
} {
  const total = args.correctness.length;
  const correct = args.correctness.filter(Boolean).length;
  const acc = accuracy(correct, total);
  const combo = maxConsecutive(args.correctness);
  const xp = XP_BASE + accuracyBonus(acc) + comboBonus(combo);
  return { xp, accuracy: acc, combo };
}
