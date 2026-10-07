import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { lessons } from "../src/features/lessons/catalog.js";

const directory = mkdtempSync(join(tmpdir(), "cs1-c-examples-"));
let count = 0;
try {
  for (const lesson of lessons)
    for (const [index, preset] of lesson.presets.entries()) {
      const trace = preset.build(),
        source = join(directory, `${lesson.id}-${index}.c`),
        binary = join(directory, `${lesson.id}-${index}`);
      writeFileSync(
        source,
        `#include <assert.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n#include <stdint.h>\n${trace.testPreamble ?? ""}\n${trace.code}\nint main(void) { ${trace.testCode} return 0; }\n`,
      );
      const compile = spawnSync(
        process.env.CC || "cc",
        ["-std=c11", "-Wall", "-Wextra", "-Werror", source, "-o", binary],
        { encoding: "utf8" },
      );
      if (compile.error)
        throw new Error(
          "A C compiler is required. Install clang or GCC, or set CC to its executable.",
        );
      if (compile.status !== 0)
        throw new Error(`${lesson.title} / ${preset.label}\n${compile.stderr}`);
      const run = spawnSync(binary, [], { encoding: "utf8", timeout: 5000 });
      if (run.status !== 0)
        throw new Error(
          `${lesson.title} / ${preset.label}: C assertions failed\n${run.stderr}`,
        );
      count++;
    }
  console.log(
    `PASS: ${count} original C examples compiled and ran with assertions.`,
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
