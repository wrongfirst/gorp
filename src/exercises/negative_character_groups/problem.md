In regular expressions, you can invert a character group by placing a caret `^` right after the opening bracket: `[^...]`.

A negative character group matches **any character that is NOT in the specified set**.

For example, the pattern `[^abc]` matches any character except `'a'`, `'b'`, or `'c'`.

Let's extend our pattern matcher to support negative character groups.

You can update `matchPattern` in your `matcher.go` file to add support for `[^...]` character groups.

## How Negative Character Group Matching Works

When given a negative character group `[^<characters>]` and a target input line:
- If the line contains at least one character that does not appear inside the brackets, the match succeeds (`true`).
- If every character in the line is present in the brackets (or if the line is empty), the match fails (`false`).
- Patterns containing `[...]`, `\w`, `\d`, and single literal characters should continue to work.

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"dog"` | `"[^abc]"` | `true` | `'d'`, `'o'`, `'g'` are not in `[abc]` |
| `"apple"` | `"[^abc]"` | `true` | `'p'`, `'l'`, `'e'` are not in `[abc]` |
| `"cab"` | `"[^abc]"` | `false` | All characters `'c'`, `'a'`, `'b'` are in `[abc]` |
| `"c"` | `"[^abc]"` | `false` | Only character `'c'` is in `[abc]` |
| `"cat"` | `"[^aeiou]"` | `true` | Consonants `'c'` and `'t'` are not vowels |
| `"aeio"` | `"[^aeiou]"` | `false` | All characters are vowels |
| `"apple"` | `"[abc]"` | `true` | Still matches positive group `[abc]` |
| `"item_42"` | `"\d"` | `true` | Still matches digit class `\d` |
| `"dog"` | `"d"` | `true` | Still matches literal character `"d"` |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Return `true` if `pattern` is a negative character group `[^...]` and `line` contains any character not inside the brackets.

From earlier exercises we already:
- Return `true` if `pattern` is a positive character group `[...]` and `line` contains any character from within the brackets.
- Return `true` if `pattern` is `\w` and `line` contains any word character (`a`-`z`, `A`-`Z`, `0`-`9`, or `_`).
- Return `true` if `pattern` is `\d` and `line` contains any digit (`0`-`9`).
- Return `true` if `pattern` is a single literal character that appears anywhere in `line`.
- Return `false` otherwise. If `pattern` is empty, return `true`.
