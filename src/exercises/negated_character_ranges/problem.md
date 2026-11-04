In regular expressions, placing a caret `^` at the beginning of a character group creates a **negated character group**: `[^...]`.

When combined with character ranges, it matches any character that does **not** fall into any of the specified ranges or literal characters:
- `[^a-z]`: matches any character that is **not** a lowercase letter (e.g. uppercase letters, digits, punctuation, spaces).
- `[^0-9]`: matches any non-digit character.
- `[^a-zA-Z]`: matches any character that is **not** an ASCII letter.
- `[^a-zA-Z0-9]`: matches any non-alphanumeric character (e.g. spaces, symbols, punctuation).

For example:
- Pattern `#[^0-9]`: matches `'#'` followed by any character other than a digit (e.g. matches `"#a"`, but not `"#1"`).
- Pattern `c[^a-e]t`: matches `"cut"` and `"cot"`, but does **not** match `"cat"`, `"cbt"`, or `"cet"`.
- Pattern `[^a-zA-Z0-9]`: matches anywhere a symbol or space appears.

Let's extend our pattern matcher to support negated character ranges.

## How Negated Character Ranges Work

1. **Detecting Negation**:
   - If a token starts with `[^` and ends with `]`, extract the inner content after the `^`: `token[2:len(token)-1]`.

2. **Evaluating Negation**:
   - Reuse `matchCharGroup(char, inner)` to determine if `char` falls into any of the ranges or characters listed.
   - Return the inverted boolean result: `!matchCharGroup(char, inner)`.

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"HELLO"` | `"[^a-z]"` | `true` | Uppercase `'H'` is not in `'a'`–`'z'` |
| `"hello"` | `"[^a-z]"` | `false` | All characters are lowercase letters |
| `"cut"` | `"c[^a-e]t"` | `true` | `'u'` is not in `'a'`–`'e'` |
| `"cat"` | `"c[^a-e]t"` | `false` | `'a'` is in `'a'`–`'e'` |
| `"item #A"` | `"#[^0-9]"` | `true` | Character `'A'` following `'#'` is not a digit |
| `"item #1"` | `"#[^0-9]"` | `false` | Character `'1'` following `'#'` is a digit |
| `"hello world"` | `"[^a-zA-Z0-9]"` | `true` | Space character is non-alphanumeric |
| `"hello123"` | `"[^a-zA-Z0-9]"` | `false` | Contains only letters and digits |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support negated character ranges `[^start-end]` and multi-range negations (e.g. `[^a-z]`, `[^0-9]`, `[^a-zA-Z0-9]`).
- Continue supporting all previously implemented features from Chapter 1 (`\d`, `\w`, `[abc]`, `[^abc]`, ranges, and multi-token sequences).
- Return `false` otherwise. If `pattern` is empty, return `true`.
