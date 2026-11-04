In regular expressions, the asterisk `*` (also called the Kleene star) is a quantifier that means **match zero or more times**.

It applies to the immediately preceding element (a literal character, an escape sequence like `\d` or `\w`, a wildcard `.`, or a character group `[...]`).

Unlike the `+` quantifier which requires at least one occurrence, `*` can succeed even when the preceding element appears zero times.

For example:
- `ca*t`: matches `"ct"` (zero `'a'`s), `"cat"` (one `'a'`), and `"caaaat"` (multiple `'a'`s).
- `^\d*$`: matches a line containing zero or more digits (including an empty string).
- `.*`: matches any sequence of zero or more characters (the classic catch-all pattern).
- `[abc]*`: matches any sequence consisting solely of `'a'`, `'b'`, or `'c'`, or an empty match.

Let's extend our pattern matcher to support the `*` quantifier.

## How the Asterisk Quantifier Works

1. **Tokenization with `*`**:
   - Check if the character following the token is `*`.
   - Mark the token as matching zero or more times.

2. **Matching Zero or More**:
   - Find the maximum number `k` of consecutive characters in the line that match the token.
   - Greedily try consuming `j` characters from `k` down to `0`.
   - For each choice of `j`, check if the remaining tokens match the rest of the line.
   - If `j == 0`, the token is effectively skipped (matching zero occurrences).

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"ct"` | `"ca*t"` | `true` | Zero `'a'`s match `a*` |
| `"cat"` | `"ca*t"` | `true` | One `'a'` matches `a*` |
| `"caaaat"` | `"ca*t"` | `true` | Four `'a'`s match `a*` |
| `"dog"` | `"ca*t"` | `false` | Does not start with `'c'` or end with `'t'` |
| `""` | `"^.*$"` | `true` | `.*` matches empty string (0 characters) |
| `"anything here"` | `"^.*$"` | `true` | `.*` matches all characters |
| `"12345"` | `"^\d*$"` | `true` | Consists only of digits |
| `""` | `"^\d*$"` | `true` | Zero digits matches `\d*` |
| `"123a"` | `"^\d*$"` | `false` | Contains non-digit `'a'` |
| `"aaa"` | `"a*a"` | `true` | Backtracks: `a*` matches 2 `'a'`s, literal matches last `'a'` |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support the `*` quantifier matching zero or more occurrences of the preceding element.
- Support greedy matching with backtracking when following tokens need to match remaining characters.
- Continue supporting `+`, `?`, `.`, alternation, anchors (`^`, `$`), and character classes (`\d`, `\w`, `[...]`, `[^...]`).
- Return `false` otherwise. If `pattern` is empty, return `true`.
