import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Play,
  StepForward,
  RotateCcw,
  Layers,
  GitBranch,
  List,
  ArrowRightLeft,
  SortAsc,
  Code2,
} from "lucide-react";
import { Card, CardContent } from "./components/ui";
import { Button } from "./components/ui";

import { buildBst, bubbleSortStep } from "./algorithms";
import { useAnimationTimer } from "./hooks/use-animation-timer";

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

const starterValues = [12, 7, 19, 3, 15];
const starterBars = [38, 18, 54, 25, 72, 45, 31];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function MiniBadge({ children }) {
  return (
    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm">
      {children}
    </span>
  );
}

function SectionShell({ title, subtitle, children, controls }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <Card className="overflow-hidden rounded-2xl border-zinc-200 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-zinc-100 px-6 py-5">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">{subtitle}</p>
          </div>
          <div className="min-h-[430px] bg-gradient-to-br from-zinc-50 to-white p-6">
            {children}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="rounded-2xl border-zinc-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Controls
            </h3>
            {controls}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ExplanationPanel({ step, code }) {
  return (
    <Card className="rounded-2xl border-zinc-200 bg-white shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Current Step
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{step}</p>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            C Code
          </h3>
          <div className="max-h-72 overflow-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-100">
            <pre className="whitespace-pre-wrap">{code}</pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const codeSamples = {
  linkedList: `typedef struct node {
  int data;
  struct node *next;
} node;

node* insertTail(node *head, int value) {
  node *newNode = malloc(sizeof(node));
  newNode->data = value;
  newNode->next = NULL;

  if (head == NULL) return newNode;

  node *cur = head;
  while (cur->next != NULL) {
    cur = cur->next;
  }

  cur->next = newNode;
  return head;
}

void traverse(node *head) {
  node *cur = head;
  while (cur != NULL) {
    printf("%d ", cur->data);
    cur = cur->next;
  }
}`,

  stack: `#define MAX 100

typedef struct {
  int data[MAX];
  int top;
} Stack;

void init(Stack *s) {
  s->top = -1;
}

void push(Stack *s, int value) {
  if (s->top == MAX - 1) return;
  s->data[++s->top] = value;
}

int pop(Stack *s) {
  if (s->top == -1) return -1;
  return s->data[s->top--];
}`,

  queue: `typedef struct node {
  int data;
  struct node *next;
} node;

typedef struct {
  node *front;
  node *back;
} Queue;

void enqueue(Queue *q, int value) {
  node *n = malloc(sizeof(node));
  n->data = value;
  n->next = NULL;

  if (q->back == NULL) {
    q->front = q->back = n;
    return;
  }

  q->back->next = n;
  q->back = n;
}

int dequeue(Queue *q) {
  if (q->front == NULL) return -1;

  node *temp = q->front;
  int value = temp->data;
  q->front = q->front->next;

  if (q->front == NULL) q->back = NULL;
  free(temp);
  return value;
}`,

  bst: `typedef struct treeNode {
  int data;
  struct treeNode *left;
  struct treeNode *right;
} treeNode;

treeNode* insert(treeNode *root, int value) {
  if (root == NULL) {
    treeNode *n = malloc(sizeof(treeNode));
    n->data = value;
    n->left = n->right = NULL;
    return n;
  }

  if (value < root->data)
    root->left = insert(root->left, value);
  else
    root->right = insert(root->right, value);

  return root;
}

int search(treeNode *root, int value) {
  if (root == NULL) return 0;
  if (root->data == value) return 1;

  if (value < root->data)
    return search(root->left, value);
  else
    return search(root->right, value);
}`,

  sorting: `void bubbleSort(int arr[], int n) {
  for (int i = 0; i < n - 1; i++) {
    for (int j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        int temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
}`,

  recursion: `int factorial(int n) {
  if (n == 0) {
    return 1;
  }

  return n * factorial(n - 1);
}

/*
factorial(4)
= 4 * factorial(3)
= 4 * 3 * factorial(2)
= 4 * 3 * 2 * factorial(1)
= 4 * 3 * 2 * 1 * factorial(0)
= 4 * 3 * 2 * 1 * 1
= 24
*/`,
};

function InputRow({ value, setValue, onPrimary, primaryLabel = "Insert" }) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^0-9-]/g, ""))}
        onKeyDown={(e) => e.key === "Enter" && onPrimary()}
        aria-label="Value"
        placeholder="Value"
        className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-400"
      />
      <Button
        onClick={onPrimary}
        className="h-10 rounded-xl bg-zinc-950 px-4 text-white hover:bg-zinc-800"
      >
        <Plus className="mr-2 h-4 w-4" />
        {primaryLabel}
      </Button>
    </div>
  );
}

