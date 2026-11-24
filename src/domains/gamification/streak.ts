export type StreakState = {
  current: number;
  longest: number;
  lastActiveDate: string | null;
  freezes: number;
};

export type StreakResult = {
  state: StreakState;
  extended: boolean;
  usedFreeze: boolean;
};

export function dayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function diffDays(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export function applyActivity(state: StreakState, today: string): StreakResult {
  const last = state.lastActiveDate;

  if (last === today) {
    return { state, extended: false, usedFreeze: false };
  }

  if (!last) {
    return {
      state: {
        current: 1,
        longest: Math.max(state.longest, 1),
        lastActiveDate: today,
        freezes: state.freezes,
      },
      extended: true,
      usedFreeze: false,
    };
  }

  const gap = diffDays(last, today);

  if (gap === 1) {
    const current = state.current + 1;
    return {
      state: {
        current,
        longest: Math.max(state.longest, current),
        lastActiveDate: today,
        freezes: state.freezes,
      },
      extended: true,
      usedFreeze: false,
    };
  }

  if (gap === 2 && state.freezes > 0) {
    const current = state.current + 1;
    return {
      state: {
        current,
        longest: Math.max(state.longest, current),
        lastActiveDate: today,
        freezes: state.freezes - 1,
      },
      extended: true,
      usedFreeze: true,
    };
  }

  return {
    state: { current: 1, longest: state.longest, lastActiveDate: today, freezes: state.freezes },
    extended: true,
    usedFreeze: false,
  };
}
