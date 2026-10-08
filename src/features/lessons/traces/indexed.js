import { array, traceRecorder } from "./trace.js";
const heapCode = `void sift_down(int *a, int n, int i) {
  while (2*i+1 < n) {
    int child = 2*i+1;
    if (child+1 < n && a[child+1] < a[child]) child++;
    if (a[i] <= a[child]) break;
    int temp=a[i]; a[i]=a[child]; a[child]=temp;
    i = child;
  }
}
void heapify(int *a, int n) {
  for (int i = n/2-1; i >= 0; i--) sift_down(a,n,i);
}
void push(int *a, int *n, int value) {
  int i = (*n)++;
  a[i] = value;
  while (i > 0) {
    int parent = (i-1)/2;
    if (a[parent] <= a[i]) break;
    int temp=a[parent]; a[parent]=a[i]; a[i]=temp;
    i = parent;
  }
}
int pop(int *a, int *n) {
  assert(*n > 0);
  int result = a[0];
  a[0] = a[--(*n)];
  sift_down(a,*n,0);
  return result;
}`;
export function heapTrace(mode = "heapify") {
  const values = mode === "heapify" ? [9, 4, 7, 1, 3, 6] : [1, 4, 3, 9, 7, 6];
  const t = traceRecorder(heapCode);
  const tree = () =>
    values.map((value, i) => ({
      id: String(i),
      value: `${i}: ${value}`,
      left: 2 * i + 1 < values.length ? String(2 * i + 1) : null,
      right: 2 * i + 2 < values.length ? String(2 * i + 2) : null,
    }));
  const state = (variables = {}, active = []) => ({
    tree: tree(),
    arrays: [array("heap array", values, active)],
    variables: { size: values.length, ...variables },
  });
  t.record(
    "",
    "A heap is a complete tree, not a sorted array or BST. Each parent is <= its children. Zero-based children are 2i+1 and 2i+2.",
    state(),
  );
  function sift(i) {
    while (2 * i + 1 < values.length) {
      let child = 2 * i + 1;
      if (child + 1 < values.length && values[child + 1] < values[child])
        child++;
      t.record(
        "if (child+1 < n && a[child+1] < a[child]) child++;",
        "Choose the smaller child so both parent-child constraints can be restored.",
        state({ i, child }, [i, child]),
      );
      if (values[i] <= values[child]) {
        t.record(
          "if (a[i] <= a[child]) break;",
          "This subtree is already valid; stop.",
          state({ i, child }),
        );
        break;
      }
      [values[i], values[child]] = [values[child], values[i]];
      t.record(
        "int temp=a[i]; a[i]=a[child]; a[child]=temp;",
        "Swap down, then repair the subtree where the larger value landed.",
        state({ i, child }, [i, child]),
      );
      i = child;
    }
  }
  if (mode === "heapify") {
    for (let i = Math.floor(values.length / 2) - 1; i >= 0; i--) {
      t.record(
        "for (int i = n/2-1; i >= 0; i--) sift_down(a,n,i);",
        "Start at the last internal node. Child subtrees are valid before their parent is repaired.",
        state({ i }, [i]),
      );
      sift(i);
    }
  } else if (mode === "insert") {
    values.push(0);
    let i = values.length - 1;
    t.record(
      "a[i] = value;",
      "Append at the next complete-tree slot. Only the ancestor path can now violate heap order.",
      state({ i, value: 0 }, [i]),
    );
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (values[parent] <= values[i]) break;
      [values[parent], values[i]] = [values[i], values[parent]];
      t.record(
        "int temp=a[parent]; a[parent]=a[i]; a[i]=temp;",
        "Swap upward until the new value belongs below its parent.",
        state({ i, parent }, [i, parent]),
      );
      i = parent;
    }
  } else {
    const result = values[0];
    values[0] = values.pop();
    t.record(
      "a[0] = a[--(*n)];",
      "Remove the minimum and move the last value into the root slot. The shape remains complete.",
      state({ result }, [0]),
    );
    sift(0);
  }
  t.record(
    "",
    mode === "heapify"
      ? "Heap construction is O(n): most nodes are near the leaves and move very little. Repeated insertion is a different algorithm."
      : "The heap invariant is restored; a single operation follows at most one height-length path.",
    state(),
  );
  return t.finish(
    values,
    "int a[16]={9,4,7,1,3,6},n=6;heapify(a,n);for(int i=1;i<n;i++)assert(a[(i-1)/2]<=a[i]);push(a,&n,0);assert(pop(a,&n)==0);int previous=-1;while(n){int x=pop(a,&n);assert(x>=previous);previous=x;}heapify(a,0);",
  );
}

