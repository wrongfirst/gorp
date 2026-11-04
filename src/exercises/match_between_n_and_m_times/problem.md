In regular expressions, the `{n,m}` quantifier specifies a bounded repetition range: **match between `n` and `m` consecutive times (inclusive)**.

It applies to the immediately preceding element (a literal character, an escape sequence like `\d` or `\w`, a wildcard `.`, or a character group `[...]`).

This completes the full family of repetition quantifiers:
- `{n}`: exactly `n` times (`min = n, max = n`)
- `{n,}`: at least `n` times (`min = n, max = infinity`)
- `{n,m}`: between `n` and `m` times (`min = n, max = m`)
- `?`: zero or one time (`{0,1}`)
- `*`: zero or more times (`{0,}`)
- `+`: one or more times (`{1,}`)

For example:
- `ca{2,4}t`: matches `"caat"`, `"caaat"`, and `"caaaat"`.
  - does **not** match `"cat"` (only 1 `'a'`).
  - with anchors `^ca{2,4}t$`, does **not** match `"caaaaat"` (5 `'a'`s).
- `^\d{2,4}$`: matches any string consisting of 2, 3, or 4 digits.
- `[abc]{1,3}`: matches between 1 and 3 characters from `'a'`, `'b'`, or `'c'`.

Let's extend our pattern matcher to support the `{n,m}` range quantifier.

## How the Range Quantifier Works

1. **Tokenization with `{n,m}`**:
   - When encountering `{`, look ahead for the closing `}`.
   - If the content contains a comma with numbers on both sides (e.g. `2,4`), parse `n` and `m`.
   - Set the minimum repetitions to `n` and the maximum repetitions to `m`.

2. **Matching Between `n` and `m` Times**:
   - Count matching consecutive characters up to a maximum of `m`.
   - If fewer than `n` matching characters are found, the match fails.
   - Greedily test matches from `k` down to `n` (backtracking when needed).

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"caat"` | `"^ca{2,4}t$"` | `true` | 2 `'a'`s (within 2–4) |
| `"caaat"` | `"^ca{2,4}t$"` | `true` | 3 `'a'`s (within 2–4) |
| `"caaaat"` | `"^ca{2,4}t$"` | `true` | 4 `'a'`s (within 2–4) |
| `"cat"` | `"^ca{2,4}t$"` | `false` | Only 1 `'a'` (less than 2) |
| `"caaaaat"` | `"^ca{2,4}t$"` | `false` | 5 `'a'`s (more than 4) |
| `"123"` | `"^\d{2,4}$"` | `true` | 3 digits (within 2–4) |
| `"1"` | `"^\d{2,4}$"` | `false` | 1 digit (less than 2) |
| `"12345"` | `"^\d{2,4}$"` | `false` | 5 digits (more than 4) |
| `"abc"` | `"^[abc]{1,3}$"` | `true` | 3 characters from group |
| `"abcd"` | `"^[abc]{1,3}$"` | `false` | Contains `'d'` outside group |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support the `{n,m}` quantifier matching between `n` and `m` occurrences of the preceding element.
- Fully support all quantifier forms: `{n,m}`, `{n,}`, `{n}`, `*`, `+`, `?`.
- Continue supporting `.`, alternation, anchors (`^`, `$`), and character classes (`\d`, `\w`, `[...]`, `[^...]`).
- Return `false` otherwise. If `pattern` is empty, return `true`.
