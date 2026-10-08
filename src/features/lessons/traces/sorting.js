import { array, traceRecorder } from "./trace.js";

export function sortTrace(method = "insertion", duplicates = false) {
  const values = duplicates ? [4, 2, 4, 1, 2] : [7, 3, 5, 1, 6];
  const initial = [...values];
  const bodies = {
    insertion: `for (int i = 1; i < n; i++) {
    int key = a[i], j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j+1] = a[j];
      j--;
    }
    a[j+1] = key;
  }`,
    selection: `for (int i = 0; i < n - 1; i++) {
    int smallest = i;
    for (int j = i + 1; j < n; j++) {
      if (a[j] < a[smallest]) smallest = j;
    }
    int temp = a[i]; a[i] = a[smallest]; a[smallest] = temp;
  }`,
    bubble: `for (int end = n - 1; end > 0; end--) {
    int swapped = 0;
    for (int j = 0; j < end; j++) {
      if (a[j] > a[j+1]) {
        int temp = a[j]; a[j] = a[j+1]; a[j+1] = temp;
        swapped = 1;
      }
    }
    if (!swapped) break;
  }`,
  };
  const code = `void sort(int *a, int n) {
  ${bodies[method]}
}`;
  const t = traceRecorder(code),
    state = (variables = {}, active = []) => ({
      arrays: [array("array", values, active)],
      variables,
    });
  t.record(
    "",
    "Watch the sorted region grow. Highlighted cells are the ones involved in this step.",
    state(),
  );
  if (method === "insertion")
    for (let i = 1; i < values.length; i++) {
      const key = values[i];
      let j = i - 1;
      t.record(
        "int key = a[i], j = i - 1;",
        "Save the key before shifting. The prefix before i is already sorted.",
        state({ i, j, key }, [i]),
      );
      while (j >= 0 && values[j] > key) {
        values[j + 1] = values[j];
        t.record(
          "a[j+1] = a[j];",
          "Shift the larger value right. A duplicated cell is temporary; key is safe in a variable.",
          state({ i, j, key }, [j, j + 1]),
        );
        j--;
      }
      values[j + 1] = key;
      t.record(
        "a[j+1] = key;",
        "Fill the gap with key. Using > rather than >= preserves the order of equal keys.",
        state({ i, j, key }, [j + 1]),
      );
    }
  if (method === "selection")
    for (let i = 0; i < values.length - 1; i++) {
      let smallest = i;
      for (let j = i + 1; j < values.length; j++) {
        if (values[j] < values[smallest]) smallest = j;
        t.record(
          "if (a[j] < a[smallest]) smallest = j;",
          "Find the smallest value in the remaining suffix; the prefix is final.",
          state({ i, j, smallest }, [j, smallest]),
        );
      }
      [values[i], values[smallest]] = [values[smallest], values[i]];
      t.record(
        "int temp = a[i]; a[i] = a[smallest]; a[smallest] = temp;",
        "One swap places the suffix minimum. This swap can move equal keys out of their original order.",
        state({ i, smallest }, [i, smallest]),
      );
    }
  if (method === "bubble")
    for (let end = values.length - 1; end > 0; end--) {
      let swapped = 0;
      for (let j = 0; j < end; j++) {
        t.record(
          "if (a[j] > a[j+1]) {",
          "Compare neighbors; the largest unsettled value moves toward end.",
          state({ end, j, swapped }, [j, j + 1]),
        );
        if (values[j] > values[j + 1]) {
          [values[j], values[j + 1]] = [values[j + 1], values[j]];
          t.record(
            "int temp = a[j]; a[j] = a[j+1]; a[j+1] = temp;",
            "Swap only an inverted pair. Equal values are not exchanged.",
            state({ end, j, swapped }, [j, j + 1]),
          );
          swapped = 1;
          t.record(
            "swapped = 1;",
            "Remember that the pass changed the array. The early-exit test happens after the whole pass.",
            state({ end, j, swapped }),
          );
        }
      }
      t.record(
        "if (!swapped) break;",
        swapped
          ? "This pass changed the array; continue with a shorter suffix."
          : "No swaps: the entire array is sorted, so stop early.",
        state({ end, swapped }),
      );
      if (!swapped) break;
    }
  return t.finish(
    values,
    `int a[]={${initial}}; sort(a,5); int want[]={${[...initial].sort((a, b) => a - b)}}; assert(memcmp(a,want,sizeof(a))==0); sort(a,0);`,
  );
}

