import { useState } from "react";
import { motion } from "framer-motion";
import { StepForward, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui";
import { bubbleSortStep } from "../../algorithms";
import { starterBars, cn } from "./utilities";
import { SectionShell, ExplanationPanel } from "./controls";
import { codeSamples } from "./code-samples";

export default function SortingVisualizer() {
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
            key={height}
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
