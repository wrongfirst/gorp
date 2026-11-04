When using `grep -o` on a line with multiple matches, `grep` extracts **all non-overlapping matching substrings** in left-to-right order.

For example, running:
```bash
echo "apple, banana, apple, cherry, apple" | grep -o "apple"
```
Outputs:
```
apple
apple
apple
```
Similarly, extracting numbers from a sentence:
```bash
echo "Server ports 8080, 8443, and 9000 are open" | grep -o "[0-9]\+"
```
Outputs:
```
8080
8443
9000
```

Notice that matches are **non-overlapping**: after finding a match spanning from index $i$ to $j$, the search continues from index $j$ onwards.

In this exercise, we implement `findAllMatches`, which extracts all non-overlapping matching substrings from a single line.

## How Finding All Matches Works

Given a `line string` and a `pattern string`:
1. If `pattern` is empty, return an empty slice `[]string{}`.
2. Parse the pattern into tokens.
3. Iterate index `i` from `0` across the line:
   - Attempt to match `pattern` starting at position `i`.
   - If a match is found spanning from `i` to `endPos` (with `endPos > i`):
     - Append `line[i:endPos]` to the results slice.
     - Advance `i = endPos` to find the next non-overlapping match.
   - If no match begins at `i`, increment `i++`.
4. Return the slice of all matched substrings.

### Examples

| Line | Pattern | Matched Substrings | Explanation |
| :--- | :--- | :--- | :--- |
| `"cat dog cat"` | `"cat"` | `["cat", "cat"]` | Two occurrences of `"cat"` |
| `"order 123 and 456"` | `"\\d+"` | `["123", "456"]` | Extracts all sequences of digits |
| `"AB-10 CD-20"` | `"[A-Z]+-\\d+"` | `["AB-10", "CD-20"]` | Extracts uppercase code and digits |
| `"aaaa"` | `"aa"` | `["aa", "aa"]` | Non-overlapping matches |
| `"no match here"` | `"\\d+"` | `[]` | No matches returns empty slice |

---

## Problem Statement

Implement `findAllMatches(line string, pattern string) []string` in the editor on the right.

The function should:
- Find all non-overlapping matching substrings in `line` from left to right.
- Return a slice containing each matched substring in order.
- Return an empty slice `[]string{}` if no matches are found or if `pattern` is empty.
- Correctly handle character classes, quantifiers, alternation, and backreferences.
