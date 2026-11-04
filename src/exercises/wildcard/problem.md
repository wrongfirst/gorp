In regular expressions, the dot `.` is a **wildcard character**. It matches **any single character** (with the exception of newline characters `\n`).

For example:
- `c.t`: matches `"cat"`, `"cot"`, `"c1t"`, `"c_t"`, and `"c t"`, because any character fits between `'c'` and `'t'`.
- `c.t`: does **not** match `"ct"` (requires a character in the middle) or `"caat"` (only matches a single character).
- `d.g$`: matches `"big dog"` and `"dig"` at the end of a line.
- `^...$`: matches any string consisting of exactly three characters.
- `.+`: matches one or more of any character.

Let's extend our pattern matcher to support the wildcard `.` character.

## How Wildcard Matching Works

1. **Tokenization**:
   - The dot `.` is treated as a token representing any character.
   - Like other tokens, it can be followed by quantifiers such as `+` (`.+`) or `?` (`.?`).

2. **Matching**:
   - When evaluating a `.` token against an input character, it matches any character (as long as it is not a newline `\n`).

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"cat"` | `"c.t"` | `true` | `.` matches `'a'` |
| `"c1t"` | `"c.t"` | `true` | `.` matches `'1'` |
| `"c t"` | `"c.t"` | `true` | `.` matches space `' '` |
| `"ct"` | `"c.t"` | `false` | No character between `'c'` and `'t'` |
| `"caat"` | `"c.t"` | `false` | Multiple characters between `'c'` and `'t'` |
| `"dog"` | `"^...$"` | `true` | Exactly 3 characters |
| `"dogs"` | `"^...$"` | `false` | 4 characters |
| `"hello world"` | `".+"` | `true` | Matches 1 or more characters |
| `""` | `".+"` | `false` | Empty string has 0 characters |
| `"item_a_1"` | `"item_._\d"` | `true` | Matches `'a'` between underscores |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support the `.` wildcard matching any character except `\n`.
- Support `.` combined with quantifiers (`+`, `?`) and anchors (`^`, `$`).
- Continue supporting all previously implemented features (`\d`, `\w`, `[...]`, `[^...]`, literals).
- Return `false` otherwise. If `pattern` is empty, return `true`.
