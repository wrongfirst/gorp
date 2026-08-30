In regular expressions, a character group (enclosed in square brackets `[...]`) allows you to match any single character from a specific set.

For example, the pattern `[abc]` matches `'a'`, `'b'`, or `'c'`.

Let's extend our pattern matcher to support positive character groups.

> NOTE: We have collected the check for the `\w` pattern into a separate helper function for clarity.

You can update `matchPattern` in your `matcher.go` file to add support for `[...]` character groups.

## How Character Group Matching Works

When given a positive character group `[<characters>]` and a target input line:
- If the line contains at least one character that appears inside the brackets, the match succeeds (`true`).
- If none of the characters inside the brackets appear in the line, the match fails (`false`).
- Patterns containing `\w`, `\d`, and single literal characters should continue to work.

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"apple"` | `"[abc]"` | `true` | Contains `'a'` |
| `"cab"` | `"[abc]"` | `true` | Contains `'c'`, `'a'`, and `'b'` |
| `"cat"` | `"[aeiou]"` | `true` | Contains vowel `'a'` |
| `"dog"` | `"[abc]"` | `false` | Does not contain `'a'`, `'b'`, or `'c'` |
| `"rhythm"` | `"[aeiou]"` | `false` | Contains no vowels |
| `"apple"` | `"\w"` | `true` | Still matches word class `\w` |
| `"item_42"` | `"\d"` | `true` | Still matches digit class `\d` |
| `"dog"` | `"d"` | `true` | Still matches literal character `"d"` |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Return `true` if `pattern` is a positive character group `[...]` and `line` contains any character from within the brackets.

From earlier exercises we already:
- Return `true` if `pattern` is `\w` and `line` contains any word character (`a`-`z`, `A`-`Z`, `0`-`9`, or `_`).
- Return `true` if `pattern` is `\d` and `line` contains any digit (`0`-`9`).
- Return `true` if `pattern` is a single literal character that appears anywhere in `line`.
- Return `false` otherwise. If `pattern` is empty, return `true`.
