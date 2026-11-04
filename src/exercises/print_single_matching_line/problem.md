In previous chapters, our matcher answered a boolean question: *does this line match the pattern?*

In Unix `grep`, the core behavior is **line processing and output**:
- When an input line matches the pattern, `grep` prints that line to standard output.
- When an input line does not match, `grep` suppresses it (prints nothing).

This is the fundamental filter mechanism that makes `grep` so powerful in shell pipelines (like `cat file.txt | grep "error"`).

In this exercise, we take our first step toward building a complete command-line tool by implementing single line filtering.

## How Line Filtering Works

Given an input `line` and a `pattern`:
1. Use our pattern matching engine to test whether `line` satisfies `pattern`.
2. If it matches:
   - Return the line and `true`: `(line, true)`.
3. If it does not match:
   - Return an empty string and `false`: `("", false)`.

### Examples

| Line | Pattern | Output Line | Matched? | Explanation |
| :--- | :--- | :--- | :--- | :--- |
| `"ERROR: disk full"` | `"ERROR"` | `"ERROR: disk full"` | `true` | Line contains `"ERROR"` |
| `"INFO: system normal"` | `"ERROR"` | `""` | `false` | Pattern not found in line |
| `"user_id: 12345"` | `"\\d+"` | `"user_id: 12345"` | `true` | Line contains digits |
| `"empty logs"` | `"\\d+"` | `""` | `false` | No digits present |
| `"apple pie"` | `"^apple"` | `"apple pie"` | `true` | Anchored at start |
| `"good apple pie"` | `"^apple"` | `""` | `false` | `"apple"` is not at start |

---

## Problem Statement

Implement `grepLine(line string, pattern string) (string, bool)` in the editor on the right.

The function should:
- Test whether `line` matches `pattern`.
- If `line` matches, return `(line, true)`.
- If `line` does not match, return `("", false)`.
- If `pattern` is empty, every line matches (return `(line, true)`).
