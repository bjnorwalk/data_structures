import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StepForward, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui";
import { cn } from "./utilities";
import { SectionShell, ExplanationPanel } from "./controls";
import { codeSamples } from "./code-samples";

export default function RecursionVisualizer() {
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
