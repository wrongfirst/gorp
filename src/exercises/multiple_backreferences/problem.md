In regular expressions, you can define **multiple capturing groups** in the same pattern.

Each pair of parentheses creates a distinct capturing group. Groups are numbered sequentially from left to right starting at 1, based on the order of their opening parentheses `(`:
- The first `(` begins group 1, referenced by `\1`.
- The second `(` begins group 2, referenced by `\2`.
- The third `(` begins group 3, referenced by `\3`, and so on.

Backreferences can appear in any order and can be referenced multiple times:
- `(\w+) and (\w+), \1 and \2`: matches `"cat and dog, cat and dog"`.
- `^(\d+) (\w+) \2 \1$`: matches palindromic structures like `"100 test test 100"`.
- `(\w+)-\1-\1`: matches three identical repetitions like `"go-go-go"`.

## Practical Uses of Multiple Backreferences

1. **Structured Data Validation**:
   - `^(\w+) (\d+), again \1 \2$`: matches a name and ID repeated in the second part.
2. **HTML / XML Tags**:
   - `<(\w+)>.*?</\1>`: ensures the closing tag matches the opening tag name.
3. **Paired Delimiters**:
   - `([\[({])[a-z]+([\])}])`: captures opening and closing brackets.

Let's extend our pattern matcher to support multiple capturing groups and multiple backreferences (`\1`, `\2`, `\3`, etc.).

## How Multiple Backreferences Work

1. **Sequential Numbering**:
   - Maintain a counter for capturing groups (starting at 1).
   - Each time an opening parenthesis `(` is encountered during pattern parsing, assign the next counter value as its `groupId`, and push it onto a stack.
   - Each time a closing parenthesis `)` is encountered, pop the top `groupId` from the stack to close the matching group.

2. **Resolving `\1`, `\2`, ...**:
   - Backreference `\k` looks up group ID `k` in the map of captured groups.
   - Match the input at the current position against `captured[k]`.

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"cat and dog, cat and dog"` | `"(\\w+) and (\\w+), \\1 and \\2"` | `true` | `\1` is `"cat"`, `\2` is `"dog"` |
| `"cat and dog, dog and cat"` | `"(\\w+) and (\\w+), \\1 and \\2"` | `false` | Words are inverted |
| `"100 test test 100"` | `"^(\\d+) (\\w+) \\2 \\1$"` | `true` | Reverse order references `\2 \1` |
| `"go-go-go"` | `"^(\\w+)-\\1-\\1$"` | `true` | Group 1 referenced multiple times |
| `"AB-12-AB-12"` | `"^([A-Z]+)-(\\d+)-\\1-\\2$"` | `true` | Distinct groups with character classes |
| `"AB-12-CD-12"` | `"^([A-Z]+)-(\\d+)-\\1-\\2$"` | `false` | First group mismatched |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support multiple capturing groups and backreferences (`\1`, `\2`, `\3`, etc.).
- Allow backreferences to appear in any order and be used multiple times.
- Continue supporting all previously implemented regex features.
- Return `false` otherwise. If `pattern` is empty, return `true`.