export function mergeTrace() {
  const values = [6, 2, 5, 1];
  const code = `void merge_sort(int *a, int lo, int hi, int *tmp) {
  if (hi - lo <= 1) return;
  int mid = lo + (hi-lo)/2;
  merge_sort(a, lo, mid, tmp);
  merge_sort(a, mid, hi, tmp);
  int i = lo, j = mid, used = lo;
  while (i < mid || j < hi) {
    if (j == hi || (i < mid && a[i] <= a[j])) tmp[used++] = a[i++];
    else tmp[used++] = a[j++];
  }
  for (int k = lo; k < hi; k++) a[k] = tmp[k];
}`;
  const t = traceRecorder(code),
    tmp = Array(4).fill("—"),
    calls = [];
  const state = (variables = {}) => ({
    arrays: [
      array("array", values),
      array("temporary buffer", tmp),
      array("call stack", calls),
    ],
    variables,
  });
  function visit(lo, hi) {
    calls.push(`[${lo}, ${hi})`);
    t.record(
      "if (hi - lo <= 1) return;",
      "Ranges are half-open. A range with fewer than two values is already sorted.",
      state({ lo, hi }),
    );
    if (hi - lo > 1) {
      const mid = lo + Math.floor((hi - lo) / 2);
      t.record(
        "int mid = lo + (hi-lo)/2;",
        "Split before merging. Each child must finish before its parent can combine the results.",
        state({ lo, mid, hi }),
      );
      visit(lo, mid);
      visit(mid, hi);
      let i = lo,
        j = mid,
        used = lo;
      while (i < mid || j < hi) {
        const left = j === hi || (i < mid && values[i] <= values[j]);
        tmp[used++] = left ? values[i++] : values[j++];
        t.record(
          left
            ? "if (j == hi || (i < mid && a[i] <= a[j])) tmp[used++] = a[i++];"
            : "else tmp[used++] = a[j++];",
          "Take the smaller front value. Taking left on a tie makes this merge stable.",
          state({ lo, mid, hi, i, j, used }),
        );
      }
      for (let k = lo; k < hi; k++) values[k] = tmp[k];
      t.record(
        "for (int k = lo; k < hi; k++) a[k] = tmp[k];",
        "Copy the merged range back; values outside this range are untouched.",
        state({ lo, hi }),
      );
    }
    calls.pop();
  }
  visit(0, 4);
  t.record(
    "",
    "Every merge has returned. The temporary buffer uses O(n) space; the recursive call stack uses O(log n).",
    state(),
  );
  return t.finish(
    values,
    "int a[]={6,2,5,1},tmp[4]; merge_sort(a,0,4,tmp); for(int i=0;i<4;i++)assert((a[i]==(int[]){1,2,5,6}[i]));",
  );
}

export function partitionTrace(equal = false) {
  const values = equal ? [3, 3, 3, 3] : [4, 2, 7, 1, 5],
    initial = [...values];
  const code = `int partition(int *a, int lo, int hi) {
  int pivot = a[hi], boundary = lo;
  for (int j = lo; j < hi; j++) {
    if (a[j] <= pivot) {
      int temp = a[boundary]; a[boundary] = a[j]; a[j] = temp;
      boundary++;
    }
  }
  int temp = a[boundary]; a[boundary] = a[hi]; a[hi] = temp;
  return boundary;
}`;
  const t = traceRecorder(code);
  let boundary = 0;
  const pivot = values.at(-1),
    hi = values.length - 1,
    state = (j) => ({
      arrays: [array("partition", values, [j, boundary, hi])],
      variables: { j, boundary, pivot, hi },
    });
  t.record(
    "int pivot = a[hi], boundary = lo;",
    "This is one Lomuto partition, not a complete quicksort. Before boundary: values <= pivot. Between boundary and j: values > pivot.",
    state(-1),
  );
  for (let j = 0; j < hi; j++) {
    t.record(
      "if (a[j] <= pivot) {",
      "Inspect the next value before moving the boundary.",
      state(j),
    );
    if (values[j] <= pivot) {
      [values[j], values[boundary]] = [values[boundary], values[j]];
      t.record(
        "int temp = a[boundary]; a[boundary] = a[j]; a[j] = temp;",
        "Move this value into the <= region.",
        state(j),
      );
      boundary++;
      t.record("boundary++;", "Extend the region by one.", state(j));
    }
  }
  [values[boundary], values[hi]] = [values[hi], values[boundary]];
  t.record(
    "int temp = a[boundary]; a[boundary] = a[hi]; a[hi] = temp;",
    equal
      ? "All equal keys go left in this version. Repeated partitions would produce quadratic quicksort work."
      : "Place the pivot at its final index. Each side still needs sorting.",
    state(hi),
  );
  return t.finish(
    { values, pivotIndex: boundary },
    `int a[]={${initial}}; int p=partition(a,0,${hi}); assert(p==${boundary}); for(int i=0;i<p;i++)assert(a[i]<=a[p]); for(int i=p+1;i<=${hi};i++)assert(a[i]>a[p]);`,
  );
}

export function binarySearchTrace(missing = false) {
  const values = [2, 5, 9, 14, 20, 26, 31],
    target = missing ? 15 : 20;
  const code = `int search(const int *a, int n, int target) {
  int lo = 0, hi = n - 1;
  while (lo <= hi) {
    int mid = lo + (hi-lo)/2;
    if (a[mid] == target) return mid;
    if (a[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`;
  const t = traceRecorder(code);
  let lo = 0,
    hi = 6,
    result = -1;
  const state = (mid) => ({
    arrays: [array("sorted array", values, [mid])],
    variables: { lo, hi, mid, target },
  });
  t.record(
    "int lo = 0, hi = n - 1;",
    "If target exists, it lies in the inclusive range [lo, hi]. The array must be sorted.",
    state(-1),
  );
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    t.record(
      "int mid = lo + (hi-lo)/2;",
      "Choose the midpoint without adding lo and hi directly.",
      state(mid),
    );
    if (values[mid] === target) {
      result = mid;
      t.record(
        "if (a[mid] == target) return mid;",
        "Return the matching index. With duplicates this does not promise the first match.",
        state(mid),
      );
      break;
    }
    if (values[mid] < target) {
      lo = mid + 1;
      t.record(
        "if (a[mid] < target) lo = mid + 1;",
        "Discard midpoint and all smaller values.",
        state(mid),
      );
    } else {
      hi = mid - 1;
      t.record(
        "else hi = mid - 1;",
        "Discard midpoint and all larger values.",
        state(mid),
      );
    }
  }
  if (result === -1)
    t.record(
      "return -1;",
      "The range is empty: target is absent. Never read a[lo] after this point without checking bounds.",
      state(-1),
    );
  return t.finish(
    result,
    `int a[]={${values}};assert(search(a,7,${target})==${result});assert(search(a,0,1)==-1);`,
  );
}
