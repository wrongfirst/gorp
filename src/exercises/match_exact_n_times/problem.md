In regular expressions, curly braces `{n}` specify an **exact repetition quantifier**. It asserts that the preceding element must match **exactly `n` consecutive times**.

It applies to the immediately preceding element (a literal character, an escape sequence like `\d` or `\w`, a wildcard `.`, or a character group `[...]`).

For example:
- `ca{3}t`: matches `"caaat"` (exactly three `'a'`s). It does **not** match `"cat"`, `"caat"`, or `"caaaat"`.
- `^\d{3}$`: matches a string of exactly three digits, like `"123"`.
- `^\d{3}-\d{4}$`: matches a pattern like `"555-1234"`.
- `[abc]{2}`: matches any two consecutive characters from `'a'`, `'b'`, or `'c'`.

Let's extend our pattern matcher to support the `{n}` quantifier.

## How the Exact Repetition Quantifier Works

1. **Tokenization with `{n}`**:
   - When encountering `{`, look ahead for the closing `}`.
   - Parse the integer `n` between the braces.
   - Set the minimum and maximum match count for that token to `n`.

2. **Matching Exactly `n` Times**:
   - The token must match exactly `n` consecutive characters in the input.
   - If fewer than `n` matching characters are available, the match fails.
   - When combined with surrounding patterns or anchors, remaining tokens match against the remainder of the line.

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"caaat"` | `"ca{3}t"` | `true` | Exactly 3 `'a'`s match `a{3}` |
| `"caat"` | `"ca{3}t"` | `false` | Only 2 `'a'`s |
| `"caaaat"` | `"^ca{3}t$"` | `false` | 4 `'a'`s exceeds exact count of 3 |
| `"123"` | `"^\d{3}$"` | `true` | Exactly 3 digits |
| `"12"` | `"^\d{3}$"` | `false` | 2 digits |
| `"1234"` | `"^\d{3}$"` | `false` | 4 digits |
| `"555-1234"` | `"^\d{3}-\d{4}$"` | `true` | Matches phone number format |
| `"ct"` | `"ca{0}t"` | `true` | Zero repetitions matches `"ct"` |
| `"ab"` | `"^[abc]{2}$"` | `true` | Exactly 2 characters from group |
| `"abcd"` | `"^[abc]{2}$"` | `false` | 4 characters |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support the `{n}` quantifier matching exactly `n` occurrences of the preceding element.
- Continue supporting `*`, `+`, `?`, `.`, alternation, anchors (`^`, `$`), and character classes (`\d`, `\w`, `[...]`, `[^...]`).
- Return `false` otherwise. If `pattern` is empty, return `true`.
