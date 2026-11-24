import { describe, expect, it } from "vitest";

import { applyActivity, dayKey, diffDays, type StreakState } from "./streak";

const base: StreakState = { current: 0, longest: 0, lastActiveDate: null, freezes: 0 };

describe("gamification/streak", () => {
  it("computes the local day key", () => {
    expect(dayKey(new Date("2026-01-01T17:00:00Z"), "Asia/Jakarta")).toBe("2026-01-02");
    expect(dayKey(new Date("2026-01-01T10:00:00Z"), "Asia/Jakarta")).toBe("2026-01-01");
  });

  it("computes day differences", () => {
    expect(diffDays("2026-01-01", "2026-01-02")).toBe(1);
    expect(diffDays("2026-01-01", "2026-01-05")).toBe(4);
  });

  it("starts a streak on first activity", () => {
    const result = applyActivity(base, "2026-01-01");
    expect(result.state.current).toBe(1);
    expect(result.extended).toBe(true);
  });

  it("does not extend twice in the same day", () => {
    const first = applyActivity(base, "2026-01-01").state;
    const second = applyActivity(first, "2026-01-01");
    expect(second.extended).toBe(false);
    expect(second.state.current).toBe(1);
  });

  it("extends on consecutive days", () => {
    const day1 = applyActivity(base, "2026-01-01").state;
    const day2 = applyActivity(day1, "2026-01-02");
    expect(day2.state.current).toBe(2);
    expect(day2.state.longest).toBe(2);
  });

  it("uses a freeze to cover a single missed day", () => {
    const state: StreakState = { current: 3, longest: 3, lastActiveDate: "2026-01-01", freezes: 1 };
    const result = applyActivity(state, "2026-01-03");
    expect(result.state.current).toBe(4);
    expect(result.state.freezes).toBe(0);
    expect(result.usedFreeze).toBe(true);
  });

  it("resets when a day is missed without a freeze", () => {
    const state: StreakState = { current: 5, longest: 5, lastActiveDate: "2026-01-01", freezes: 0 };
    const result = applyActivity(state, "2026-01-03");
    expect(result.state.current).toBe(1);
    expect(result.state.longest).toBe(5);
  });
});
