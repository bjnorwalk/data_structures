# Study guide

Start with a topic you have already seen in class. Before pressing Next, write
down which pointer, slot, or local variable you expect to change. Compare your
answer with the next frame. If it differs, go back and trace that statement by
hand. After the example, try a released question without opening its solution.

## Coverage

The published UCF outline groups the exam into dynamic memory/data structures,
advanced data structures, analysis, and algorithms. The app organizes those
subjects into shorter lessons:

| Outline area      | Guided examples                                                         | What to watch                                                    |
| ----------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Dynamic memory    | aliases, shallow copies, nested ownership, separate rows, realloc       | addresses versus values, allocation lifetime, cleanup order      |
| Linked lists      | front insert/delete, reversal, doubly linked insertion                  | saved successor, returned head, forward/backward agreement       |
| Stacks and queues | postfix conversion/evaluation, circular queue, linked last-node removal | operand order, full/empty state, endpoint repair                 |
| Binary trees      | three traversals, height, subtree sum, BST deletion, cleanup            | local roots, recursive returns, global ordering                  |
| Heaps             | insertion, deletion, bottom-up construction                             | complete shape, index mapping, repair path                       |
| Hashing           | linear/quadratic probing, tombstone, chaining                           | identical probe sequences, collision chains, absence conditions  |
| AVL trees         | LL/RR/LR/RL rotations and a deletion repair                             | transfer subtree, height convention, preserved inorder order     |
| Tries             | shared prefixes, terminal markers, missing edge                         | a prefix is not automatically a stored word                      |
| Recursion         | factorial returns, Hanoi, permutations, flood fill                      | suspended calls, changing parameter roles, restore/visited steps |
| Searching/sorting | binary search, insertion, selection, bubble, merge, quicksort partition | interval progress, sorted region, merge order, pivot boundary    |
| Analysis          | exact loop counts, recursion-level work, timing ratio                   | bounds, base cases, assumptions behind a cost model              |
| Representation    | repeated division, bitwise set operations                               | digit order, masks, unsigned shifts                              |

The Sandbox adds arbitrary small-input insertion/search for the unbalanced BST
and push/pop/enqueue/dequeue operations for the original linear structures.

## Limits worth keeping in mind

- The guided traces use selected inputs, not arbitrary programs. They do not
  simulate machine addresses, object padding, undefined behavior, or an allocator.
- Allocation examples check success before use. They are teaching examples,
  not a general allocation-error recovery policy. No trace intentionally
  dereferences freed storage. A freed block remains on screen as a historical
  label, not as readable live memory.
- Separate-row `int **` storage is not the same representation as one contiguous
  C matrix. Sizes use `sizeof`; displayed labels do not assume an `int` or pointer width.
- Reallocation shows a possible moving success and a simulated failure. The C
  tests check preservation of values on success and of ownership on forced failure.
- AVL examples show local repair after an insertion or deletion. They are not
  full interactive AVL insertion/deletion implementations. Deletion can require
  repairs at more than one ancestor; the small example shows one repair.
- The quicksort lesson traces a partition, not a complete recursive quicksort.
  Equal keys expose this partition scheme's poor split. Selection sort can be
  unstable; insertion, the shown bubble sort, and the merge take ties in a stable order.
- The expression examples accept valid expressions with single-digit operands.
  The postfix evaluator demonstrates subtraction and multiplication. It is not
  a parser with validation for arbitrary expressions or multi-digit values.
- Trie input is lowercase a–z. Hash keys are nonnegative and do not use the
  reserved sentinel values. Heap insertion assumes spare capacity; deletion
  assumes a nonempty heap. The lesson presets meet these preconditions.
- Complexity statements refer to the specified implementation. Unbalanced BSTs
  are not guaranteed logarithmic. Hashing needs assumptions about distribution
  and load. Estimated timings are examples of algebra, not benchmark results.
- Summations and recurrence diagrams cover representative patterns. They do
  not cover every recurrence or coding problem that might appear on an exam.

## References

The scope was checked against these public UCF materials. Follow the current
course and exam guidance if it changes.

- [Foundation Exam outline](https://www.cs.ucf.edu/~dmarino/ucf/fndexam/FE-ExamOutline.pdf)
- [Exam archive and preparation guidance](https://www.cs.ucf.edu/registration/exm/)
- [Formula sheet](https://www.cs.ucf.edu/~dmarino/ucf/fndexam/FormulaSheet-2017.pdf)
- [Arup Guha's CS1 course materials](https://www.cs.ucf.edu/courses/cop3502/sum2020/)
- [Arup Guha's teaching page](https://www.cs.ucf.edu/~dmarino/ucf/index.html)
- [Algorithm Viewer linked from that page](https://algorithmvisionknights-v3.web.app/)

Recent released [January](https://www.cs.ucf.edu/registration/exm/spr2026/FE-Jan26-Sol.pdf),
[May](https://www.cs.ucf.edu/registration/exm/sum2026/FE-May26-Sol.pdf), and
[August 2026 solutions](https://www.cs.ucf.edu/registration/exm/fall2026/FE-Aug26-Sol.pdf)
helped identify where tracing intermediate state is useful. No questions,
solutions, or third-party source code are reproduced here. This project is not
an official UCF resource.

Graph search, shortest paths, union-find, and dynamic programming are possible
later additions. They should follow a review of the core lessons rather than
making this first study path harder to navigate.
