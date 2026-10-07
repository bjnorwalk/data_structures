import { array, traceRecorder } from "./trace.js";

const nodeType = `typedef struct Node { int value; struct Node *next; } Node;`;
const nodeFixture = "Node c={9,NULL}, b={6,&c}, a={2,&b};";

export function linkedTrace(operation = "reverse", empty = false) {
  const body = {
    reverse: `Node *reverse(Node *head) {
  Node *prev = NULL;
  Node *cur = head;
  while (cur != NULL) {
    Node *next = cur->next;
    cur->next = prev;
    prev = cur;
    cur = next;
  }
  return prev;
}`,
    insert: `Node *insert_front(Node *head, int value) {
  Node *node = malloc(sizeof *node);
  if (node == NULL) return head;
  node->value = value;
  node->next = head;
  return node;
}`,
    delete: `Node *delete_front(Node *head) {
  if (head == NULL) return NULL;
  Node *next = head->next;
  free(head);
  return next;
}`,
  }[operation];
  const t = traceRecorder(`${nodeType}\n${body}`);
  const memory = empty
    ? []
    : [2, 6, 9].map((v, i) => ({
        id: `N${i}`,
        label: `node ${v}`,
        live: true,
        fields: { value: v, next: i === 2 ? "NULL" : `N${i + 1}` },
      }));
  const state = { memory, variables: { head: empty ? "NULL" : "N0" } };
  t.record(
    "",
    "Each node is a separate object. The next field, not its position on screen, defines the order.",
    state,
  );
  if (operation === "reverse") {
    let prev = "NULL",
      cur = state.variables.head;
    state.variables.prev = prev;
    t.record("Node *prev = NULL;", "The reversed prefix starts empty.", state);
    state.variables.cur = cur;
    t.record(
      "Node *cur = head;",
      "cur starts at the first node of the unprocessed suffix.",
      state,
    );
    while (cur !== "NULL") {
      const node = memory.find((n) => n.id === cur),
        next = node.fields.next;
      state.variables.next = next;
      t.record(
        "Node *next = cur->next;",
        "Save the original next pointer before replacing the link. Otherwise the remaining list would become unreachable.",
        state,
      );
      node.fields.next = prev;
      t.record(
        "cur->next = prev;",
        "Reverse this link. The processed prefix grows by one node.",
        state,
      );
      prev = cur;
      state.variables.prev = prev;
      t.record(
        "prev = cur;",
        "Move prev to the new front of the reversed prefix.",
        state,
      );
      cur = next;
      state.variables.cur = cur;
      t.record(
        "cur = next;",
        "Move to the saved suffix. Every node remains reachable through prev or cur.",
        state,
      );
    }
    state.variables.return = prev;
    t.record(
      "return prev;",
      "The last original node is now the head. Empty input returns NULL without dereferencing it.",
      state,
    );
    return t.finish(
      empty ? [] : [9, 6, 2],
      `${nodeFixture} Node *h=reverse(&a); assert(h==&c && c.next==&b && b.next==&a && a.next==NULL); assert(reverse(NULL)==NULL);`,
    );
  }
  if (operation === "insert") {
    memory.push({
      id: "NEW",
      label: "node 5",
      live: true,
      fields: { value: "uninitialized", next: "uninitialized" },
    });
    state.variables.node = "NEW";
    t.record(
      "Node *node = malloc(sizeof *node);",
      "Allocate one node. If allocation fails, the function returns the unchanged head.",
      state,
    );
    memory.at(-1).fields.value = 5;
    t.record(
      "node->value = value;",
      "Store the payload separately from the link.",
      state,
    );
    memory.at(-1).fields.next = state.variables.head;
    t.record(
      "node->next = head;",
      "Link the new node to the old head before returning it. For an empty list this link is NULL.",
      state,
    );
    state.variables.return = "NEW";
    t.record(
      "return node;",
      "The caller must assign the returned pointer to head. Inserting at the front needs no traversal.",
      state,
    );
    return t.finish(
      empty ? [5] : [5, 2, 6, 9],
      `${nodeFixture} Node *h=insert_front(&a,5);assert(h && h->value==5 && h->next==&a);free(h); h=insert_front(NULL,5);assert(h && !h->next);free(h);`,
    );
  }
  if (empty) {
    state.variables.return = "NULL";
    t.record(
      "if (head == NULL) return NULL;",
      "Check NULL before head->next. There is no node to free.",
      state,
    );
  } else {
    state.variables.next = "N1";
    t.record(
      "Node *next = head->next;",
      "Save the new head while the original node is still alive.",
      state,
    );
    memory[0].live = false;
    t.record(
      "free(head);",
      "Release the removed node only. Reading head->next after this statement would be invalid.",
      state,
    );
    state.variables.return = "N1";
    t.record(
      "return next;",
      "Return the saved successor. The caller replaces its head pointer.",
      state,
    );
  }
  return t.finish(
    empty ? [] : [6, 9],
    "Node *h=malloc(sizeof *h);assert(h);h->value=2;h->next=NULL;assert(delete_front(h)==NULL);assert(delete_front(NULL)==NULL);",
  );
}

