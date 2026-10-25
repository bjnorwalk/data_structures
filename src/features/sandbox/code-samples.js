export const codeSamples = {
  linkedList: `typedef struct node {
  int data;
  struct node *next;
} node;

node* insertTail(node *head, int value) {
  node *newNode = malloc(sizeof(node));
  newNode->data = value;
  newNode->next = NULL;

  if (head == NULL) return newNode;

  node *cur = head;
  while (cur->next != NULL) {
    cur = cur->next;
  }

  cur->next = newNode;
  return head;
}

void traverse(node *head) {
  node *cur = head;
  while (cur != NULL) {
    printf("%d ", cur->data);
    cur = cur->next;
  }
}`,

  stack: `#define MAX 100

typedef struct {
  int data[MAX];
  int top;
} Stack;

void init(Stack *s) {
  s->top = -1;
}

void push(Stack *s, int value) {
  if (s->top == MAX - 1) return;
  s->data[++s->top] = value;
}

int pop(Stack *s) {
  if (s->top == -1) return -1;
  return s->data[s->top--];
}`,

  queue: `typedef struct node {
  int data;
  struct node *next;
} node;

typedef struct {
  node *front;
  node *back;
} Queue;

void enqueue(Queue *q, int value) {
  node *n = malloc(sizeof(node));
  n->data = value;
  n->next = NULL;

  if (q->back == NULL) {
    q->front = q->back = n;
    return;
  }

  q->back->next = n;
  q->back = n;
}

int dequeue(Queue *q) {
  if (q->front == NULL) return -1;

  node *temp = q->front;
  int value = temp->data;
  q->front = q->front->next;

  if (q->front == NULL) q->back = NULL;
  free(temp);
  return value;
}`,

  bst: `typedef struct treeNode {
  int data;
  struct treeNode *left;
  struct treeNode *right;
} treeNode;

treeNode* insert(treeNode *root, int value) {
  if (root == NULL) {
    treeNode *n = malloc(sizeof(treeNode));
    n->data = value;
    n->left = n->right = NULL;
    return n;
  }

  if (value < root->data)
    root->left = insert(root->left, value);
  else
    root->right = insert(root->right, value);

  return root;
}

int search(treeNode *root, int value) {
  if (root == NULL) return 0;
  if (root->data == value) return 1;

  if (value < root->data)
    return search(root->left, value);
  else
    return search(root->right, value);
}`,

  sorting: `void bubbleSort(int arr[], int n) {
  for (int i = 0; i < n - 1; i++) {
    for (int j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        int temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
}`,

  recursion: `int factorial(int n) {
  if (n == 0) {
    return 1;
  }

  return n * factorial(n - 1);
}

/*
factorial(4)
= 4 * factorial(3)
= 4 * 3 * factorial(2)
= 4 * 3 * 2 * factorial(1)
= 4 * 3 * 2 * 1 * factorial(0)
= 4 * 3 * 2 * 1 * 1
= 24
*/`,
};
