In regular expressions, parentheses `(...)` create a **capturing group**.

A capturing group remembers the exact text matched by the subpattern inside the parentheses. You can then refer back to this exact matched text later in the same pattern using a **backreference**: `\1`.

- `\1` matches the exact substring matched by the first capturing group.

Notice the crucial difference:
- Pattern `[a-z] [a-z]` matches any lowercase letter followed by a space and *any* lowercase letter (like `"a b"` or `"a a"`).
- Pattern `([a-z]) \1` matches a lowercase letter followed by a space and the **exact same letter** (like `"a a"`, but **not** `"a b"`).

### Practical Uses of Backreferences

1. **Repeated Words**:
   - `(\w+) \1`: matches repeated words like `"hello hello"` or `"test test"`.
2. **Matching Delimiters & Quotes**:
   - `(['"])[^'"]+\1`: ensures an opening quote matches the same closing quote (e.g. `'hello'` or `"hello"`, but not `'hello"`).
3. **Repeated Numbers or Codes**:
   - `^(\d+) \1$`: matches `"42 42"`, but not `"42 43"`.

Let's extend our pattern matcher to support capturing groups `(...)` and the single backreference `\1`.

## How Backreferences Work

1. **Capturing Group Boundaries**:
   - `(` marks the start of the capturing group. Record the starting index in the input string.
   - `)` marks the end of the capturing group. The slice of input matched between `(` and `)` is stored as group 1's captured text.

2. **Matching `\1`**:
   - When `\1` is encountered, check if the input at the current position matches the exact text captured by group 1.
   - If it matches, advance past the captured text.
   - If not, fail (or backtrack to see if the group could match a different slice of characters, such as with `(\w+)`).

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"cat and cat"` | `"(cat) and \\1"` | `true` | Group 1 is `"cat"`, `\1` matches `"cat"` |
| `"cat and dog"` | `"(cat) and \\1"` | `false` | Group 1 is `"cat"`, but `\1` finds `"dog"` |
| `"hello hello"` | `"(\\w+) \\1"` | `true` | `\w+` matches `"hello"`, `\1` matches `"hello"` |
| `"hello world"` | `"(\\w+) \\1"` | `false` | Second word does not match first word |
| `"42 42"` | `"^(\\d+) \\1$"` | `true` | Exactly two identical numbers |
| `"42 43"` | `"^(\\d+) \\1$"` | `false` | Numbers differ |
| `"apple is apple"` | `"^(\\w+) is \\1$"` | `true` | Same word on both sides |
| `"dog and dog"` | `"(cat|dog) and \\1"` | `true` | Alternation inside capturing group |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support a single capturing group `(...)` and backreference `\1`.
- Continue supporting all quantifiers (`*`, `+`, `?`, `{n}`, `{n,}`, `{n,m}`), anchors (`^`, `$`), wildcard (`.`), alternation (`|`), and character classes (`\d`, `\w`, `[...]`, `[^...]`).
- Return `false` otherwise. If `pattern` is empty, return `true`.