export function doublyTrace(empty = false) {
  const code = `typedef struct DNode { int value; struct DNode *prev, *next; } DNode;
DNode *push_front(DNode *head, int value) {
  DNode *node = malloc(sizeof *node);
  if (node == NULL) return head;
  node->value = value;
  node->prev = NULL;
  node->next = head;
  if (head != NULL) head->prev = node;
  return node;
}`;
  const t = traceRecorder(code),
    state = {
      memory: empty
        ? []
        : [
            {
              id: "OLD",
              label: "node 8",
              live: true,
              fields: { value: 8, prev: "NULL", next: "NULL" },
            },
          ],
      variables: { head: empty ? "NULL" : "OLD" },
    };
  state.memory.push({
    id: "NEW",
    label: "node 3",
    live: true,
    fields: {
      value: "uninitialized",
      prev: "uninitialized",
      next: "uninitialized",
    },
  });
  state.variables.node = "NEW";
  t.record(
    "DNode *node = malloc(sizeof *node);",
    "Allocate the new node and check for failure.",
    state,
  );
  for (const [field, value, line, why] of [
    ["value", 3, "node->value = value;", "Set the payload."],
    [
      "prev",
      "NULL",
      "node->prev = NULL;",
      "There is no predecessor before the new head.",
    ],
    [
      "next",
      state.variables.head,
      "node->next = head;",
      "Connect the forward link to the old head.",
    ],
  ]) {
    state.memory.at(-1).fields[field] = value;
    t.record(line, why, state);
  }
  if (!empty) {
    state.memory[0].fields.prev = "NEW";
    t.record(
      "if (head != NULL) head->prev = node;",
      "Repair the old head’s backward link as well. Do not dereference a NULL old head.",
      state,
    );
  }
  state.variables.return = "NEW";
  t.record(
    "return node;",
    "Both directions now agree. The caller replaces head with NEW.",
    state,
  );
  return t.finish(
    empty ? [3] : [3, 8],
    "DNode old={8,NULL,NULL};DNode *h=push_front(&old,3);assert(h && h->next==&old && old.prev==h && h->prev==NULL);free(h);h=push_front(NULL,3);assert(h && !h->next && !h->prev);free(h);",
  );
}

