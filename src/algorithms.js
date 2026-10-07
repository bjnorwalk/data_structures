export function buildBst(values) {
  if (!values.length) return null;
  const root = { value: values[0], left: null, right: null };
  for (const value of values.slice(1)) {
    let cur = root;
    while (true) {
      if (value < cur.value) {
        if (!cur.left) {
          cur.left = { value, left: null, right: null };
          break;
        }
        cur = cur.left;
      } else {
        if (!cur.right) {
          cur.right = { value, left: null, right: null };
          break;
        }
        cur = cur.right;
      }
    }
  }
  return root;
}

export function bubbleSortStep(values, index) {
  const next = [...values];
  if (index >= 0 && index < next.length - 1 && next[index] > next[index + 1]) {
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
  }
  return next;
}
