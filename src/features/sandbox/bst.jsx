import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { StepForward, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui";
import { buildBst } from "../../algorithms";
import { useAnimationTimer } from "../../hooks/use-animation-timer";
import { cn } from "./utilities";
import { SectionShell, ExplanationPanel, InputRow } from "./controls";
import { codeSamples } from "./code-samples";

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

export default function BstVisualizer() {
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
