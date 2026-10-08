import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { lessons } from "./catalog";
import GuidedLessons from "./guided-lessons";
import { traceRecorder } from "./traces/trace";
import { linkedTrace, circularQueueTrace } from "./traces/structures";
import { traversalTrace, avlTrace, bstDeleteTrace } from "./traces/trees";
import { heapTrace, hashTrace } from "./traces/indexed";
import {
  sortTrace,
  mergeTrace,
  partitionTrace,
  binarySearchTrace,
} from "./traces/sorting";
import {
  factorialTrace,
  hanoiTrace,
  permutationTrace,
  floodTrace,
} from "./traces/recursion";
afterEach(cleanup);

describe("guided lesson traces", () => {
  for (const lesson of lessons)
    for (const preset of lesson.presets)
      it(`${lesson.title} / ${preset.label} produces replayable C steps`, () => {
        const trace = preset.build();
        expect(trace.frames.length).toBeGreaterThan(1);
        expect(trace.testCode).toBeTruthy();
        for (const frame of trace.frames) {
          expect(frame.line).toBeGreaterThanOrEqual(0);
          expect(frame.line).toBeLessThanOrEqual(trace.code.split("\n").length);
          expect(frame.explanation.length).toBeGreaterThan(10);
        }
        expect(preset.build()).toEqual(trace);
        const initial = JSON.stringify(trace.frames[0]);
        trace.frames.at(-1).variables = { changed: true };
        expect(JSON.stringify(trace.frames[0])).toBe(initial);
      });
  it("rejects an unmatched C statement instead of highlighting a wrong line", () => {
    expect(() =>
      traceRecorder("return 1;").record("return 2;", "why", {}),
    ).toThrow();
  });
  it("preserves traversal order and global BST ordering after each delete case", () => {
    expect(traversalTrace().result).toEqual([1, 3, 6, 8, 12, 14]);
    expect(traversalTrace("preorder").result).toEqual([8, 3, 1, 6, 12, 14]);
    expect(traversalTrace("postorder").result).toEqual([1, 6, 3, 14, 12, 8]);
    for (const kind of ["leaf", "one child", "two children"]) {
      const trace = bstDeleteTrace(kind);
      const nodes = trace.frames.at(-1).tree;
      const childIds = new Set(nodes.flatMap((n) => [n.left, n.right]));
      const root = nodes.find((n) => !childIds.has(n.id));
      function verify(n, lo, hi) {
        if (!n) return;
        expect(n.value).toBeGreaterThan(lo);
        expect(n.value).toBeLessThan(hi);
        verify(
          nodes.find((c) => c.id === n.left),
          lo,
          n.value,
        );
        verify(
          nodes.find((c) => c.id === n.right),
          n.value,
          hi,
        );
      }
      verify(root, -Infinity, Infinity);
    }
  });
  it("rotates every AVL case while preserving order and balance", () => {
    for (const kind of ["LL", "RR", "LR", "RL", "deletion"]) {
      const nodes = avlTrace(kind).frames.at(-1).tree;
      for (const n of nodes) {
        const l = nodes.find((c) => c.id === n.left),
          r = nodes.find((c) => c.id === n.right);
        expect(
          Math.abs((l?.height ?? 0) - (r?.height ?? 0)),
        ).toBeLessThanOrEqual(1);
        if (l) expect(l.value).toBeLessThan(n.value);
        if (r) expect(r.value).toBeGreaterThan(n.value);
      }
      expect(nodes[0].value).toBe(20);
    }
  });
  it("restores a heap after construction, insertion and deletion", () => {
    for (const mode of ["heapify", "insert", "delete"]) {
      const a = heapTrace(mode).result;
      for (let i = 1; i < a.length; i++)
        expect(a[Math.floor((i - 1) / 2)]).toBeLessThanOrEqual(a[i]);
    }
  });
  it("handles empty and wraparound linear structures", () => {
    expect(linkedTrace().result).toEqual([9, 6, 2]);
    expect(linkedTrace("reverse", true).result).toEqual([]);
    expect(circularQueueTrace().result).toEqual({ head: 1, tail: 1, count: 4 });
    expect(circularQueueTrace(true).result).toEqual({
      head: 1,
      tail: 1,
      count: 0,
    });
    expect(hashTrace("linear", true).result).toContain(24);
    expect(hashTrace("linear", true).result).toContain("DELETED");
  });
  it("sorts all presets and keeps a partition distinct from a complete sort", () => {
    for (const method of ["insertion", "selection", "bubble"])
      for (const duplicates of [false, true])
        expect(sortTrace(method, duplicates).result).toEqual(
          duplicates ? [1, 2, 2, 4, 4] : [1, 3, 5, 6, 7],
        );
    expect(mergeTrace().result).toEqual([1, 2, 5, 6]);
    for (const equal of [false, true]) {
      const { values, pivotIndex } = partitionTrace(equal).result;
      expect(
        values.slice(0, pivotIndex).every((v) => v <= values[pivotIndex]),
      ).toBe(true);
      expect(
        values.slice(pivotIndex + 1).every((v) => v > values[pivotIndex]),
      ).toBe(true);
    }
    expect(binarySearchTrace().result).toBe(4);
    expect(binarySearchTrace(true).result).toBe(-1);
  });
  it("increments counters at their own C statement, not one step early", () => {
    for (const [trace, statement, name] of [
      [hanoiTrace(), "(*moves)++;", "moves"],
      [floodTrace(), "(*count)++;", "count"],
    ]) {
      const line =
        trace.code.split("\n").findIndex((s) => s.trim() === statement) + 1;
      trace.frames.forEach((frame, index) => {
        if (frame.line === line)
          expect(frame.variables[name]).toBe(
            trace.frames[index - 1].variables[name] + 1,
          );
      });
    }
  });
  it("finishes the recursive return phase and restores backtracking state", () => {
    expect(factorialTrace().result).toBe(24);
    expect(factorialTrace(true).result).toBe(1);
    expect(hanoiTrace().result).toBe(7);
    expect(new Set(permutationTrace().result).size).toBe(6);
    expect(floodTrace().result).toBe(6);
  });
});
describe("lesson controls", () => {
  it("moves backward, resets, and explains a wrong prediction", () => {
    render(<GuidedLessons />);
    expect(screen.getByRole("button", { name: "Previous step" }).disabled).toBe(
      true,
    );
    const code = screen.getByLabelText("C source code");
    const initial = code.querySelector("[aria-current=step]").textContent;
    fireEvent.click(screen.getByRole("button", { name: "Next step" }));
    expect(code.querySelector("[aria-current=step]").textContent).not.toBe(
      initial,
    );
    fireEvent.click(screen.getByRole("button", { name: "Previous step" }));
    expect(code.querySelector("[aria-current=step]").textContent).toBe(initial);
    fireEvent.click(screen.getByRole("button", { name: "12", exact: true }));
    expect(screen.getByText("Look again.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset", exact: true }));
    expect(screen.queryByText("Look again.")).toBeNull();
  });
  it("loads every lesson, changes presets, and stops at the last frame", () => {
    render(<GuidedLessons />);
    for (const l of lessons) {
      fireEvent.click(
        screen.getByRole("button", { name: l.title, exact: true }),
      );
      expect(
        screen.getByRole("heading", { level: 1, name: l.title }),
      ).toBeTruthy();
      expect(screen.getByText(/^Step 1 /)).toBeTruthy();
    }
    fireEvent.click(
      screen.getByRole("button", { name: "Circular queues", exact: true }),
    );
    fireEvent.change(screen.getByLabelText("Example"), {
      target: { value: "1" },
    });
    let button = screen.getByRole("button", { name: "Next step" });
    let guard = 0;
    while (!button.disabled && guard++ < 200) {
      fireEvent.click(button);
      button = screen.getByRole("button", { name: "Next step" });
    }
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Example"), {
      target: { value: "0" },
    });
    expect(screen.getByText(/^Step 1 /)).toBeTruthy();
  });
});