export function circularQueueTrace(drain = false) {
  const code = `typedef struct { int data[4]; int head, tail, count; } Queue;
int enqueue(Queue *q, int value) {
  if (q->count == 4) return 0;
  q->data[q->tail] = value;
  q->tail = (q->tail + 1) % 4;
  q->count++;
  return 1;
}
int dequeue(Queue *q, int *out) {
  if (q->count == 0) return 0;
  *out = q->data[q->head];
  q->head = (q->head + 1) % 4;
  q->count--;
  return 1;
}`;
  const t = traceRecorder(code),
    values = ["unused", "unused", "unused", "unused"],
    q = { head: 0, tail: 0, count: 0 },
    state = () => ({
      arrays: [array("queue · physical slots", values, [q.head, q.tail])],
      variables: { ...q },
    });
  t.record(
    "",
    "head is the next item to remove; tail is the next insertion slot. count distinguishes full from empty when head equals tail.",
    state(),
  );
  const ops = drain
    ? [["add", 7], ["remove"], ["remove"]]
    : [
        ["add", 1],
        ["add", 2],
        ["add", 3],
        ["remove"],
        ["add", 4],
        ["add", 5],
        ["add", 6],
      ];
  let out;
  for (const [op, v] of ops) {
    if (op === "add") {
      if (q.count === 4) {
        t.record(
          "if (q->count == 4) return 0;",
          "The queue is full. Reject this insertion without overwriting a live value.",
          state(),
        );
        continue;
      }
      values[q.tail] = v;
      t.record(
        "q->data[q->tail] = value;",
        `Write ${v} at the physical tail slot. Logical order still begins at head.`,
        state(),
      );
      q.tail = (q.tail + 1) % 4;
      t.record(
        "q->tail = (q->tail + 1) % 4;",
        "Advance tail modulo capacity; index 3 wraps to 0.",
        state(),
      );
      q.count++;
      t.record(
        "q->count++;",
        "One additional slot is logically occupied.",
        state(),
      );
    } else {
      if (!q.count) {
        t.record(
          "if (q->count == 0) return 0;",
          "Empty queue: do not read a stale slot.",
          state(),
        );
        continue;
      }
      out = values[q.head];
      t.record(
        "*out = q->data[q->head];",
        `Remove ${out}. Bytes may remain in the slot, but they are not live queue content after count changes.`,
        state(),
      );
      q.head = (q.head + 1) % 4;
      t.record(
        "q->head = (q->head + 1) % 4;",
        "Advance the logical front without shifting the array.",
        state(),
      );
      q.count--;
      t.record("q->count--;", "Decrease the occupied count.", state());
    }
  }
  return t.finish(
    { head: q.head, tail: q.tail, count: q.count },
    "Queue q={{0},0,0,0};int out;assert(!dequeue(&q,&out));for(int i=1;i<=4;i++)assert(enqueue(&q,i));assert(!enqueue(&q,5));assert(dequeue(&q,&out)&&out==1);assert(enqueue(&q,5));for(int i=2;i<=5;i++)assert(dequeue(&q,&out)&&out==i);assert(!dequeue(&q,&out));",
  );
}

export function linkedQueueTrace() {
  const code = `${nodeType}
int remove_front(Node **front, Node **back, int *out) {
  if (*front == NULL) return 0;
  Node *old = *front;
  *out = old->value;
  *front = old->next;
  if (*front == NULL) *back = NULL;
  free(old);
  return 1;
}`;
  const t = traceRecorder(code),
    state = {
      memory: [
        {
          id: "ONLY",
          label: "last queue node",
          live: true,
          fields: { value: 7, next: "NULL" },
        },
      ],
      variables: { front: "ONLY", back: "ONLY" },
    };
  t.record(
    "",
    "For a one-node queue both front and back reference the same allocation.",
    state,
  );
  state.variables.old = "ONLY";
  t.record(
    "Node *old = *front;",
    "Keep a pointer to the allocation that must be freed.",
    state,
  );
  state.variables.out = 7;
  t.record(
    "*out = old->value;",
    "Read the payload before releasing the node.",
    state,
  );
  state.variables.front = "NULL";
  t.record(
    "*front = old->next;",
    "The front becomes NULL because the node had no successor.",
    state,
  );
  state.variables.back = "NULL";
  t.record(
    "if (*front == NULL) *back = NULL;",
    "Clear back too. Leaving it pointing at the old node would create a dangling tail.",
    state,
  );
  state.memory[0].live = false;
  t.record(
    "free(old);",
    "No allocated nodes remain, and both queue endpoints are NULL.",
    state,
  );
  return t.finish(
    7,
    "Node *f=malloc(sizeof *f);assert(f);f->value=7;f->next=NULL;Node *b=f;int out;assert(remove_front(&f,&b,&out)&&out==7);assert(!f&&!b);assert(!remove_front(&f,&b,&out));",
  );
}
