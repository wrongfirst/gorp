In regular expressions, character groups `[...]` can contain **multiple ranges** and individual literal characters concatenated together.

Instead of only a single range like `[a-z]`, you can combine multiple ranges and characters inside the same set of brackets:
- `[a-zA-Z]`: matches any lowercase or uppercase ASCII letter.
- `[a-zA-Z0-9]`: matches any alphanumeric character.
- `[0-9a-fA-F]`: matches any hexadecimal character.
- `[a-z0-9_]`: matches any lowercase letter, digit, or underscore.
- `[-a-z]` or `[a-z-]`: matches any lowercase letter or a literal hyphen `-`.

For example:
- Pattern `[a-zA-Z][a-zA-Z]`: matches two consecutive letters (e.g. `"Hi"` or `"go"`).
- Pattern `0x[0-9a-fA-F]`: matches `"0x1"`, `"0xa"`, `"0xF"`, etc.
- Pattern `var_[a-zA-Z0-9_]`: matches identifier characters following `"var_"`.

Let's extend our pattern matcher to support multiple ranges and mixed characters inside a single character group.

## How Multiple Character Ranges Work

1. **Iterate Through the Bracket Content**:
   - Loop through the string inside `[...]`.
   - If there are at least three characters starting at the current index and the second character is a hyphen `-` (i.e. `group[i+1] == '-'`), treat it as a range `group[i]` to `group[i+2]`.
   - Check if `char >= start && char <= end`. If it matches, return `true`. Otherwise, advance the index by 3 (`i += 3`).
   - If the current position is not a range (such as an individual letter, underscore, or a hyphen at the edge), check if `char == rune(group[i])`. If it matches, return `true`. Otherwise, advance the index by 1 (`i++`).

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"Hello"` | `"[a-zA-Z][a-zA-Z]"` | `true` | Matches `"He"` (uppercase and lowercase) |
| `"0x4F"` | `"0x[0-9a-fA-F][0-9a-fA-F]"` | `true` | Matches hex sequence `"0x4F"` |
| `"0x4Z"` | `"0x[0-9a-fA-F][0-9a-fA-F]"` | `false` | `'Z'` is not a valid hex digit |
| `"file-1"` | `"[a-z0-9-]"` | `true` | Matches letters, digits, and literal hyphen |
| `"file_1"` | `"[a-z0-9-]"` | `false` | Underscore `_` is not in `[a-z0-9-]` |
| `"-start"` | `"[-a-z]"` | `true` | Matches leading literal hyphen |
| `"var_name"` | `"[a-z0-9_]"` | `true` | Matches lowercase, digits, and underscore |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support multiple ranges within a single bracket group (e.g. `[a-zA-Z]`, `[0-9a-fA-F]`).
- Support mixing ranges with individual characters (e.g. `[a-z0-9_]`, `[-a-z]`, `[a-z-]`).
- Continue supporting all previously implemented features from Chapter 1 (`\d`, `\w`, `[abc]`, `[^abc]`, single ranges `[a-z]`, and multi-token sequences).
- Return `false` otherwise. If `pattern` is empty, return `true`.
