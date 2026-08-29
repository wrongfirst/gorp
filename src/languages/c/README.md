# C Language Runtime for Codebook

This module implements C language execution, syntax highlighting, and live linting in Codebook using WebAssembly.

## Architecture

1. **Compilation (`@yowasp/clang`)**:
   - Compiles C code (with standard C11/C17 `wasi-libc`) directly in the Web Worker into a `wasm32-wasi` WebAssembly module.
2. **Execution (`@bjorn3/browser_wasi_shim`)**:
   - Executes the resulting WebAssembly binary in the worker with standard WASI preview1 streams (piping `stdout` and `stderr` back to the Codebook UI).
3. **Linting & Diagnostics**:
   - Live compiler diagnostics are gathered via `clang -fsyntax-only` and mapped to CodeMirror markers.

## Harness Data Structures & Testing API

- **`ListNode`**: `{ int val; struct ListNode *next; }`
- **`TreeNode`**: `{ int val; struct TreeNode *left; struct TreeNode *right; }`
- **`Node`**: `{ int val; int numNeighbors; struct Node **neighbors; }`
- **`Interval`**: `{ int start; int end; }`

### Helper Functions

- **Linked Lists**: `list_to_linked_list(arr, len)`, `linked_list_to_list(head, &out_len)`, `make_cycle(arr, len, pos)`
- **Binary Trees**: `list_to_tree(arr, len)`, `tree_to_list(root, &out_len)`, `ints_to_tree(arr, len)`, `tree_to_ints(root, &out_len)`
- **Graphs**: `build_graph(adj, col_sizes, row_size)`, `graph_to_adj(node, &out_row_size, &out_col_sizes)`
- **Sorting & Normalization**: `sort_ints(arr, len)`, `sort_strings(arr, len)`, `normalize_nested_ints(...)`, `normalize_nested_strings(...)`

### Test Assertions

- `Tests.bool_check(msg, condition)`
- `Tests.equal_check_int(msg, expected, actual)`
- `Tests.equal_check_long(msg, expected, actual)`
- `Tests.equal_check_double(msg, expected, actual)`
- `Tests.equal_check_str(msg, expected, actual)`
- `Tests.equal_check_int_arr(msg, exp_arr, exp_len, act_arr, act_len)`
- `Tests.equal_check_int_2d(msg, exp, exp_cols, exp_rows, act, act_cols, act_rows)`
- `Tests.unordered_equal_check(msg, exp, exp_cols, exp_rows, act, act_cols, act_rows)`
- `Tests.unordered_equal_check_str(msg, exp, exp_cols, exp_rows, act, act_cols, act_rows)`
- `equal_check(msg, expected, actual)`
