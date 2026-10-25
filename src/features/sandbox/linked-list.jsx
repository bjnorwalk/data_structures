import React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Play, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui";
import { useAnimationTimer } from "../../hooks/use-animation-timer";
import { starterValues, createEntries, cn } from "./utilities";
import { SectionShell, ExplanationPanel, InputRow } from "./controls";
import { codeSamples } from "./code-samples";

export default function LinkedListVisualizer() {
  const [nodes, setNodes] = useState(() => createEntries(starterValues));
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
    setNodes((prev) => [...prev, ...createEntries([n])]);
    setActiveIndex(nodes.length);
    setStep(
      `Inserted ${n} at the tail. The old last node now points to this new node.`,
    );
    setInput("");
  };

  const deleteTail = () => {
    if (!nodes.length) return;
    const removed = nodes[nodes.length - 1].value;
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
          ? `Currently visiting node ${i} with value ${nodes[i].value}. Move to current->next next.`
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
              setNodes(createEntries(starterValues));
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
          {nodes.map(({ value, id }, index) => (
            <React.Fragment key={id}>
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
