# Language Test Harness Specification

Each language module requires a `harness.<ext>` file providing common data structures, helper functions, and test assertion utilities.

---

## 1. Data Structures

| Type | Python | Go | TypeScript | OCaml |
| :--- | :--- | :--- | :--- | :--- |
| **Linked List Node** | `ListNode(val=0, next=None)` | `type ListNode struct { Val int; Next *ListNode }` | `class ListNode { val: number; next: ListNode \| null }` | `type list_node = { mutable val_ : int; mutable next : list_node option }` |
| **Binary Tree Node** | `TreeNode(val=0, left=None, right=None)` | `type TreeNode struct { Val int; Left *TreeNode; Right *TreeNode }` | `class TreeNode { val: number; left: TreeNode \| null; right: TreeNode \| null }` | `type tree_node = { mutable val_ : int; mutable left : tree_node option; mutable right : tree_node option }` |
| **Graph Node** | `Node(val=0, neighbors=None)` | `type Node struct { Val int; Neighbors []*Node }` | `class Node { val: number; neighbors: Node[] }` | `type graph_node = { mutable val_ : int; mutable neighbors : graph_node list }` |
| **Interval** | `Interval(start=0, end=0)` | `type Interval struct { Start int; End int }` | `class Interval { start: number; end: number }` | `type interval = { start : int; end_ : int }` |

---

## 2. Helper Functions

### Linked Lists
- **`list_to_linked_list(arr)`**: Converts array of ints to linked list.
- **`linked_list_to_list(head)`**: Converts linked list to array of ints (must handle cycles safely).
- **`make_cycle(arr, pos)`**: Builds list and connects tail to index `pos` (`-1` for no cycle).

### Binary Trees
- **`list_to_tree(arr)`**: Converts level-order nullable array to tree.
- **`tree_to_list(root)`**: Converts tree to level-order nullable array (trims trailing nulls).
- **`ints_to_tree(arr)`**: Convenience builder for non-null integer arrays.
- **`tree_to_ints(root)`**: Extracts non-null integer values from tree.

### Graphs
- **`build_graph(adj)`**: Converts 1-indexed adjacency list `int[][]` to `Node`.
- **`graph_to_adj(node)`**: Converts `Node` to 1-indexed adjacency list `int[][]`.

### Sorting & Normalization
- **`normalize_nested(groups)`**: Sorts each inner list, then sorts outer list.
- **`sort_strings(arr)`**: Returns sorted string list.
- **`sort_ints(arr)`**: Returns sorted int list.

---

## 3. Test Assertion API (`Tests`)

Each harness must expose a `Tests` object/module with three methods:

| Method | Behavior | Success Output | Failure Output |
| :--- | :--- | :--- | :--- |
| **`bool_check(msg, b)`** | Asserts `b == true` | `Test passed: <msg>` | `Test failed: <msg>` |
| **`equal_check(msg, exp, act)`** | Asserts deep equality | `Test passed: <msg>` | `Test failed: <msg>`<br>`Expected: <exp>`<br>`Actual:   <act>` |
| **`unordered_equal_check(msg, exp, act)`** | Asserts equality after `normalize_nested` | `Test passed: <msg>` | `Test failed: <msg>`<br>`Expected: <exp>`<br>`Actual:   <act>` |

*Failure behavior*: Must abort execution immediately (raise exception / exit non-zero).

---

## 4. Worker Integration

1. **Runtime Execution**: Harness code is prepended to user code and test code.
2. **Type Checking & Linting**: Harness definitions must be included in type-checker contexts with line offsets applied to compiler diagnostics so error locations map back to user code.
