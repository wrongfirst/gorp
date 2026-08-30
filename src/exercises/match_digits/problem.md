In regular expressions, character classes match any character from a predefined set. The digit character class `\d` matches any ASCII digit from `0` to `9`.

Let's extend our pattern matcher to support digits with `\d`.

You can update `matchPattern` in your `matcher.go` file to add support for the `\d` pattern.

## How Digit Matching Works

When given the pattern `\d` and a target input line:
- If the line contains at least one digit character (`0`-`9`), the match succeeds (`true`).
- If the line does not contain any digits, the match fails (`false`).
- Patterns containing a single literal character should continue to match as before.

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"apple1"` | `"\d"` | `true` | Contains digit `'1'` |
| `"100_items"` | `"\d"` | `true` | Starts with digits |
| `"item42"` | `"\d"` | `true` | Contains digits in the middle |
| `"apple"` | `"\d"` | `false` | No digits present |
| `"dog"` | `"d"` | `true` | Literal character match |
| `"cat"` | `"d"` | `false` | Literal character does not match |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Return `true` if `pattern` is `\d` and `line` contains any digit (`0`-`9`).
- Return `true` if `pattern` is a single literal character that appears anywhere in `line`.
- Return `false` otherwise. If `pattern` is empty, return `true`.
