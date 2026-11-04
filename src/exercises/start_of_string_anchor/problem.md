By default, our regular expression matcher searches for matches starting at any position within a line.

In regular expressions, the caret symbol `^` at the beginning of a pattern acts as an **anchor**. It asserts that the pattern must match starting at the very beginning of the input string (index 0).

For example:
- Pattern `^apple`: matches `"apple pie"` because `"apple"` starts at index 0.
- Pattern `^apple`: does **not** match `"an apple"` because `"apple"` does not start at index 0.
- Pattern `apple` (without `^`): matches both `"apple pie"` and `"an apple"` because unanchored patterns can match anywhere.

> NOTE: Notice the difference between `^` inside brackets `[^...]` (which defines a negative character group) and `^` at the start of a pattern (which anchors the match to the start of the line).

Let's update our pattern matcher to support the `^` start-of-string anchor.

## How Start of String Anchor Matching Works

1. **Detect the Anchor**:
   - Check if `pattern` begins with `^`.
   - If it begins with `^`, strip the leading `^` and mark the match as anchored to the start.
   - If it does not begin with `^`, the match remains unanchored.

2. **Evaluate the Match**:
   - **Anchored (`^`)**: Only check if the token sequence matches starting at index `0` of the line (`matchHere(lineRunes, tokens)`).
   - **Unanchored**: Check if the token sequence matches starting at any valid index `i` of the line.
   - An empty pattern (`""`) or a lone caret (`"^"`) matches any line.

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"apple pie"` | `"^apple"` | `true` | Matches `"apple"` at index 0 |
| `"an apple"` | `"^apple"` | `false` | `"apple"` appears at index 3, not at index 0 |
| `"an apple"` | `"apple"` | `true` | Unanchored pattern matches anywhere |
| `"log: error"` | `"^l"` | `true` | Starts with `'l'` |
| `"blog: error"` | `"^l"` | `false` | `'b'` is at index 0, not `'l'` |
| `"3 dogs"` | `"^\d \w\w\w\w"` | `true` | Digit and word characters start at index 0 |
| `"there are 3 dogs"` | `"^\d \w\w\w\w"` | `false` | Pattern appears later, not at the beginning |
| `"cat"` | `"^[abc]at"` | `true` | Starts with `'c'` which is in `[abc]` |
| `"a cat"` | `"^[abc]at"` | `false` | `"cat"` does not start at index 0 |
| `"dog"` | `"^[^abc]og"` | `true` | Starts with `'d'` which is not in `[abc]` |
| `"hello"` | `"^"` | `true` | Lone anchor matches start of line |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- If `pattern` starts with `^`, return `true` if and only if the rest of the pattern matches starting at the beginning of `line`.
- If `pattern` does not start with `^`, return `true` if the pattern matches anywhere in `line`.
- Continue supporting all previously implemented features: `\d`, `\w`, `[...]`, `[^...]`, and literal character sequences.
- Return `false` otherwise. If `pattern` is empty, or only contains `"^"`, return `true`.