export function hashTrace(mode = "linear", deletion = false) {
  const size = 7,
    table = Array(size).fill("EMPTY"),
    keys = [10, 17, 24],
    t = traceRecorder(`enum { EMPTY = -1, DELETED = -2 };
int locate(const int *table, int key, int insert) {
  int first_deleted = -1;
  for (int attempt = 0; attempt < 7; attempt++) {
    int slot = (key % 7 + ${mode === "quadratic" ? "attempt*attempt" : "attempt"}) % 7;
    if (table[slot] == key) return slot;
    if (table[slot] == DELETED && first_deleted < 0) first_deleted = slot;
    if (table[slot] == EMPTY) return insert ? (first_deleted < 0 ? slot : first_deleted) : -1;
  }
  return insert ? first_deleted : -1;
}`);
  const state = (key, attempt, slot) => ({
    arrays: [array("table", table, [slot])],
    variables: { key, attempt, slot, capacity: size },
  });
  t.record(
    "",
    mode === "quadratic"
      ? "The probe sequence is (h + attempt²) mod 7. It can repeat before visiting every slot; an empty table slot does not guarantee insertion success."
      : "The probe sequence is (h + attempt) mod 7. These nonnegative keys hash to key % 7; EMPTY and DELETED are reserved sentinels.",
    state("—", 0, -1),
  );
  for (const key of keys) {
    for (let attempt = 0; attempt < size; attempt++) {
      const slot =
        ((key % size) + (mode === "quadratic" ? attempt * attempt : attempt)) %
        size;
      t.record(
        `int slot = (key % 7 + ${mode === "quadratic" ? "attempt*attempt" : "attempt"}) % 7;`,
        table[slot] === "EMPTY"
          ? "An empty slot ends this insertion probe."
          : "Collision: inspect the next position in the same probe sequence.",
        state(key, attempt, slot),
      );
      if (table[slot] === "EMPTY") {
        table[slot] = key;
        t.record(
          "",
          "The caller writes the key into the slot returned by locate.",
          state(key, attempt, slot),
        );
        break;
      }
    }
  }
  if (deletion) {
    const slot = table.indexOf(17);
    table[slot] = "DELETED";
    t.record(
      "",
      "Delete 17 using a tombstone. Replacing it with EMPTY would break the search path to 24.",
      state(17, 0, slot),
    );
  }
  for (const key of [24, 31])
    for (let attempt = 0; attempt < size; attempt++) {
      const slot =
        ((key % size) + (mode === "quadratic" ? attempt * attempt : attempt)) %
        size;
      t.record(
        `int slot = (key % 7 + ${mode === "quadratic" ? "attempt*attempt" : "attempt"}) % 7;`,
        "A search must follow exactly the same probe sequence as insertion. Continue past tombstones.",
        state(key, attempt, slot),
      );
      if (table[slot] === key) {
        t.record(
          "if (table[slot] == key) return slot;",
          "Found the key after resolving collisions.",
          state(key, attempt, slot),
        );
        break;
      }
      if (table[slot] === "EMPTY") {
        t.record(
          "if (table[slot] == EMPTY) return insert ? (first_deleted < 0 ? slot : first_deleted) : -1;",
          "A never-used slot proves absence. A tombstone would not.",
          state(key, attempt, slot),
        );
        break;
      }
    }
  return t.finish(
    table,
    "int table[7];for(int i=0;i<7;i++)table[i]=EMPTY;int keys[]={10,17,24};for(int i=0;i<3;i++){int p=locate(table,keys[i],1);assert(p>=0);table[p]=keys[i];}int p=locate(table,17,0);assert(p>=0);table[p]=DELETED;assert(locate(table,24,0)>=0);assert(locate(table,31,0)==-1);p=locate(table,31,1);assert(p>=0);table[p]=31;assert(locate(table,31,0)==p);",
  );
}

