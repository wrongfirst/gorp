In the previous exercise, we added the `^` anchor to match patterns strictly at the start of a line.

Similarly, the dollar sign `$` at the end of a pattern acts as an **end-of-string anchor**. It asserts that the pattern must match all the way to the very end of the input string.

When combined, `^` and `$` require the pattern to match the **entire string** from start to finish.

For example:
- Pattern `dog$`: matches `"big dog"` because `"dog"` is at the very end of the line.
- Pattern `dog$`: does **not** match `"dog food"` because characters follow `"dog"`.
- Pattern `^cat$`: matches `"cat"` exactly, but does **not** match `"cats"` or `"the cat"`.
- Pattern `^$`: matches only an empty string `""`.

Let's update our pattern matcher to support the `$` end-of-string anchor alongside the `^` anchor.

## How End of String Anchor Matching Works

1. **Detect Anchors**:
   - Check if `pattern` begins with `^`. If so, strip the leading `^` and mark `anchoredStart = true`.
   - Check if `pattern` ends with `$`. If so, strip the trailing `$` and mark `anchoredEnd = true`.

2. **Evaluate the Match**:
   - **Both (`^...$`)**: The pattern must match starting at index `0` and end precisely at the end of the line (`len(lineRunes) == len(tokens)` and matches at 0).
   - **Start Anchor Only (`^...`)**: The pattern must match starting at index `0`.
   - **End Anchor Only (`...$`)**: The pattern must match ending at the last index of the line (starting at `len(lineRunes) - len(tokens)`).
   - **Unanchored**: The pattern may match starting at any valid position `i`.

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"big dog"` | `"dog$"` | `true` | `"dog"` appears at the end of the line |
| `"dog food"` | `"dog$"` | `false` | `"dog"` is followed by more characters |
| `"cat"` | `"^cat$"` | `true` | Entire line exactly matches `"cat"` |
| `"cats"` | `"^cat$"` | `false` | Trailing `'s'` prevents exact match |
| `"the cat"` | `"^cat$"` | `false` | Leading `"the "` prevents exact match |
| `"item_42"` | `"\d\d$"` | `true` | Ends with two digits |
| `"item_42_end"` | `"\d\d$"` | `false` | Does not end with the digits |
| `""` | `"^$"` | `true` | Empty string matches `^$` |
| `"a"` | `"^$"` | `false` | Non-empty string does not match `^$` |
| `"hello"` | `"hello"` | `true` | Unanchored pattern matches anywhere |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support `^` at the start of the pattern (start of string anchor).
- Support `$` at the end of the pattern (end of string anchor).
- Support both anchors together `^...$` to require an exact full-string match.
- Continue supporting unanchored matching, character classes (`\d`, `\w`), character groups (`[...]`, `[^...]`), and literal sequences.
- Return `false` otherwise. If `pattern` is empty, or only contains anchors that match the empty string (like `"^"`, `"$"`, or `"^$"` on empty input), return `true`.
