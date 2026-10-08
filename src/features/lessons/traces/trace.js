export function traceRecorder(code) {
  const frames = [];
  function record(statement, explanation, state) {
    const line = statement
      ? code.split("\n").findIndex((text) => text.trim() === statement.trim()) +
        1
      : 0;
    if (statement && line === 0)
      throw new Error(`Statement missing from C example: ${statement}`);
    frames.push({ line, explanation, ...structuredClone(state) });
  }
  return {
    record,
    finish: (result, testCode) => ({ code, frames, result, testCode }),
  };
}

export function array(label, values, active = []) {
  return { label, values: [...values], active: [...active] };
}

export function treeNodes(root) {
  if (!root) return [];
  return [
    {
      id: root.id ?? String(root.value),
      value: root.value,
      left: root.left ? (root.left.id ?? String(root.left.value)) : null,
      right: root.right ? (root.right.id ?? String(root.right.value)) : null,
      height: root.height,
    },
    ...treeNodes(root.left),
    ...treeNodes(root.right),
  ];
}
