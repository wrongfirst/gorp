In Unix `grep --color`, when a line contains multiple occurrences of a pattern, **every non-overlapping match** is highlighted.

For example, given:
- Input line: `"apple and apple and apple"`
- Pattern: `"apple"`
- Highlighted output: `"\033[31mapple\033[0m and \033[31mapple\033[0m and \033[31mapple\033[0m"`

In your terminal, this displays each matched word highlighted in red:
<span style="color:red">**apple**</span> and <span style="color:red">**apple**</span> and <span style="color:red">**apple**</span>

Similarly, extracting and highlighting numbers in a log:
- Input line: `"Ports 8080 and 8443 are listening"`
- Pattern: `"\\d+"`
- Highlighted output: `"Ports \033[31m8080\033[0m and \033[31m8443\033[0m are listening"`

Matches must be **non-overlapping** and collected from left to right.

In this exercise, we implement `highlightAllMatches` to highlight all matching occurrences across a line.

## How Highlighting All Matches Works

Given `line string` and `pattern string`:
1. If `pattern` is empty, return `line` unchanged.
2. Initialize an index `i = 0` and a `strings.Builder` for building the formatted string.
3. While `i < len(line)`:
   - Check if a match begins at position `i`.
   - If a match is found spanning `[i:endPos]` (with `endPos > i`):
     - Append `ColorRed` (`\033[31m`).
     - Append the matched slice `line[i:endPos]`.
     - Append `ColorReset` (`\033[0m`).
     - Advance `i = endPos`.
   - If no match begins at `i`:
     - Append character `line[i]`.
     - Increment `i++`.
4. Return the resulting highlighted string.

### Examples

| Line | Pattern | Output String | Explanation |
| :--- | :--- | :--- | :--- |
| `"cat and dog"` | `"cat\|dog"` | `"\033[31mcat\033[0m and \033[31mdog\033[0m"` | Both alternation branches highlighted |
| `"100 200 300"` | `"\\d+"` | `"\033[31m100\033[0m \033[31m200\033[0m \033[31m300\033[0m"` | All three numbers highlighted |
| `"aaaa"` | `"aa"` | `"\033[31maa\033[0m\033[31maa\033[0m"` | Non-overlapping pairs highlighted |
| `"hello world"` | `"xyz"` | `"hello world"` | No match, returned unchanged |

---

## Problem Statement

Implement `highlightAllMatches(line string, pattern string) string` in the editor on the right.

The function should:
- Highlight all non-overlapping matches of `pattern` in `line` with `\033[31m` and `\033[0m`.
- Preserve all non-matching characters and spacing.
- Return the original `line` unchanged if no matches are found or if `pattern` is empty.
