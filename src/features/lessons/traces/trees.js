import { array, traceRecorder, treeNodes } from "./trace.js";
const type = `typedef struct Tree { int value; struct Tree *left, *right; } Tree;`;
const node = (value, left = null, right = null) => ({
  id: String(value),
  value,
  left,
  right,
});
const sample = () =>
  node(8, node(3, node(1), node(6)), node(12, null, node(14)));
const fixture =
  "Tree a={1,NULL,NULL},b={6,NULL,NULL},c={3,&a,&b},d={14,NULL,NULL},e={12,NULL,&d},root={8,&c,&e};";

export function traversalTrace(order = "inorder") {
  const positions = { preorder: 0, inorder: 1, postorder: 2 },
    lines = ["visit(root->left, out, used);", "visit(root->right, out, used);"];
  lines.splice(positions[order], 0, "out[(*used)++] = root->value;");
  const code = `${type}
void visit(const Tree *root, int *out, int *used) {
  if (root == NULL) return;
  ${lines.join("\n  ")}
}`;
  const t = traceRecorder(code),
    root = sample(),
    calls = [],
    output = [];
  const state = (current) => ({
    tree: treeNodes(root),
    current: String(current?.value ?? ""),
    arrays: [array("call stack", calls), array("output", output)],
  });
  function visit(n) {
    calls.push(n?.value ?? "NULL");
    t.record(
      "if (root == NULL) return;",
      n
        ? "This call owns one subtree. Its local root is not necessarily the whole tree root."
        : "NULL is the base case; return without dereferencing.",
      state(n),
    );
    if (n)
      for (const line of lines) {
        if (line.startsWith("out")) {
          output.push(n.value);
          t.record(
            line,
            `${order}: emit this node ${order === "preorder" ? "before both children" : order === "inorder" ? "between the children" : "after both children"}.`,
            state(n),
          );
        } else {
          t.record(
            line,
            "Suspend this call while the child is visited.",
            state(n),
          );
          visit(line.includes("left") ? n.left : n.right);
        }
      }
    calls.pop();
  }
  visit(root);
  t.record(
    "",
    "All calls have returned. Each live node was emitted once.",
    state(null),
  );
  return t.finish(
    output,
    `${fixture} int out[6],used=0; visit(&root,out,&used); int want[]={${output}};assert(used==6);assert(memcmp(out,want,sizeof(out))==0);`,
  );
}

export function treeHeightTrace() {
  const code = `${type}
int height(const Tree *root) {
  if (root == NULL) return -1;
  int left = height(root->left);
  int right = height(root->right);
  return 1 + (left > right ? left : right);
}`;
  const t = traceRecorder(code),
    root = sample(),
    calls = [];
  const state = (n, variables = {}) => ({
    tree: treeNodes(root),
    current: String(n?.value ?? ""),
    arrays: [array("call stack", calls)],
    variables,
  });
  function height(n) {
    calls.push(n?.value ?? "NULL");
    t.record(
      "if (root == NULL) return -1;",
      "Height is measured in edges here: an empty tree is -1 and a leaf is 0. State the convention before calculating.",
      state(n),
    );
    if (!n) {
      calls.pop();
      return -1;
    }
    const left = height(n.left);
    t.record(
      "int left = height(root->left);",
      "The left recursive call has returned; its value belongs to this frame.",
      state(n, { left }),
    );
    const right = height(n.right),
      result = 1 + Math.max(left, right);
    t.record(
      "int right = height(root->right);",
      "Both child heights are now available.",
      state(n, { left, right }),
    );
    t.record(
      "return 1 + (left > right ? left : right);",
      "Use the longer child path and add the edge through this node.",
      state(n, { left, right, return: result }),
    );
    calls.pop();
    return result;
  }
  const result = height(root);
  return t.finish(
    result,
    `${fixture}assert(height(&root)==2);assert(height(NULL)==-1);`,
  );
}

