import { array, traceRecorder } from "./trace.js";
export function factorialTrace(zero = false) {
  const n = zero ? 0 : 4,
    code = `unsigned factorial(unsigned n) {
  if (n == 0) return 1;
  unsigned child = factorial(n - 1);
  return n * child;
}`;
  const t = traceRecorder(code),
    calls = [],
    returns = [];
  const state = (variables = {}) => ({
    arrays: [
      array("call stack · newest at right", calls),
      array("returned values", returns),
    ],
    variables,
  });
  function visit(n) {
    calls.push(`factorial(${n})`);
    t.record(
      "if (n == 0) return 1;",
      n === 0
        ? "The base case supplies a value. Calls do not simply disappear; their results flow back to waiting callers."
        : "This call waits for a smaller problem. Each frame keeps its own n.",
      state({ n }),
    );
    if (n === 0) {
      returns.push(1);
      calls.pop();
      return 1;
    }
    const child = visit(n - 1);
    t.record(
      "unsigned child = factorial(n - 1);",
      "The child has finished. Resume this caller with the returned value.",
      state({ n, child }),
    );
    const result = n * child;
    returns.push(result);
    t.record(
      "return n * child;",
      "Multiply during the return phase, then pop this frame.",
      state({ n, child, return: result }),
    );
    calls.pop();
    return result;
  }
  const result = visit(n);
  t.record(
    "",
    "No calls remain. This small unsigned example stays within range; factorial overflows fixed-width integers quickly.",
    state({ return: result }),
  );
  return t.finish(
    result,
    `assert(factorial(${n})==${result});assert(factorial(0)==1);`,
  );
}
export function hanoiTrace() {
  const code = `void hanoi(int n, int from, int spare, int to, int pegs[3][3], int *size, int *moves) {
  if (n == 0) return;
  hanoi(n-1,from,to,spare,pegs,size,moves);
  int disk = pegs[from][--size[from]];
  assert(size[to]==0 || pegs[to][size[to]-1] > disk);
  pegs[to][size[to]++] = disk;
  (*moves)++;
  hanoi(n-1,spare,from,to,pegs,size,moves);
}`;
  const t = traceRecorder(code),
    pegs = [[3, 2, 1], [], []],
    calls = [];
  let moves = 0;
  const state = () => ({
    arrays: pegs
      .map((p, i) => array(`peg ${i} · top at right`, p))
      .concat(array("call stack", calls)),
    variables: { moves },
  });
  function visit(n, from, spare, to) {
    if (!n) return;
    calls.push(`H(${n},${from},${spare},${to})`);
    t.record(
      "hanoi(n-1,from,to,spare,pegs,size,moves);",
      "Move the smaller tower out of the way. Each recursive call changes the roles of the pegs.",
      state(),
    );
    visit(n - 1, from, to, spare);
    const disk = pegs[from].pop();
    t.record(
      "int disk = pegs[from][--size[from]];",
      "Remove the exposed disk. No larger disk may be placed above a smaller one.",
      { ...state(), variables: { moves, disk, from, to } },
    );
    pegs[to].push(disk);
    t.record(
      "pegs[to][size[to]++] = disk;",
      "Place the disk on the destination. This completes one legal move.",
      state(),
    );
    moves++;
    t.record(
      "(*moves)++;",
      "Count the completed move before continuing the second recursive branch.",
      state(),
    );
    visit(n - 1, spare, from, to);
    calls.pop();
  }
  t.record(
    "",
    "Arrays list disks bottom to top. Three disks require 2³ − 1 = 7 moves.",
    state(),
  );
  visit(3, 0, 1, 2);
  t.record(
    "",
    "The whole tower has reached peg 2. T(n)=2T(n−1)+1, so the move count is exponential.",
    state(),
  );
  return t.finish(
    moves,
    "int pegs[3][3]={{3,2,1},{0},{0}},size[3]={3,0,0},moves=0;hanoi(3,0,1,2,pegs,size,&moves);assert(moves==7&&size[2]==3&&size[0]==0);",
  );
}
export function permutationTrace() {
  const code = `void swap(char *a, char *b) { char temp=*a; *a=*b; *b=temp; }
void permutations(char *word, int position, int n, int *count) {
  if (position == n) { (*count)++; return; }
  for (int i=position; i<n; i++) {
    swap(&word[position], &word[i]);
    permutations(word,position+1,n,count);
    swap(&word[position], &word[i]); /* restore this choice */
  }
}`;
  const t = traceRecorder(code),
    word = [..."abc"],
    output = [];
  const state = (position, i) => ({
    arrays: [
      array("working word", word, [position, i]),
      array("completed permutations", output),
    ],
    variables: { position, i, count: output.length },
  });
  function visit(position) {
    if (position === word.length) {
      output.push(word.join(""));
      t.record(
        "if (position == n) { (*count)++; return; }",
        "Every position is fixed. Record a complete permutation, then return.",
        state(position, -1),
      );
      return;
    }
    for (let i = position; i < word.length; i++) {
      [word[position], word[i]] = [word[i], word[position]];
      t.record(
        "swap(&word[position], &word[i]);",
        "Choose one character for this position; only the remaining suffix is explored.",
        state(position, i),
      );
      visit(position + 1);
      [word[position], word[i]] = [word[i], word[position]];
      t.record(
        "swap(&word[position], &word[i]); /* restore this choice */",
        "Undo the choice before trying the next branch. Without this restoration, siblings start from the wrong state.",
        state(position, i),
      );
    }
  }
  t.record(
    "",
    "Distinct letters produce 3! = 6 leaves. Repeated letters need an additional deduplication policy.",
    state(0, 0),
  );
  visit(0);
  return t.finish(
    output,
    'char word[]="abc";int count=0;permutations(word,0,3,&count);assert(count==6&&strcmp(word,"abc")==0);',
  );
}
export function floodTrace() {
  const code = `void fill(int grid[3][4], int row, int col, int *count) {
  if (row<0 || row>=3 || col<0 || col>=4 || grid[row][col]!=1) return;
  grid[row][col] = 2;
  (*count)++;
  fill(grid,row-1,col,count);
  fill(grid,row+1,col,count);
  fill(grid,row,col-1,count);
  fill(grid,row,col+1,count);
}`;
  const t = traceRecorder(code),
    grid = [
      [1, 1, 0, 1],
      [0, 1, 0, 1],
      [1, 1, 1, 0],
    ],
    calls = [];
  let count = 0;
  const state = (row, col) => ({
    grid,
    arrays: [array("call stack", calls)],
    variables: { row, col, count },
    legend: "0 = wall · 1 = unvisited region · 2 = visited",
  });
  function fill(row, col) {
    calls.push(`${row},${col}`);
    if (row < 0 || row >= 3 || col < 0 || col >= 4 || grid[row][col] !== 1) {
      t.record(
        "if (row<0 || row>=3 || col<0 || col>=4 || grid[row][col]!=1) return;",
        "Stop at a wall, a visited cell, or an out-of-bounds coordinate. Bounds are tested before indexing.",
        state(row, col),
      );
      calls.pop();
      return;
    }
    grid[row][col] = 2;
    t.record(
      "grid[row][col] = 2;",
      "Mark visited BEFORE recursing so adjacent calls cannot revisit each other forever.",
      state(row, col),
    );
    count++;
    t.record(
      "(*count)++;",
      "Count this newly visited cell once. Recursive neighbors will skip it.",
      state(row, col),
    );
    fill(row - 1, col);
    fill(row + 1, col);
    fill(row, col - 1);
    fill(row, col + 1);
    calls.pop();
  }
  t.record(
    "",
    "Four-way adjacency does not cross diagonal gaps or walls. Only the region connected to (0,0) is filled.",
    state(0, 0),
  );
  fill(0, 0);
  t.record(
    "",
    "Six cells are reachable; the separate region on the right stays unvisited.",
    state(0, 0),
  );
  return t.finish(
    count,
    "int grid[3][4]={{1,1,0,1},{0,1,0,1},{1,1,1,0}},count=0;fill(grid,0,0,&count);assert(count==6&&grid[0][3]==1);",
  );
}