function LinkedListVisualizer() {
  const [nodes, setNodes] = useState(starterValues);
  const { start, cancel } = useAnimationTimer();
  const [input, setInput] = useState("");
  const [activeIndex, setActiveIndex] = useState(null);
  const [step, setStep] = useState(
    "A linked list stores values in nodes. Each node points to the next node instead of sitting directly beside it like an array.",
  );

  const insertNode = () => {
    const n = Number(input);
    if (!Number.isFinite(n) || input === "") return;
    cancel();
    setNodes((prev) => [...prev, n]);
    setActiveIndex(nodes.length);
    setStep(
      `Inserted ${n} at the tail. The old last node now points to this new node.`,
    );
    setInput("");
  };

  const deleteTail = () => {
    if (!nodes.length) return;
    const removed = nodes[nodes.length - 1];
    cancel();
    setNodes((prev) => prev.slice(0, -1));
    setActiveIndex(null);
    setStep(
      `Deleted ${removed} from the tail. The previous node's next pointer becomes NULL.`,
    );
  };

  const traverse = () => {
    if (!nodes.length) return;
    setStep(
      "Traversing starts at head and follows each next pointer until NULL.",
    );
    let i = 0;
    start(() => {
      setActiveIndex(i);
      setStep(
        i < nodes.length
          ? `Currently visiting node ${i} with value ${nodes[i]}. Move to current->next next.`
          : "Traversal complete. current is now NULL.",
      );
      i++;
      if (i > nodes.length) cancel();
    }, 650);
  };

  return (
    <SectionShell
      title="Linked List Visualizer"
      subtitle="Practice head, tail, traversal, insertion, and pointer movement."
      controls={
        <div className="space-y-3">
          <InputRow value={input} setValue={setInput} onPrimary={insertNode} />
          <Button
            onClick={traverse}
            variant="outline"
            className="h-10 w-full rounded-xl border-zinc-200"
          >
            <Play className="mr-2 h-4 w-4" /> Traverse
          </Button>
          <Button
            onClick={deleteTail}
            variant="outline"
            className="h-10 w-full rounded-xl border-zinc-200"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Tail
          </Button>
          <Button
            onClick={() => {
              cancel();
              setNodes(starterValues);
              setActiveIndex(null);
              setStep("Reset linked list to starter values.");
            }}
            variant="ghost"
            className="h-10 w-full rounded-xl"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <ExplanationPanel step={step} code={codeSamples.linkedList} />
        </div>
      }
    >
      <div className="flex min-h-[350px] flex-wrap items-center gap-4">
        <AnimatePresence>
          {nodes.map((value, index) => (
            <React.Fragment key={`${value}-${index}`}>
              <motion.div
                layout
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: activeIndex === index ? 1.08 : 1,
                }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className={cn(
                  "relative flex h-24 w-28 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition",
                  activeIndex === index
                    ? "border-zinc-950 ring-4 ring-zinc-200"
                    : "border-zinc-200",
                )}
              >
                {index === 0 && (
                  <span className="absolute -top-7 left-2 text-xs font-medium text-zinc-400">
                    head
                  </span>
                )}
                <div className="grid flex-1 place-items-center text-2xl font-semibold text-zinc-950">
                  {value}
                </div>
                <div className="border-t border-zinc-100 bg-zinc-50 py-2 text-center font-mono text-xs text-zinc-400">
                  next
                </div>
              </motion.div>
              {index < nodes.length - 1 ? (
                <motion.div layout className="text-2xl text-zinc-300">
                  →
                </motion.div>
              ) : (
                <motion.div
                  layout
                  className="rounded-full bg-zinc-100 px-3 py-1 font-mono text-xs text-zinc-400"
                >
                  NULL
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </AnimatePresence>
      </div>
    </SectionShell>
  );
}

function StackVisualizer() {
  const [stack, setStack] = useState([8, 21, 34]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(
    "A stack is LIFO: last in, first out. You only add and remove from the top.",
  );

  const push = () => {
    const n = Number(input);
    if (!Number.isFinite(n) || input === "") return;
    setStack((prev) => [...prev, n]);
    setStep(`Pushed ${n}. It becomes the new top of the stack.`);
    setInput("");
  };

  const pop = () => {
    if (!stack.length) return;
    const top = stack[stack.length - 1];
    setStack((prev) => prev.slice(0, -1));
    setStep(`Popped ${top}. The element below it becomes the new top.`);
  };

  return (
    <SectionShell
      title="Stack Visualizer"
      subtitle="Push values onto the top and pop the newest value first."
      controls={
        <div className="space-y-3">
          <InputRow
            value={input}
            setValue={setInput}
            onPrimary={push}
            primaryLabel="Push"
          />
          <Button
            onClick={pop}
            variant="outline"
            className="h-10 w-full rounded-xl border-zinc-200"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Pop
          </Button>
          <Button
            onClick={() => {
              setStack([8, 21, 34]);
              setStep("Reset stack to starter values.");
            }}
            variant="ghost"
            className="h-10 w-full rounded-xl"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <ExplanationPanel step={step} code={codeSamples.stack} />
        </div>
      }
    >
      <div className="mx-auto flex max-w-sm flex-col-reverse items-center justify-end gap-3 pt-6">
        <AnimatePresence>
          {stack.map((value, index) => {
            const isTop = index === stack.length - 1;
            return (
              <motion.div
                key={`${value}-${index}`}
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 60 }}
                className={cn(
                  "grid h-16 w-56 place-items-center rounded-2xl border bg-white text-xl font-semibold shadow-sm",
                  isTop
                    ? "border-zinc-950 ring-4 ring-zinc-200"
                    : "border-zinc-200",
                )}
              >
                {isTop && (
                  <span className="absolute -right-14 text-xs font-medium uppercase tracking-widest text-zinc-400">
                    top
                  </span>
                )}
                {value}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {!stack.length && (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-sm text-zinc-400">
            empty stack
          </div>
        )}
      </div>
    </SectionShell>
  );
}

function QueueVisualizer() {
  const [queue, setQueue] = useState([14, 28, 42]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(
    "A queue is FIFO: first in, first out. Enqueue at the back, dequeue from the front.",
  );

  const enqueue = () => {
    const n = Number(input);
    if (!Number.isFinite(n) || input === "") return;
    setQueue((prev) => [...prev, n]);
    setStep(`Enqueued ${n} at the back of the queue.`);
    setInput("");
  };

  const dequeue = () => {
    if (!queue.length) return;
    const front = queue[0];
    setQueue((prev) => prev.slice(1));
    setStep(
      `Dequeued ${front} from the front. Everyone else shifts forward logically.`,
    );
  };

  return (
    <SectionShell
      title="Queue Visualizer"
      subtitle="See the difference between front removal and back insertion."
      controls={
        <div className="space-y-3">
          <InputRow
            value={input}
            setValue={setInput}
            onPrimary={enqueue}
            primaryLabel="Enqueue"
          />
          <Button
            onClick={dequeue}
            variant="outline"
            className="h-10 w-full rounded-xl border-zinc-200"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Dequeue
          </Button>
          <Button
            onClick={() => {
              setQueue([14, 28, 42]);
              setStep("Reset queue to starter values.");
            }}
            variant="ghost"
            className="h-10 w-full rounded-xl"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <ExplanationPanel step={step} code={codeSamples.queue} />
        </div>
      }
    >
      <div className="flex min-h-[350px] items-center justify-center gap-4 overflow-x-auto">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          front
        </span>
        <AnimatePresence mode="popLayout">
          {queue.map((value, index) => (
            <motion.div
              key={`${value}-${index}`}
              layout
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="grid h-20 w-20 place-items-center rounded-2xl border border-zinc-200 bg-white text-xl font-semibold shadow-sm"
            >
              {value}
            </motion.div>
          ))}
        </AnimatePresence>
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          back
        </span>
      </div>
    </SectionShell>
  );
}

function TreeNode({ node, active }) {
  if (!node) return <div className="h-8 w-8" />;
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: active === node.value ? 1.12 : 1 }}
        className={cn(
          "grid h-14 w-14 place-items-center rounded-full border bg-white text-lg font-semibold shadow-sm",
          active === node.value
            ? "border-zinc-950 ring-4 ring-zinc-200"
            : "border-zinc-200",
        )}
      >
        {node.value}
      </motion.div>
      {(node.left || node.right) && (
        <div className="flex gap-8">
          <TreeNode node={node.left} active={active} />
          <TreeNode node={node.right} active={active} />
        </div>
      )}
    </div>
  );
}

function BstVisualizer() {
  const [values, setValues] = useState([30, 18, 45, 12, 24, 38, 51]);
  const { start, cancel } = useAnimationTimer();
  const [input, setInput] = useState("");
  const [active, setActive] = useState(null);
  const [step, setStep] = useState(
    "A BST keeps smaller values on the left and larger or equal values on the right.",
  );
  const tree = useMemo(() => buildBst(values), [values]);

  const insert = () => {
    const n = Number(input);
    if (!Number.isFinite(n) || input === "") return;
    cancel();
    setValues((prev) => [...prev, n]);
    setActive(n);
    setStep(
      `Inserted ${n}. Starting at root, compare values until an empty left or right child is found.`,
    );
    setInput("");
  };

  const search = () => {
    const target = Number(input);
    if (!Number.isFinite(target) || input === "") return;
    let cur = tree;
    const path = [];
    while (cur) {
      path.push(cur.value);
      if (cur.value === target) break;
      cur = target < cur.value ? cur.left : cur.right;
    }
    let i = 0;
    start(() => {
      setActive(path[i]);
      if (path[i] === target)
        setStep(`Found ${target}. Search path: ${path.join(" → ")}.`);
      else
        setStep(
          `Compare ${target} with ${path[i]}. Move ${target < path[i] ? "left" : "right"}.`,
        );
      i++;
      if (i >= path.length) {
        cancel();
        if (path[path.length - 1] !== target)
          setStep(`${target} was not found. Search path: ${path.join(" → ")}.`);
      }
    }, 750);
  };

  return (
    <SectionShell
      title="Binary Search Tree Visualizer"
      subtitle="Build a tree and search using comparison-based branching."
      controls={
        <div className="space-y-3">
          <InputRow value={input} setValue={setInput} onPrimary={insert} />
          <Button
            onClick={search}
            variant="outline"
            className="h-10 w-full rounded-xl border-zinc-200"
          >
            <StepForward className="mr-2 h-4 w-4" /> Search
          </Button>
          <Button
            onClick={() => {
              cancel();
              setValues([30, 18, 45, 12, 24, 38, 51]);
              setActive(null);
              setStep("Reset BST to starter values.");
            }}
            variant="ghost"
            className="h-10 w-full rounded-xl"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <ExplanationPanel step={step} code={codeSamples.bst} />
        </div>
      }
    >
      <div className="flex min-h-[350px] items-start justify-center overflow-auto pt-4">
        <TreeNode node={tree} active={active} />
      </div>
    </SectionShell>
  );
}

function SortingVisualizer() {
  const [bars, setBars] = useState(starterBars);
  const [i, setI] = useState(0);
  const [j, setJ] = useState(0);
  const [step, setStep] = useState(
    "Bubble sort compares neighbors. If the left value is bigger, swap them.",
  );

  const stepSort = () => {
    const next = [...bars];
    if (i >= next.length - 1) {
      setStep("Array is sorted. No more passes needed.");
      return;
    }
    if (j >= next.length - i - 1) {
      setI(i + 1);
      setJ(0);
      setStep(
        `Pass ${i + 1} complete. The largest remaining value bubbled to the right.`,
      );
      return;
    }
    const a = next[j];
    const b = next[j + 1];
    if (a > b) {
      setBars(bubbleSortStep(bars, j));
      setStep(`Compared ${a} and ${b}. Since ${a} > ${b}, swap them.`);
    } else {
      setStep(`Compared ${a} and ${b}. They are already in order, so no swap.`);
    }
    setJ(j + 1);
  };

  return (
    <SectionShell
      title="Sorting Visualizer"
      subtitle="Step through bubble sort with comparisons and swaps."
      controls={
        <div className="space-y-3">
          <Button
            onClick={stepSort}
            className="h-10 w-full rounded-xl bg-zinc-950 text-white hover:bg-zinc-800"
          >
            <StepForward className="mr-2 h-4 w-4" /> Next Step
          </Button>
          <Button
            onClick={() => {
              setBars(starterBars);
              setI(0);
              setJ(0);
              setStep(
                "Bubble sort compares neighbors. If the left value is bigger, swap them.",
              );
            }}
            variant="ghost"
            className="h-10 w-full rounded-xl"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <ExplanationPanel step={step} code={codeSamples.sorting} />
        </div>
      }
    >
      <div className="flex min-h-[350px] items-end justify-center gap-3 overflow-x-auto">
        {bars.map((height, index) => (
          <motion.div
            key={index}
            layout
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              animate={{ height: height * 3 }}
              className={cn(
                "w-12 rounded-t-2xl border shadow-sm",
                index === j || index === j + 1
                  ? "border-zinc-950 bg-zinc-900"
                  : "border-zinc-200 bg-white",
              )}
            />
            <span className="font-mono text-xs text-zinc-500">{height}</span>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}

function RecursionVisualizer() {
  const [n, setN] = useState("5");
  const [depth, setDepth] = useState(0);
  const value = Math.max(0, Math.min(8, Number(n) || 0));
  const calls = Array.from({ length: value + 1 }, (_, index) => value - index);
  const shownCalls = calls.slice(0, depth + 1);
  const step =
    depth < calls.length - 1
      ? `Calling factorial(${calls[depth]}). Since it is not the base case, it waits for factorial(${calls[depth] - 1}).`
      : `Base case reached: factorial(0) returns 1. Now the stack can unwind.`;

  return (
    <SectionShell
      title="Recursion Visualizer"
      subtitle="Watch recursive calls stack up until the base case is reached."
      controls={
        <div className="space-y-3">
          <input
            aria-label="Factorial input"
            value={n}
            onChange={(e) => {
              setN(e.target.value.replace(/[^0-9]/g, ""));
              setDepth(0);
            }}
            className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
          />
          <Button
            onClick={() => setDepth((d) => Math.min(d + 1, calls.length - 1))}
            className="h-10 w-full rounded-xl bg-zinc-950 text-white hover:bg-zinc-800"
          >
            <StepForward className="mr-2 h-4 w-4" /> Next Call
          </Button>
          <Button
            onClick={() => setDepth(0)}
            variant="ghost"
            className="h-10 w-full rounded-xl"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <ExplanationPanel step={step} code={codeSamples.recursion} />
        </div>
      }
    >
      <div className="mx-auto flex min-h-[350px] max-w-md flex-col-reverse justify-start gap-3 pt-4">
        <AnimatePresence>
          {shownCalls.map((call, index) => (
            <motion.div
              key={call}
              layout
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "rounded-2xl border bg-white p-4 shadow-sm",
                index === shownCalls.length - 1
                  ? "border-zinc-950 ring-4 ring-zinc-200"
                  : "border-zinc-200",
              )}
            >
              <div className="font-mono text-sm text-zinc-950">
                factorial({call})
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                {call === 0
                  ? "base case: return 1"
                  : `waiting for factorial(${call - 1})`}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </SectionShell>
  );
}

export default function App() {
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
