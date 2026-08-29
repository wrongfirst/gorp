# C++ Language Runtime for Codebook

This module implements C++ language execution, syntax highlighting, and live linting in Codebook using WebAssembly.

## Architecture

1. **Compilation (`@yowasp/clang` - `clang++`)**:
   - Compiles C++ code targeting `-std=c++20` and `wasm32-wasi` with bundled `libc++` directly in the Web Worker.
   - Precompiles standard headers and the harness into a Precompiled Header (`harness.pch`) during worker warmup to ensure low compilation latency.
2. **Execution (`@bjorn3/browser_wasi_shim`)**:
   - Executes the generated WebAssembly binary in the worker with standard WASI preview1 streams (piping `stdout` and `stderr` back to the Codebook UI).
3. **Linting & Diagnostics**:
   - Live compiler diagnostics are gathered via `clang++ -std=c++20 -fsyntax-only` and mapped to CodeMirror markers.

## Harness Data Structures & Testing API

- **`ListNode`**: `{ int val; ListNode *next; ListNode(int x = 0, ListNode *n = nullptr); }`
- **`TreeNode`**: `{ int val; TreeNode *left; TreeNode *right; TreeNode(int x = 0, ...); }`
- **`Node`**: `{ int val; std::vector<Node*> neighbors; Node(int _val = 0, ...); }`
- **`Interval`**: `{ int start; int end; Interval(int s = 0, int e = 0); }`

### Helper Functions

- **Linked Lists**:
  - `list_to_linked_list(const std::vector<int>& arr)`
  - `linked_list_to_list(const ListNode* head)` (cycle-safe)
  - `make_cycle(const std::vector<int>& arr, int pos)`
- **Binary Trees**:
  - `list_to_tree(const std::vector<std::optional<int>>& arr)`
  - `ints_to_tree(const std::vector<int>& arr)`
  - `tree_to_list(const TreeNode* root)`
  - `tree_to_ints(const TreeNode* root)`
- **Graphs**:
  - `build_graph(const std::vector<std::vector<int>>& adj)`
  - `graph_to_adj(Node* node)`
- **Sorting & Normalization**:
  - `sort_ints(std::vector<int> arr)`
  - `sort_strings(std::vector<std::string> arr)`
  - `normalize_nested(std::vector<std::vector<T>> groups)`

### Test Assertions

- `Tests.bool_check(msg, condition)`: Asserts boolean condition is true.
- `Tests.equal_check(msg, expected, actual)`: Asserts deep/structural equality (supports primitives, floating-point with epsilon, strings, vectors, nested vectors, pairs, maps, sets, `ListNode*`, `TreeNode*`, etc.).
- `Tests.unordered_equal_check(msg, expected, actual)`: Asserts equality after sorting/normalizing (supports both 1D `std::vector<T>` and 2D `std::vector<std::vector<T>>`).
