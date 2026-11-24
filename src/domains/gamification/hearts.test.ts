import { describe, expect, it } from "vitest";

import { HEART_REGEN_MS, HEARTS_MAX, loseHearts, regenHearts } from "./hearts";

const t0 = new Date("2026-01-01T00:00:00Z");

describe("gamification/hearts", () => {
  it("keeps full hearts without a refill timer", () => {
    const result = regenHearts({ count: HEARTS_MAX, nextRefillAt: null }, t0);
    expect(result).toEqual({ count: HEARTS_MAX, nextRefillAt: null });
  });

  it("starts a refill timer when a heart is lost", () => {
    const result = loseHearts({ count: HEARTS_MAX, nextRefillAt: null }, 2, t0);
    expect(result.count).toBe(3);
    expect(result.nextRefillAt?.getTime()).toBe(t0.getTime() + HEART_REGEN_MS);
  });

  it("regenerates one heart per interval", () => {
    const lost = loseHearts({ count: HEARTS_MAX, nextRefillAt: null }, 2, t0);
    const after4h = regenHearts(lost, new Date(t0.getTime() + HEART_REGEN_MS));
    expect(after4h.count).toBe(4);
    expect(after4h.nextRefillAt?.getTime()).toBe(t0.getTime() + HEART_REGEN_MS * 2);
  });

  it("caps regeneration at max and clears the timer", () => {
    const lost = loseHearts({ count: HEARTS_MAX, nextRefillAt: null }, 2, t0);
    const after8h = regenHearts(lost, new Date(t0.getTime() + HEART_REGEN_MS * 2));
    expect(after8h).toEqual({ count: HEARTS_MAX, nextRefillAt: null });
  });

  it("never goes below zero", () => {
    const result = loseHearts({ count: 1, nextRefillAt: null }, 5, t0);
    expect(result.count).toBe(0);
  });
});
