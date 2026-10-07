import { array, traceRecorder } from "./trace.js";

export function aliasesTrace() {
  const code = `int aliases(void) {
  int values[] = {6, 11, 18};
  int *p = values;
  int *q = p + 1;
  *q = 14;
  p++;
  return *p;
}`;
  const t = traceRecorder(code);
  const state = {
    arrays: [array("values · automatic storage", [6, 11, 18])],
    variables: { p: "not assigned", q: "not assigned" },
  };
  t.record(
    "int values[] = {6, 11, 18};",
    "The array owns three adjacent int slots. Addresses below are symbolic element offsets, not machine addresses.",
    state,
  );
  state.variables.p = "values + 0";
  t.record(
    "int *p = values;",
    "p stores the address of element zero. The values were not copied.",
    state,
  );
  state.variables.q = "values + 1";
  state.arrays[0].active = [1];
  t.record(
    "int *q = p + 1;",
    "Adding one advances by sizeof(*p) bytes, one int slot. q and p refer into the same array.",
    state,
  );
  state.arrays[0].values[1] = 14;
  t.record(
    "*q = 14;",
    "Dereferencing q writes to the original array at index one.",
    state,
  );
  state.variables.p = "values + 1";
  t.record(
    "p++;",
    "Now both pointers address the same slot. Incrementing a pointer does not increment the stored integer.",
    state,
  );
  state.variables.return = 14;
  t.record(
    "return *p;",
    "Reading through p returns 14. All automatic storage ends when the function returns.",
    state,
  );
  return t.finish(14, "assert(aliases() == 14);");
}

export function ownershipTrace() {
  const code = `typedef struct { char *name; int score; } Entry;
void shared_name(void) {
  Entry *a = malloc(sizeof *a);
  Entry *b = malloc(sizeof *b);
  assert(a != NULL && b != NULL);
  a->name = malloc(4);
  assert(a->name != NULL);
  strcpy(a->name, "owl");
  b->name = a->name;
  a->score = b->score = 7;
  free(a->name);
  free(a);
  free(b);
}`;
  const t = traceRecorder(code);
  const state = { memory: [], variables: {} };
  for (const id of ["a", "b"]) {
    state.memory.push({
      id: id.toUpperCase(),
      label: `Entry ${id}`,
      live: true,
      fields: { name: "uninitialized", score: "uninitialized" },
    });
    state.variables[id] = id.toUpperCase();
    t.record(
      `Entry *${id} = malloc(sizeof *${id});`,
      "A struct allocation is separate from any character buffer its pointer field will reference.",
      state,
    );
  }
  state.memory.push({
    id: "TEXT",
    label: "4 char slots",
    live: true,
    fields: { contents: "uninitialized" },
  });
  state.memory[0].fields.name = "TEXT";
  t.record(
    "a->name = malloc(4);",
    "Three letters need a fourth slot for the terminating NUL byte. Allocation failure is checked before the copy.",
    state,
  );
  state.memory[2].fields.contents = "o w l \\0";
  t.record(
    'strcpy(a->name, "owl");',
    "Copy bytes into the allocated character buffer, including the terminator.",
    state,
  );
  state.memory[1].fields.name = "TEXT";
  t.record(
    "b->name = a->name;",
    "Only the address is copied. This is a shallow copy: there is still exactly one character allocation.",
    state,
  );
  state.memory[0].fields.score = 7;
  state.memory[1].fields.score = 7;
  t.record(
    "a->score = b->score = 7;",
    "The scalar score is stored separately in each struct.",
    state,
  );
  state.memory[2].live = false;
  t.record(
    "free(a->name);",
    "Free the shared buffer exactly once. Both name fields are now dangling and must not be read.",
    state,
  );
  state.memory[0].live = false;
  t.record(
    "free(a);",
    "Free the first struct after its owned buffer. free does not automatically clear a pointer.",
    state,
  );
  state.memory[1].live = false;
  t.record(
    "free(b);",
    "Free the second struct. Freeing b->name here would double-free TEXT; this example does not do that.",
    state,
  );
  return t.finish(0, "shared_name();");
}

