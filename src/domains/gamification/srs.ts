export type ItemStateInput = {
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
};

export type ItemStateOutput = ItemStateInput & { dueAt: Date };

const DAY_MS = 86_400_000;

export function review(input: ItemStateInput, correct: boolean, now: Date): ItemStateOutput {
  let { ease, reps, lapses } = input;
  const { intervalDays } = input;
  let interval: number;

  if (correct) {
    reps += 1;
    if (lapses === 0 && reps === 1) {
      interval = 1;
    } else if (reps === 2) {
      interval = 3;
    } else {
      interval = Math.round(intervalDays * ease);
    }
    ease = Math.min(2.8, ease + 0.05);
  } else {
    lapses += 1;
    reps = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  }

  return {
    ease,
    intervalDays: interval,
    reps,
    lapses,
    dueAt: new Date(now.getTime() + interval * DAY_MS),
  };
}

export const DEFAULT_ITEM_STATE: ItemStateInput = {
  ease: 2.5,
  intervalDays: 0,
  reps: 0,
  lapses: 0,
};
