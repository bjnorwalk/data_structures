import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import App from "./App";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
function topic(name) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${name}`) }));
}
function value(n) {
  fireEvent.change(screen.getByRole("textbox", { name: "Value" }), {
    target: { value: String(n) },
  });
}

describe("visualizer operations", () => {
  it("inserts and removes a linked-list tail", () => {
    render(<App />);
    value(42);
    fireEvent.click(screen.getByRole("button", { name: "Insert" }));
    expect(
      screen.getByText(
        "Inserted 42 at the tail. The old last node now points to this new node.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete Tail" }));
    expect(
      screen.getByText(
        "Deleted 42 from the tail. The previous node's next pointer becomes NULL.",
      ),
    ).toBeTruthy();
  });
  it("removes the newest stack value and oldest queue value", () => {
    render(<App />);
    topic("Stack");
    value(9);
    fireEvent.click(screen.getByRole("button", { name: "Push" }));
    fireEvent.click(screen.getByRole("button", { name: "Pop" }));
    expect(
      screen.getByText("Popped 9. The element below it becomes the new top."),
    ).toBeTruthy();
    topic("Queue");
    value(99);
    fireEvent.click(screen.getByRole("button", { name: "Enqueue" }));
    fireEvent.click(screen.getByRole("button", { name: "Dequeue" }));
    expect(
      screen.getByText(
        "Dequeued 14 from the front. Everyone else shifts forward logically.",
      ),
    ).toBeTruthy();
  });
  it("reports found and missing BST values", () => {
    vi.useFakeTimers();
    render(<App />);
    topic("Binary Search Tree");
    value(24);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    act(() => vi.advanceTimersByTime(2250));
    expect(
      screen.getByText("Found 24. Search path: 30 → 18 → 24."),
    ).toBeTruthy();
    value(25);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    act(() => vi.advanceTimersByTime(2250));
    expect(
      screen.getByText("25 was not found. Search path: 30 → 18 → 24."),
    ).toBeTruthy();
  });
  it("finishes bubble sort through the step control", () => {
    render(<App />);
    topic("Sorting");
    for (let i = 0; i < 28; i++)
      fireEvent.click(screen.getByRole("button", { name: "Next Step" }));
    expect(
      screen.getByText("Array is sorted. No more passes needed."),
    ).toBeTruthy();
  });
  it("restarts recursion depth when the input changes", () => {
    render(<App />);
    topic("Recursion");
    for (let i = 0; i < 5; i++)
      fireEvent.click(screen.getByRole("button", { name: "Next Call" }));
    expect(
      screen.getByText(
        "Base case reached: factorial(0) returns 1. Now the stack can unwind.",
      ),
    ).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Factorial input" }), {
      target: { value: "2" },
    });
    expect(
      screen.getByText(
        "Calling factorial(2). Since it is not the base case, it waits for factorial(1).",
      ),
    ).toBeTruthy();
  });
  it("cancels traversal when its topic unmounts", () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Traverse" }));
    topic("Stack");
    expect(vi.getTimerCount()).toBe(0);
  });
});
