By default, `grep` prints the entire line that contains a match. However, often you only want to extract the **exact matched substring** rather than the surrounding line.

In Unix `grep`, this is accomplished using the `-o` (`--only-matching`) flag:
```bash
grep -o "PATTERN" file.txt
```
For example, if you run:
```bash
echo "user id is 42 in the database" | grep -o "[0-9]\+"
```
The output is just:
```text
42
```
Not the entire sentence `"user id is 42 in the database"`.

In this exercise, we implement `findSingleMatch`, which locates the first matching substring within a line and returns it.

## How Substring Extraction Works

1. **Locate Match Start and End**:
   - Instead of merely returning `true`/`false`, the matcher tracks the starting position `start` and ending position `end` of the match within the line.
   - For an unanchored pattern, scan through the line from index `0` upwards.
   - At the first starting index where `matchAt` succeeds, extract the slice `line[start:end]`.

2. **Return the Result**:
   - If a non-empty match is found, return `(matchedString, true)`.
   - If no match is found (or if `pattern` is empty), return `("", false)`.

### Examples

| Line | Pattern | Matched Substring | Found? | Explanation |
| :--- | :--- | :--- | :--- | :--- |
| `"user id is 42"` | `"\\d+"` | `"42"` | `true` | Extracts only the digits |
| `"order [AB-123] confirmed"` | `"\\[[A-Z]+-\\d+\\]"` | `"[AB-123]"` | `true` | Extracts bracketed order ID |
| `"the quick brown fox"` | `"[a-z]{5}"` | `"quick"` | `true` | First 5-letter word |
| `"apple and banana"` | `"cherry"` | `""` | `false` | Pattern not in line |
| `"prefix_cat_suffix"` | `"(cat\|dog)"` | `"cat"` | `true` | Extracts matched alternation branch |

---

## Problem Statement

Implement `findSingleMatch(line string, pattern string) (string, bool)` in the editor on the right.

The function should:
- Find the first substring in `line` that matches `pattern`.
- Return `(matchedSubstring, true)` if a match is found.
- Return `("", false)` if no match is found, or if `pattern` is empty.
- Support anchors (`^`, `$`), quantifiers (`+`, `*`, `?`, `{n,m}`), character classes, alternation, and backreferences.