export function bstDeleteTrace(kind = "two children") {
  const code = `${type}
Tree *erase(Tree *root, int key) {
  if (!root) return NULL;
  if (key < root->value) root->left = erase(root->left, key);
  else if (key > root->value) root->right = erase(root->right, key);
  else {
    if (!root->left || !root->right) {
      Tree *child = root->left ? root->left : root->right;
      free(root);
      return child;
    }
    Tree *successor = root->right;
    while (successor->left) successor = successor->left;
    root->value = successor->value;
    root->right = erase(root->right, successor->value);
  }
  return root;
}`;
  const t = traceRecorder(code);
  let root = sample();
  const key = kind === "leaf" ? 1 : kind === "one child" ? 12 : 8;
  const state = (variables = {}) => ({ tree: treeNodes(root), variables });
  t.record(
    "",
    "Every left subtree value must be smaller and every right subtree value larger, not just the immediate children.",
    state({ key }),
  );
  function erase(n, target) {
    if (!n) return null;
    if (target < n.value) {
      n.left = erase(n.left, target);
      t.record(
        "if (key < root->value) root->left = erase(root->left, key);",
        "Attach the returned subtree root. Ignoring this return loses a structural change.",
        state({ key: target, root: n.value }),
      );
    } else if (target > n.value) {
      n.right = erase(n.right, target);
      t.record(
        "else if (key > root->value) root->right = erase(root->right, key);",
        "Reconnect the right subtree after deletion.",
        state({ key: target, root: n.value }),
      );
    } else if (!n.left || !n.right) {
      const child = n.left ?? n.right;
      t.record(
        "Tree *child = root->left ? root->left : root->right;",
        "Save the only child (or NULL for a leaf) before freeing the node.",
        state({ root: n.value, child: child?.value ?? "NULL" }),
      );
      t.record(
        "free(root);",
        "Release this allocation. The next frame shows the caller replacing its old link; it must not dereference the freed node.",
        { ...state({ released: n.value }), released: String(n.value) },
      );
      return child;
    } else {
      let successor = n.right;
      while (successor.left) successor = successor.left;
      t.record(
        "while (successor->left) successor = successor->left;",
        "The right subtree minimum is the inorder successor. It cannot have a left child.",
        state({ root: n.value, successor: successor.value }),
      );
      const replacement = successor.value;
      n.value = replacement;
      t.record(
        "root->value = successor->value;",
        "Copy the successor key before freeing its allocation. The duplicate key is temporary; node identities remain distinct.",
        state({ key: target, replacement }),
      );
      n.right = erase(n.right, replacement);
      t.record(
        "root->right = erase(root->right, successor->value);",
        "Remove the original successor and reconnect the right subtree.",
        state({ replacement }),
      );
    }
    return n;
  }
  root = erase(root, key);
  t.record(
    "return root;",
    "The caller receives the new root. Inorder traversal still produces ascending keys.",
    state(),
  );
  const result = treeNodes(root)
    .map((n) => n.value)
    .sort((a, b) => a - b);
  const alloc =
    "Tree *a=malloc(sizeof(*a)),*b=malloc(sizeof(*b)),*c=malloc(sizeof(*c)),*d=malloc(sizeof(*d)),*e=malloc(sizeof(*e)),*root=malloc(sizeof(*root));assert(a&&b&&c&&d&&e&&root);*a=(Tree){1,NULL,NULL};*b=(Tree){6,NULL,NULL};*c=(Tree){3,a,b};*d=(Tree){14,NULL,NULL};*e=(Tree){12,NULL,d};*root=(Tree){8,c,e};";
  return t.finish(
    result,
    `${alloc}root=erase(root,${key}); assert(root && root->value==${key === 8 ? 12 : 8}); root=erase(root,999); int keys[]={${result}};for(size_t i=0;i<sizeof(keys)/sizeof(keys[0]);i++)root=erase(root,keys[i]);assert(root==NULL);`,
  );
}

export function freeTreeTrace() {
  const code = `${type}
void release(Tree *root) {
  if (!root) return;
  release(root->left);
  release(root->right);
  free(root);
}`;
  const t = traceRecorder(code),
    root = sample(),
    live = new Set(treeNodes(root).map((n) => n.id)),
    freed = [];
  function visit(n) {
    if (!n) return;
    visit(n.left);
    visit(n.right);
    live.delete(String(n.value));
    freed.push(n.value);
    t.record(
      "free(root);",
      "Free children before their parent. Freeing the parent first would invalidate the links needed to reach its children.",
      {
        tree: treeNodes(root),
        releasedIds: treeNodes(root)
          .filter((n) => !live.has(n.id))
          .map((n) => n.id),
        arrays: [array("free order", freed)],
        variables: { live: live.size },
      },
    );
  }
  t.record("", "Each node is a separate heap allocation in this example.", {
    tree: treeNodes(root),
    variables: { live: live.size },
  });
  visit(root);
  return t.finish(
    freed,
    "Tree *a=malloc(sizeof(*a)),*b=malloc(sizeof(*b));assert(a&&b);*a=(Tree){1,NULL,NULL};*b=(Tree){2,a,NULL};release(b);release(NULL);",
  );
}

