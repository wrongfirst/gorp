When `grep --color` runs against multi-line input (such as a file or piped stream), it performs two actions simultaneously:
1. **Filters** the input to keep only matching lines.
2. **Highlights** every match occurrence within those matching lines using ANSI escape codes (`\033[31m` ... `\033[0m`).

For example, given:
```
1. "INFO: database online"
2. "ERROR: disk read failure on drive 1"
3. "DEBUG: verbose ping"
4. "ERROR: disk write failure on drive 2"
```
And the pattern `"disk \\w+ failure"`:
- Lines 1 and 3 do not match, so they are omitted.
- Line 2 matches and is formatted with the match highlighted:
  `"ERROR: \033[31mdisk read failure\033[0m on drive 1"`
- Line 4 matches and is formatted with the match highlighted:
  `"ERROR: \033[31mdisk write failure\033[0m on drive 2"`

In this exercise, we implement `highlightLines` to combine line filtering with multi-match highlighting.

## How Highlighting Across Multiple Lines Works

Given `lines []string` and `pattern string`:
1. If `pattern` is empty, every line matches, but no highlights are added (return `lines`).
2. If `lines` is empty, return an empty slice `[]string{}`.
3. For each `line` in `lines`:
   - Highlight all matches using our engine.
   - If at least one match occurred in `line`, append the highlighted string to our output slice.
4. Return the slice of highlighted matching lines.

### Examples

| Input Lines | Pattern | Output Slice | Explanation |
| :--- | :--- | :--- | :--- |
| `["cat and dog", "bird only", "another cat"]` | `"cat"` | `["\033[31mcat\033[0m and dog", "another \033[31mcat\033[0m"]` | Only lines with `"cat"` |
| `["user 100", "admin", "guest 200"]` | `"\\d+"` | `["user \033[31m100\033[0m", "guest \033[31m200\033[0m"]` | Only lines with digits |
| `["apple", "banana"]` | `"cherry"` | `[]` | No lines match |

---

## Problem Statement

Implement `highlightLines(lines []string, pattern string) []string` in the editor on the right.

The function should:
- Filter `lines`, returning only lines that contain a match for `pattern`.
- In each matching line, highlight all non-overlapping occurrences of `pattern` with `\033[31m` and `\033[0m`.
- Preserve the original order of lines.
- Return an empty slice `[]string{}` if no lines match or if `lines` is empty.
- If `pattern` is empty, return all `lines` without highlights.