export function chainingTrace() {
  const code = `typedef struct Link { int key; struct Link *next; } Link;
int contains(Link *const *buckets, int key) {
  Link *cur = buckets[key % 7];
  while (cur) {
    if (cur->key == key) return 1;
    cur = cur->next;
  }
  return 0;
}`;
  const t = traceRecorder(code),
    memory = [
      { id: "A", label: "node", live: true, fields: { key: 10, next: "NULL" } },
      { id: "B", label: "node", live: true, fields: { key: 17, next: "A" } },
      { id: "C", label: "node", live: true, fields: { key: 24, next: "B" } },
    ];
  const state = (cur) => ({
    arrays: [
      array("buckets", ["NULL", "NULL", "NULL", "C", "NULL", "NULL", "NULL"]),
    ],
    memory,
    variables: { key: 10, cur },
  });
  t.record(
    "Link *cur = buckets[key % 7];",
    "All three keys hash to bucket 3. A bucket stores a chain head, rather than probing other buckets.",
    state("C"),
  );
  for (const id of ["C", "B", "A"]) {
    t.record(
      "if (cur->key == key) return 1;",
      id === "A"
        ? "The key matches. Average constant-time lookup depends on the hash distribution and load factor."
        : "This node has a different key; follow next.",
      state(id),
    );
    if (id !== "A")
      t.record(
        "cur = cur->next;",
        "Only this bucket is searched. A long chain makes worst-case lookup linear.",
        state(memory.find((n) => n.id === id).fields.next),
      );
  }
  return t.finish(
    1,
    "Link a={10,NULL},b={17,&a},c={24,&b};Link *buckets[7]={NULL};buckets[3]=&c;assert(contains(buckets,10));assert(!contains(buckets,31));",
  );
}

export function trieTrace(missing = false) {
  const code = `typedef struct Trie { int terminal; struct Trie *child[26]; } Trie;
void insert(Trie *root, const char *word) {
  for (int i=0; word[i]; i++) {
    int slot = word[i] - 'a';
    if (!root->child[slot]) { root->child[slot] = calloc(1,sizeof(Trie)); assert(root->child[slot]); }
    root = root->child[slot];
  }
  root->terminal = 1;
}
int contains(const Trie *root, const char *word) {
  for (int i=0; word[i]; i++) {
    root = root->child[word[i]-'a'];
    if (!root) return 0;
  }
  return root->terminal;
}
void release(Trie *root) { if(!root)return; for(int i=0;i<26;i++)release(root->child[i]); free(root); }`;
  const t = traceRecorder(code),
    nodes = [
      { id: "ROOT", label: "root", live: true, fields: { terminal: 0 } },
    ];
  const state = (prefix, word) => ({
    memory: nodes,
    variables: { prefix: prefix || "ROOT", word },
  });
  t.record(
    "",
    "This bounded example accepts lowercase a–z only. Each edge consumes one character; terminal distinguishes a complete word from a prefix.",
    state("", ""),
  );
  for (const word of ["car", "cart"]) {
    let prefix = "";
    for (const char of word) {
      const parent = nodes.find((n) => n.id === (prefix || "ROOT"));
      prefix += char;
      if (!nodes.some((n) => n.id === prefix)) {
        nodes.push({
          id: prefix,
          label: `prefix ${prefix}`,
          live: true,
          fields: { terminal: 0 },
        });
        parent.fields[char] = prefix;
        t.record(
          "if (!root->child[slot]) { root->child[slot] = calloc(1,sizeof(Trie)); assert(root->child[slot]); }",
          "Allocate a missing character edge. Existing prefixes are shared.",
          state(prefix, word),
        );
      }
      t.record(
        "root = root->child[slot];",
        "Advance one character into the trie.",
        state(prefix, word),
      );
    }
    nodes.find((n) => n.id === word).fields.terminal = 1;
    t.record(
      "root->terminal = 1;",
      "Mark a whole word without removing longer words that share this prefix.",
      state(word, word),
    );
  }
  const word = missing ? "cat" : "ca";
  let prefix = "",
    result = 0;
  for (const ch of word) {
    prefix += ch;
    t.record(
      "root = root->child[word[i]-'a'];",
      "Follow the character edge, not a numeric ordering comparison.",
      state(prefix, word),
    );
    if (!nodes.some((n) => n.id === prefix)) {
      t.record(
        "if (!root) return 0;",
        "A missing edge proves this word is absent.",
        state(prefix, word),
      );
      break;
    }
  }
  if (nodes.some((n) => n.id === prefix)) {
    result = nodes.find((n) => n.id === prefix).fields.terminal;
    t.record(
      "return root->terminal;",
      "The path exists, but ca is only a prefix. Path existence alone does not mean the word was inserted.",
      state(prefix, word),
    );
  }
  return t.finish(
    result,
    'Trie *root=calloc(1,sizeof(*root));assert(root);insert(root,"car");insert(root,"cart");assert(contains(root,"car"));assert(contains(root,"cart"));assert(!contains(root,"ca"));assert(!contains(root,"cat"));release(root);',
  );
}
