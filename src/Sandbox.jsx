import { useState } from "react";
import {
  Layers,
  GitBranch,
  List,
  ArrowRightLeft,
  SortAsc,
  Code2,
} from "lucide-react";
import { cn } from "./features/sandbox/utilities";
import { MiniBadge } from "./features/sandbox/controls";
import LinkedListVisualizer from "./features/sandbox/linked-list";
import StackVisualizer from "./features/sandbox/stack";
import QueueVisualizer from "./features/sandbox/queue";
import BstVisualizer from "./features/sandbox/bst";
import SortingVisualizer from "./features/sandbox/sorting";
import RecursionVisualizer from "./features/sandbox/recursion";

const topics = [
  {
    id: "linked-list",
    title: "Linked List",
    icon: List,
    description: "Insert, delete, and traverse nodes one pointer at a time.",
  },
  {
    id: "stack",
    title: "Stack",
    icon: Layers,
    description: "LIFO structure with push, pop, and peek behavior.",
  },
  {
    id: "queue",
    title: "Queue",
    icon: ArrowRightLeft,
    description: "FIFO structure with enqueue and dequeue behavior.",
  },
  {
    id: "bst",
    title: "Binary Search Tree",
    icon: GitBranch,
    description: "Insert and search values using left/right comparisons.",
  },
  {
    id: "sorting",
    title: "Sorting",
    icon: SortAsc,
    description: "Step through bubble sort comparisons and swaps.",
  },
  {
    id: "recursion",
    title: "Recursion",
    icon: Code2,
    description: "Visualize call stack growth and base case return.",
  },
];

export default function Sandbox() {
  const [activeTopic, setActiveTopic] = useState("linked-list");
  const ActiveIcon =
    topics.find((topic) => topic.id === activeTopic)?.icon || List;

  const activeComponent = {
    "linked-list": <LinkedListVisualizer />,
    stack: <StackVisualizer />,
    queue: <QueueVisualizer />,
    bst: <BstVisualizer />,
    sorting: <SortingVisualizer />,
    recursion: <RecursionVisualizer />,
  }[activeTopic];

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col justify-between gap-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <MiniBadge>CS1</MiniBadge>
              <MiniBadge>Data Structures</MiniBadge>
              <MiniBadge>Interactive Learning</MiniBadge>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl">
              Interactive Data Structures Visualizer
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 md:text-base">
              Follow each operation to see how values, pointers, and call stacks
              change.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
            <ActiveIcon className="h-6 w-6" />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm lg:sticky lg:top-6">
            <div className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Topics
            </div>
            <div className="space-y-1">
              {topics.map((topic) => {
                const Icon = topic.icon;
                const selected = activeTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    aria-pressed={selected}
                    onClick={() => setActiveTopic(topic.id)}
                    className={cn(
                      "flex w-full gap-3 rounded-2xl p-3 text-left transition",
                      selected
                        ? "bg-zinc-950 text-white shadow-sm"
                        : "text-zinc-600 hover:bg-zinc-100",
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <span className="block text-sm font-medium">
                        {topic.title}
                      </span>
                      <span
                        className={cn(
                          "mt-1 block text-xs leading-5",
                          selected ? "text-zinc-300" : "text-zinc-400",
                        )}
                      >
                        {topic.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="space-y-6">{activeComponent}</section>
        </div>
      </div>
    </main>
  );
}
