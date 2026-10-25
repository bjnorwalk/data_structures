import { Plus } from "lucide-react";
import { Card, CardContent, Button } from "../../components/ui";

export function MiniBadge({ children }) {
  return (
    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm">
      {children}
    </span>
  );
}

export function SectionShell({ title, subtitle, children, controls }) {
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

export function ExplanationPanel({ step, code }) {
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

export function InputRow({
  value,
  setValue,
  onPrimary,
  primaryLabel = "Insert",
}) {
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