export function rowsTrace(ragged = false) {
  const lengths = ragged ? [2, 3, 1] : [3, 3, 3];
  const code = `void release_rows(void) {
  size_t lengths[] = {${lengths.join(", ")}};
  int **rows = malloc(3 * sizeof *rows);
  assert(rows != NULL);
  for (int r = 0; r < 3; r++) {
    rows[r] = calloc(lengths[r], sizeof *rows[r]);
    assert(rows[r] != NULL);
  }
  rows[1][0] = 9;
  for (int r = 0; r < 3; r++) {
    free(rows[r]);
  }
  free(rows);
}`;
  const t = traceRecorder(code);
  const state = {
    memory: [
      {
        id: "ROWS",
        label: "array of 3 row pointers",
        live: true,
        fields: {
          "[0]": "uninitialized",
          "[1]": "uninitialized",
          "[2]": "uninitialized",
        },
      },
    ],
    variables: { rows: "ROWS" },
  };
  t.record(
    "int **rows = malloc(3 * sizeof *rows);",
    "The outer allocation contains pointers, not the integers of every row. sizeof *rows is the size of one row pointer.",
    state,
  );
  lengths.forEach((n, r) => {
    state.variables.r = r;
    state.memory.push({
      id: `R${r}`,
      label: `${n} int slots`,
      live: true,
      fields: Object.fromEntries(
        Array.from({ length: n }, (_, i) => [`[${i}]`, 0]),
      ),
    });
    state.memory[0].fields[`[${r}]`] = `R${r}`;
    t.record(
      "rows[r] = calloc(lengths[r], sizeof *rows[r]);",
      "Allocate this row separately. calloc initializes these integer values to zero. Rows do not have to be adjacent in memory.",
      state,
    );
  });
  state.memory[2].fields["[0]"] = 9;
  t.record(
    "rows[1][0] = 9;",
    "First read the row pointer at rows[1], then index into that row. This is two levels of indirection.",
    state,
  );
  lengths.forEach((_, r) => {
    state.variables.r = r;
    state.memory[r + 1].live = false;
    t.record(
      "free(rows[r]);",
      "Free a row while the outer pointer array still exists. Freeing only rows would leak the row allocations.",
      state,
    );
  });
  state.memory[0].live = false;
  t.record(
    "free(rows);",
    "Release the outer allocation last. All four allocations have now been freed exactly once.",
    state,
  );
  return t.finish(0, "release_rows();");
}

export function reallocTrace(failure = false) {
  const code = `int grow(int **values, size_t count) {
  int *next = realloc(*values, count * sizeof **values);
  if (next == NULL) return 0;
  *values = next;
  return 1;
}`;
  const t = traceRecorder(code);
  const state = {
    memory: [
      {
        id: "OLD",
        label: "2 int slots",
        live: true,
        fields: { "[0]": 4, "[1]": 8 },
      },
    ],
    variables: {
      values: "address of owner pointer",
      "*values": "OLD",
      alias: "OLD + 1",
    },
  };
  t.record(
    "",
    "Start with an owned buffer and an alias into it. This model shows a moving realloc, one permitted outcome; an actual allocator may resize in place.",
    state,
  );
  if (failure) {
    state.variables.next = "NULL";
    t.record(
      "int *next = realloc(*values, count * sizeof **values);",
      "Simulated allocation failure: realloc leaves the original buffer allocated and unchanged.",
      state,
    );
    state.variables.return = 0;
    t.record(
      "if (next == NULL) return 0;",
      "Return failure without overwriting the owner. Assigning realloc directly to *values would lose the only owning pointer on failure.",
      state,
    );
  } else {
    state.memory[0].live = false;
    state.memory.push({
      id: "NEW",
      label: "4 int slots",
      live: true,
      fields: {
        "[0]": 4,
        "[1]": 8,
        "[2]": "uninitialized",
        "[3]": "uninitialized",
      },
    });
    state.variables.next = "NEW";
    state.variables.alias = "dangling · old address";
    t.record(
      "int *next = realloc(*values, count * sizeof **values);",
      "The old values are preserved, but additional slots are uninitialized. Old aliases cannot be used after a successful moving resize.",
      state,
    );
    state.variables["*values"] = "NEW";
    t.record(
      "*values = next;",
      "Update the owning pointer after checking for failure. A pointer-to-pointer lets the function change the caller’s pointer.",
      state,
    );
    state.variables.return = 1;
    t.record(
      "return 1;",
      "Report success. The caller owns NEW and must eventually free it.",
      state,
    );
  }
  const trace = t.finish(
    failure ? 0 : 1,
    failure
      ? "int *p=malloc(2*sizeof(*p));assert(p);p[0]=4;p[1]=8;int *original=p;assert(!grow(&p,4));assert(p==original&&p[0]==4&&p[1]==8);free(p);"
      : "int *p=malloc(2*sizeof(*p));assert(p);p[0]=4;p[1]=8;assert(grow(&p,4));assert(p[0]==4&&p[1]==8);free(p);",
  );
  if (failure)
    trace.testPreamble =
      "static void *fail_resize(void *pointer,size_t bytes){(void)pointer;(void)bytes;return NULL;}\n#define realloc fail_resize";
  return trace;
}
