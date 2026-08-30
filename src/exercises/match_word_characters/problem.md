Another common character class in regular expressions is the word character class, written as `\w`.

The `\w` pattern matches any alphanumeric character (letters `a`-`z`, `A`-`Z`, and digits `0`-`9`) as well as the underscore character (`_`).

Let's extend our pattern matcher to support `\w`.

You can update `matchPattern` in your `matcher.go` file to add support for the `\w` pattern.

## How Word Character Matching Works

When given the pattern `\w` and a target input line:
- If the line contains at least one alphanumeric character (`a`-`z`, `A`-`Z`, `0`-`9`) or underscore (`_`), the match succeeds (`true`).
- If the line contains only special characters, punctuation, spaces, or is empty, the match fails (`false`).
- Patterns containing `\d` and single literal characters should continue to work.

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"apple"` | `"\w"` | `true` | Contains letters |
| `"123"` | `"\w"` | `true` | Contains digits |
| `"_private"` | `"\w"` | `true` | Contains underscore |
| `"$!?"` | `"\w"` | `false` | Only symbols and punctuation |
| `"   "` | `"\w"` | `false` | Only whitespace |
| `"item_42"` | `"\d"` | `true` | Still matches digit class `\d` |
| `"dog"` | `"d"` | `true` | Still matches literal character `"d"` |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Return `true` if `pattern` is `\w` and `line` contains any word character (`a`-`z`, `A`-`Z`, `0`-`9`, or `_`).
 
From earlier exercises we already:
- Return `true` if `pattern` is `\d` and `line` contains any digit (`0`-`9`).
- Return `true` if `pattern` is a single literal character that appears anywhere in `line`.
- Return `false` otherwise. If `pattern` is empty, return `true`.