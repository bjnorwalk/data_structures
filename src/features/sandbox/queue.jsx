import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui";
import { createEntries } from "./utilities";
import { SectionShell, ExplanationPanel, InputRow } from "./controls";
import { codeSamples } from "./code-samples";

export default function QueueVisualizer() {
  const [queue, setQueue] = useState(() => createEntries([14, 28, 42]));
  const [input, setInput] = useState("");
  const [step, setStep] = useState(
    "A queue is FIFO: first in, first out. Enqueue at the back, dequeue from the front.",
  );

  const enqueue = () => {
    const n = Number(input);
    if (!Number.isFinite(n) || input === "") return;
    setQueue((prev) => [...prev, ...createEntries([n])]);
    setStep(`Enqueued ${n} at the back of the queue.`);
    setInput("");
  };

  const dequeue = () => {
    if (!queue.length) return;
    const front = queue[0].value;
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
              setQueue(createEntries([14, 28, 42]));
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
          {queue.map(({ value, id }) => (
            <motion.div
              key={id}
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
