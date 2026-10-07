import { array, traceRecorder } from "./trace.js";
export function loopTrace(kind = "triangular") {
  const bodies = {
    linear: "for (int i=0; i<n; i++) count++;",
    triangular:
      "for (int i=0; i<n; i++) {\n    for (int j=0; j<i; j++) count++;\n  }",
    doubling: "for (int i=1; i<n; i*=2) count++;",
  };
  const code = `int work(int n) {
  int count=0;
  ${bodies[kind]}
  return count;
}`;
  const t = traceRecorder(code),
    n = 8,
    rows = [];
  let count = 0;
  const state = (i, j = "—") => ({
    arrays: [array("work per outer iteration", rows)],
    variables: { n, i, j, count },
  });
  t.record(
    "int count=0;",
    "Count a specified basic operation instead of guessing from the number of loops.",
    state(0),
  );
  if (kind === "triangular")
    for (let i = 0; i < n; i++) {
      let work = 0;
      for (let j = 0; j < i; j++) {
        count++;
        work++;
        rows[i] = work;
        t.record(
          "for (int j=0; j<i; j++) count++;",
          "Iteration i performs exactly i increments. Sum 0+1+…+(n−1) = n(n−1)/2.",
          state(i, j),
        );
      }
      if (i === 0) {
        rows.push(0);
        t.record("", "When i=0, the inner loop runs zero times.", state(i));
      }
    }
  else
    for (
      let i = kind === "doubling" ? 1 : 0;
      i < n;
      i = kind === "doubling" ? i * 2 : i + 1
    ) {
      count++;
      rows.push(1);
      t.record(
        bodies[kind],
        kind === "doubling"
          ? "i doubles, so it reaches n after ceil(log₂ n) iterations for positive n. Nested syntax alone does not determine complexity."
          : "One increment per element gives n operations.",
        state(i),
      );
    }
  t.record(
    "return count;",
    kind === "triangular"
      ? "28 increments for n=8. The exact count has a leading n² term, giving Θ(n²)."
      : kind === "doubling"
        ? "3 increments for n=8, giving Θ(log n). This bounded example avoids signed overflow from repeated doubling."
        : "8 increments for n=8, giving Θ(n).",
    state("done"),
  );
  return t.finish(count, `assert(work(8)==${count});assert(work(0)==0);`);
}
export function recurrenceTrace() {
  const code = `int work(int n) {
  if (n <= 1) return 1;
  int left=work(n/2);
  int right=work(n/2);
  return left + right + n;
}`;
  const t = traceRecorder(code),
    levels = [8, 4, 2, 1],
    rows = [];
  for (let depth = 0; depth < levels.length; depth++) {
    const size = levels[depth],
      nodes = 2 ** depth,
      local = size === 1 ? nodes : nodes * size;
    rows.push(`${nodes} × ${size} = ${local}`);
    t.record(
      size === 1 ? "if (n <= 1) return 1;" : "return left + right + n;",
      size === 1
        ? "Eight leaves each contribute one unit. Include the base cases when computing exact work."
        : "Each node contributes its subproblem size in this work-count model. The whole level sums to n.",
      {
        arrays: [array("recursion levels · aggregate work", rows)],
        variables: {
          depth,
          nodes,
          subproblem: size,
          levelWork: local,
          total: rows.length * 8,
        },
      },
    );
  }
  return t.finish(32, "assert(work(8)==32);assert(work(1)==1);");
}
export function timingTrace() {
  const code = `double estimate(double measured, double old_n, double new_n) {
  assert(measured >= 0 && old_n > 0 && new_n > 0);
  double constant = measured / (old_n * old_n);
  return constant * new_n * new_n;
}`;
  const t = traceRecorder(code);
  t.record(
    "",
    "This is an estimate under the model T(n)=c·n², not a measured benchmark. Assume the same implementation, hardware, and dominant cost.",
    { variables: { measuredSeconds: 2, old_n: 1000, new_n: 3000 } },
  );
  t.record(
    "double constant = measured / (old_n * old_n);",
    "Use the known timing to solve for c. Do not transfer c between different algorithms.",
    { variables: { constant: 0.000002 } },
  );
  t.record(
    "return constant * new_n * new_n;",
    "Tripling n multiplies quadratic work by 9: 2 × 9 = 18 seconds. Fixed overhead or cache effects can make real timings differ.",
    {
      arrays: [array("size ratio / work ratio", ["3× size", "9× work"])],
      variables: { estimatedSeconds: 18 },
    },
  );
  return t.finish(18, "assert(fabs(estimate(2,1000,3000)-18)<0.000001);");
}
export function baseTrace() {
  const code = `int digits(unsigned value, unsigned base, unsigned *out) {
  assert(base >= 2 && base <= 16);
  int used=0;
  do {
    out[used++] = value % base;
    value /= base;
  } while (value);
  return used;
}`;
  const t = traceRecorder(code),
    output = [];
  let value = 45;
  const state = () => ({
    arrays: [array("remainders · least significant first", output)],
    variables: { value, base: 2, used: output.length },
  });
  t.record(
    "",
    "Division gives the remaining higher digits; remainder gives the next low digit. This example needs room for six output digits.",
    state(),
  );
  do {
    output.push(value % 2);
    t.record(
      "out[used++] = value % base;",
      "Save the remainder before dividing. Read the final remainders in reverse order.",
      state(),
    );
    value = Math.floor(value / 2);
    t.record(
      "value /= base;",
      "Unsigned integer division discards the fractional part.",
      state(),
    );
  } while (value);
  t.record(
    "return used;",
    "45₁₀ = 101101₂ = 2D₁₆. The do/while also represents zero with one zero digit.",
    state(),
  );
  return t.finish(
    output,
    "unsigned out[32];int n=digits(45,2,out);assert(n==6);unsigned value=0;for(int i=n-1;i>=0;i--)value=value*2+out[i];assert(value==45);assert(digits(0,2,out)==1&&out[0]==0);",
  );
}
export function bitsTrace() {
  const code = `unsigned sets(unsigned a, unsigned b) {
  unsigned intersection = a & b;
  unsigned combined = a | b;
  unsigned different = a ^ b;
  unsigned without_second = a & ~(1u << 1);
  return intersection + combined + different + without_second;
}`;
  const t = traceRecorder(code),
    a = 0b10110,
    b = 0b01101;
  const row = (label, value) =>
    array(
      label,
      Array.from({ length: 5 }, (_, i) => (value >>> (4 - i)) & 1),
    );
  const variables = { a, b };
  const arrays = [row("bit index (high → low)", 0)];
  arrays[0] = array("bit index (high → low)", [4, 3, 2, 1, 0]);
  arrays.push(row("set a", a), row("set b", b));
  t.record(
    "",
    "Bit i represents membership of element i. Display shows only the five low bits; C unsigned width is not assumed to be five.",
    { arrays, variables },
  );
  const operations = [
    [
      "unsigned intersection = a & b;",
      "intersection",
      a & b,
      "AND keeps elements in both sets.",
    ],
    [
      "unsigned combined = a | b;",
      "combined",
      a | b,
      "OR keeps elements in either set.",
    ],
    [
      "unsigned different = a ^ b;",
      "different",
      a ^ b,
      "XOR keeps elements in exactly one set.",
    ],
    [
      "unsigned without_second = a & ~(1u << 1);",
      "without_second",
      a & ~(1 << 1),
      "Shift 1u to select bit 1, complement the mask, then AND to clear that membership. Shift counts must be within the unsigned type width.",
    ],
  ];
  for (const [line, name, value, why] of operations) {
    variables[name] = value;
    arrays.push(row(name, value));
    t.record(line, why, { arrays, variables });
  }
  return t.finish(82, "assert(sets(22u,13u)==82u);");
}
