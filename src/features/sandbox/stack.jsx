import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui";
import { createEntries, cn } from "./utilities";
import { SectionShell, ExplanationPanel, InputRow } from "./controls";
import { codeSamples } from "./code-samples";

export default function StackVisualizer() {
  const [stack, setStack] = useState(() => createEntries([8, 21, 34]));
  const [input, setInput] = useState("");
  const [step, setStep] = useState(
    "A stack is LIFO: last in, first out. You only add and remove from the top.",
  );

  const push = () => {
    const n = Number(input);
    if (!Number.isFinite(n) || input === "") return;
    setStack((prev) => [...prev, ...createEntries([n])]);
    setStep(`Pushed ${n}. It becomes the new top of the stack.`);
    setInput("");
  };

  const pop = () => {
    if (!stack.length) return;
    const top = stack[stack.length - 1].value;
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
              setStack(createEntries([8, 21, 34]));
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
          {stack.map(({ value, id }, index) => {
            const isTop = index === stack.length - 1;
            return (
              <motion.div
                key={id}
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
