export const HEARTS_MAX = 5;
export const HEART_REGEN_MS = 4 * 60 * 60 * 1000;

export type HeartsState = { count: number; nextRefillAt: Date | null };

export function regenHearts(state: HeartsState, now: Date): HeartsState {
  if (state.count >= HEARTS_MAX) {
    return { count: HEARTS_MAX, nextRefillAt: null };
  }

  let count = state.count;
  let refill = state.nextRefillAt ?? new Date(now.getTime() + HEART_REGEN_MS);

  while (count < HEARTS_MAX && refill.getTime() <= now.getTime()) {
    count += 1;
    refill = new Date(refill.getTime() + HEART_REGEN_MS);
  }

  if (count >= HEARTS_MAX) {
    return { count: HEARTS_MAX, nextRefillAt: null };
  }

  return { count, nextRefillAt: refill };
}

export function loseHearts(state: HeartsState, losses: number, now: Date): HeartsState {
  const count = Math.max(0, state.count - Math.max(0, losses));
  if (count >= HEARTS_MAX) {
    return { count: HEARTS_MAX, nextRefillAt: null };
  }
  return { count, nextRefillAt: state.nextRefillAt ?? new Date(now.getTime() + HEART_REGEN_MS) };
}
