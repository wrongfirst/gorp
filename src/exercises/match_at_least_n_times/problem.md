In regular expressions, the `{n,}` quantifier specifies an open-ended range: **match at least `n` consecutive times**, with no upper limit.

It applies to the immediately preceding element (a literal character, an escape sequence like `\d` or `\w`, a wildcard `.`, or a character group `[...]`).

Notice how `{n,}` generalizes other quantifiers you've seen:
- `a+` is equivalent to `a{1,}` (at least 1 time)
- `a*` is equivalent to `a{0,}` (at least 0 times)

For example:
- `ca{2,}t`: matches `"caat"`, `"caaat"`, `"caaaat"` (two or more `'a'`s).
  - does **not** match `"cat"` (only one `'a'`) or `"ct"` (zero `'a'`s).
- `^\d{3,}$`: matches any sequence of three or more digits (`"123"`, `"1234"`, `"12345"`).
- `[abc]{2,}`: matches two or more consecutive characters from the group `[abc]`.

Let's extend our pattern matcher to support the `{n,}` quantifier.

## How the At-Least-N Quantifier Works

1. **Tokenization with `{n,}`**:
   - When encountering `{`, look ahead for the closing `}`.
   - If the content ends with a comma (e.g. `2,`), parse the number before the comma as `n`.
   - Set the minimum required repetitions to `n`, and leave the maximum repetitions unbounded (`-1`).

2. **Matching At Least `n` Times**:
   - Count the maximum number `k` of consecutive matching characters.
   - If `k < n`, the match fails immediately.
   - Greedily try matching `j` characters from `k` down to `n` (backtracking if following tokens fail).

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"caat"` | `"ca{2,}t"` | `true` | Exactly 2 `'a'`s (meets minimum of 2) |
| `"caaat"` | `"ca{2,}t"` | `true` | 3 `'a'`s (meets minimum of 2) |
| `"cat"` | `"ca{2,}t"` | `false` | Only 1 `'a'`; requires at least 2 |
| `"ct"` | `"ca{2,}t"` | `false` | 0 `'a'`s; requires at least 2 |
| `"12345"` | `"^\d{3,}$"` | `true` | 5 digits (meets minimum of 3) |
| `"12"` | `"^\d{3,}$"` | `false` | Only 2 digits |
| `"hello"` | `".{3,}"` | `true` | 5 characters matches `.{3,}` |
| `"hi"` | `"^.{3,}$"` | `false` | Only 2 characters |
| `"aaa"` | `"a{2,}a"` | `true` | Backtracks: consumes 2 `'a'`s, literal matches last `'a'` |
| `"caaat"` | `"ca{3}t"` | `true` | `{n}` exact quantifier continues to work |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support the `{n,}` quantifier matching at least `n` occurrences of the preceding element.
- Continue supporting `{n}`, `*`, `+`, `?`, `.`, alternation, anchors (`^`, `$`), and character classes (`\d`, `\w`, `[...]`, `[^...]`).
- Return `false` otherwise. If `pattern` is empty, return `true`.
