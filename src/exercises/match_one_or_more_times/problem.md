In regular expressions, the plus sign `+` is a quantifier that means **match one or more times**.

It applies to the immediately preceding element (a literal character, an escape sequence like `\d` or `\w`, or a character group `[...]`).

For example:
- `ca+t`: matches `"cat"`, `"caat"`, `"caaat"` (at least one `'a'`), but does **not** match `"ct"`.
- `\d+`: matches one or more consecutive digits, such as `"5"`, `"42"`, or `"99999"`.
- `[abc]+`: matches a sequence of one or more characters where each character is `'a'`, `'b'`, or `'c'`.
- `^\d+$`: matches a string that consists entirely of one or more digits.

Let's extend our pattern matcher to support the `+` quantifier.

## How the Plus Quantifier Works

1. **Tokenization with Quantifiers**:
   - When parsing tokens, check if the character following the token is `+`.
   - Mark that token as requiring one or more occurrences.

2. **Matching One or More**:
   - The token must match the current character at least once.
   - It can then greedily consume additional consecutive matching characters.
   - If subsequent tokens fail to match the remainder of the line, backtrack and try consuming fewer characters.

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"cat"` | `"ca+t"` | `true` | One `'a'` matches `a+` |
| `"caaaat"` | `"ca+t"` | `true` | Four `'a'`s match `a+` |
| `"ct"` | `"ca+t"` | `false` | Zero `'a'`s; `+` requires at least one |
| `"dog 123 cat"` | `"\d+"` | `true` | `"123"` matches `\d+` |
| `"dog cat"` | `"\d+"` | `false` | No digits in line |
| `"12345"` | `"^\d+$"` | `true` | Entire line consists of digits |
| `"123a45"` | `"^\d+$"` | `false` | `'a'` is not a digit |
| `"abcba"` | `"^[abc]+$"` | `true` | Every character is in `[abc]` |
| `"abcz"` | `"^[abc]+$"` | `false` | `'z'` is not in `[abc]` |
| `"aaa"` | `"a+a"` | `true` | `a+` matches `"aa"`, then `'a'` matches `'a'` (backtracking) |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support the `+` quantifier matching one or more occurrences of the preceding literal or character class (`\d`, `\w`, `[...]`, `[^...]`).
- Support backtracking when following tokens need to match remaining characters.
- Continue supporting anchors (`^`, `$`) and all previous pattern features.
- Return `false` otherwise. If `pattern` is empty, return `true`.
