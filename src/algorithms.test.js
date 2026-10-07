import { describe, expect, it } from "vitest";
import { buildBst, bubbleSortStep } from "./algorithms";

describe("binary search tree", () => {
  it("returns null for an empty input", () => expect(buildBst([])).toBeNull());
  it("places smaller values left and equal values right without mutating input", () => {
    const values = [8, 3, 10, 8];
    expect(buildBst(values)).toEqual({
      value: 8,
      left: { value: 3, left: null, right: null },
      right: {
        value: 10,
        left: { value: 8, left: null, right: null },
        right: null,
      },
    });
    expect(values).toEqual([8, 3, 10, 8]);
  });
});

describe("bubble sort", () => {
  it("swaps out-of-order neighbors without mutating input", () => {
    const input = [4, 1, 3];
    expect(bubbleSortStep(input, 0)).toEqual([1, 4, 3]);
    expect(input).toEqual([4, 1, 3]);
  });
  it("leaves ordered pairs and out-of-range comparisons unchanged", () => {
    expect(bubbleSortStep([1, 2], 0)).toEqual([1, 2]);
    expect(bubbleSortStep([1, 2], 1)).toEqual([1, 2]);
    expect(bubbleSortStep([], 0)).toEqual([]);
  });
});