const avlCode = `typedef struct AVL { int value, height; struct AVL *left, *right; } AVL;
int h(const AVL *n) { return n ? n->height : 0; }
void update(AVL *n) { int l=h(n->left),r=h(n->right); n->height=1+(l>r?l:r); }
AVL *rotate_right(AVL *root) {
  AVL *pivot = root->left;
  root->left = pivot->right;
  pivot->right = root;
  update(root); update(pivot);
  return pivot;
}
AVL *rotate_left(AVL *root) {
  AVL *pivot = root->right;
  root->right = pivot->left;
  pivot->left = root;
  update(root); update(pivot);
  return pivot;
}
AVL *balance(AVL *root) {
  update(root);
  int factor = h(root->left) - h(root->right);
  if (factor > 1) {
    if (h(root->left->left) < h(root->left->right)) root->left = rotate_left(root->left);
    return rotate_right(root);
  }
  if (factor < -1) {
    if (h(root->right->right) < h(root->right->left)) root->right = rotate_right(root->right);
    return rotate_left(root);
  }
  return root;
}`;
export function avlTrace(kind = "LL") {
  const shapes = {
    LL: node(30, node(20, node(10))),
    RR: node(10, null, node(20, null, node(30))),
    LR: node(30, node(10, null, node(20))),
    RL: node(10, null, node(30, node(20))),
    deletion: node(30, node(20, node(10), node(25)), node(40)),
  };
  let root = shapes[kind];
  const t = traceRecorder(avlCode);
  const height = (n) => (n ? 1 + Math.max(height(n.left), height(n.right)) : 0);
  function update(n) {
    if (!n) return;
    update(n.left);
    update(n.right);
    n.height = height(n);
  }
  const state = () => {
    update(root);
    return {
      tree: treeNodes(root),
      variables: {
        balance: height(root.left) - height(root.right),
        height: height(root),
      },
    };
  };
  t.record(
    "",
    kind === "deletion"
      ? "The right leaf 40 will be deleted. Deletion can reduce subtree height; unlike insertion, rebalancing may continue through several ancestors."
      : "These are the three keys after insertion, before rebalancing. Height uses nodes: NULL = 0, leaf = 1.",
    state(),
  );
  if (kind === "deletion") {
    root.right = null;
    t.record(
      "int factor = h(root->left) - h(root->right);",
      "After removing 40, the root has balance +2. Its left child has balance 0: use a single right rotation.",
      state(),
    );
  }
  function right(n) {
    const pivot = n.left;
    n.left = pivot.right;
    pivot.right = n;
    return pivot;
  }
  function left(n) {
    const pivot = n.right;
    n.right = pivot.left;
    pivot.left = n;
    return pivot;
  }
  if (kind === "LR") {
    root.left = left(root.left);
    t.record(
      "if (h(root->left->left) < h(root->left->right)) root->left = rotate_left(root->left);",
      "First rotate the left child left to turn the bend into an LL case.",
      state(),
    );
  }
  if (kind === "RL") {
    root.right = right(root.right);
    t.record(
      "if (h(root->right->right) < h(root->right->left)) root->right = rotate_right(root->right);",
      "First rotate the right child right to turn the bend into an RR case.",
      state(),
    );
  }
  const r = ["LL", "LR", "deletion"].includes(kind);
  root = r ? right(root) : left(root);
  t.record(
    r ? "return rotate_right(root);" : "return rotate_left(root);",
    "Move the middle key up. The transfer subtree stays between the two keys, so inorder order is unchanged. Update the old root before the new root.",
    state(),
  );
  const result = root.value;
  const fixtureByKind = {
    LL: "AVL a={10,1,NULL,NULL},b={20,2,&a,NULL},c={30,3,&b,NULL};",
    RR: "AVL a={30,1,NULL,NULL},b={20,2,NULL,&a},c={10,3,NULL,&b};",
    LR: "AVL a={20,1,NULL,NULL},b={10,2,NULL,&a},c={30,3,&b,NULL};",
    RL: "AVL a={20,1,NULL,NULL},b={30,2,&a,NULL},c={10,3,NULL,&b};",
    deletion:
      "AVL a={10,1,NULL,NULL},b={25,1,NULL,NULL},d={20,2,&a,&b},c={30,3,&d,NULL};",
  };
  return t.finish(
    result,
    `${fixtureByKind[kind]} AVL *root=balance(&c);assert(root->value==20);assert(abs(h(root->left)-h(root->right))<=1);`,
  );
}

export function treeSumTrace() {
  const code = `${type}
int sum(const Tree *root) {
  if (!root) return 0;
  int left = sum(root->left);
  int right = sum(root->right);
  return root->value + left + right;
}`;
  const t = traceRecorder(code),
    root = sample(),
    calls = [];
  const state = (current, variables = {}) => ({
    tree: treeNodes(root),
    current: current?.id ?? "",
    arrays: [array("call stack", calls)],
    variables,
  });
  function sum(n) {
    calls.push(n?.value ?? "NULL");
    t.record(
      "if (!root) return 0;",
      "Zero is the identity for addition: an empty subtree contributes nothing.",
      state(n),
    );
    if (!n) {
      calls.pop();
      return 0;
    }
    const left = sum(n.left);
    t.record(
      "int left = sum(root->left);",
      "Store the complete left-subtree sum in this caller’s local variable.",
      state(n, { left }),
    );
    const right = sum(n.right);
    t.record(
      "int right = sum(root->right);",
      "The right child has also returned. Each node contributes once.",
      state(n, { left, right }),
    );
    const result = n.value + left + right;
    t.record(
      "return root->value + left + right;",
      "Combine the two subtree results with this node’s value.",
      state(n, { left, right, return: result }),
    );
    calls.pop();
    return result;
  }
  const result = sum(root);
  return t.finish(
    result,
    `${fixture}assert(sum(&root)==44);assert(sum(NULL)==0);`,
  );
}
