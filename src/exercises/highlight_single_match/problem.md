When you run `grep --color` in a terminal, the matched text is visually highlighted using **ANSI escape codes**.

ANSI escape sequences are special character sequences that tell terminal emulators to format text (such as changing the color, background, or bold weight).

The standard ANSI sequence for red text in Unix terminals is:
- **Start Red**: `\033[31m` (or `\x1b[31m`)
- **Reset Color**: `\033[0m` (or `\x1b[0m`)

When `grep` finds a match within a line, it wraps the matched substring with these codes:
```text
line[:start] + "\033[31m" + line[start:end] + "\033[0m" + line[end:]
```

For example:
- Input line: `"the quick brown fox"`
- Pattern: `"brown"`
- Highlighted output: `"the quick \033[31mbrown\033[0m fox"`

In your terminal, this displays as:
the quick <span style="color:red">**brown**</span> fox

In this exercise, we implement `highlightSingleMatch` to highlight the first match in a line.

## How Highlighting a Single Match Works

Given `line string` and `pattern string`:
1. Use our pattern matching engine to find the first match span `[start:end]` in `line`.
2. If a non-empty match is found:
   - Slice the string into three parts:
     - `prefix = line[:start]`
     - `matched = line[start:end]`
     - `suffix = line[end:]`
   - Return: `prefix + "\033[31m" + matched + "\033[0m" + suffix`.
3. If no match is found (or if `pattern` is empty):
   - Return the original `line` unchanged.

### Examples

| Line | Pattern | Output String | Explanation |
| :--- | :--- | :--- | :--- |
| `"hello world"` | `"world"` | `"hello \033[31mworld\033[0m"` | `"world"` highlighted in red |
| `"user 42 logged in"` | `"\\d+"` | `"user \033[31m42\033[0m logged in"` | First number highlighted |
| `"apple pie"` | `"orange"` | `"apple pie"` | No match, returned unchanged |
| `"test"` | `""` | `"test"` | Empty pattern returns unchanged |

---

## Problem Statement

Implement `highlightSingleMatch(line string, pattern string) string` in the editor on the right.

The function should:
- Locate the first match of `pattern` in `line`.
- Wrap the matched substring with `\033[31m` and `\033[0m`.
- Return the original `line` unchanged if no match is found or if `pattern` is empty.
