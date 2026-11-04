In regular expressions, the question mark `?` is a quantifier that means **match zero or one times** (making the preceding token optional).

It applies to the immediately preceding element (a literal character, an escape sequence like `\d` or `\w`, or a character group `[...]`).

For example:
- `colou?r`: matches `"color"` (0 `'u'`s) and `"colour"` (1 `'u'`), but does **not** match `"colouur"`.
- `dogs?`: matches `"dog"` and `"dogs"`.
- `^-?\d+$`: matches signed or unsigned integers like `"42"` or `"-42"`.
- `https?`: matches `"http"` and `"https"`.

Let's extend our pattern matcher to support the `?` quantifier alongside `+`.

## How the Question Mark Quantifier Works

1. **Tokenization with `?`**:
   - Check if the character following the token is `?`.
   - Mark the token as matching zero or one times.

2. **Matching Zero or One**:
   - First, if the current character matches the token, try consuming 1 character and matching the rest of the pattern.
   - If that does not lead to a match (or if the character does not match), try consuming 0 characters (skip the token) and matching the rest of the pattern.
   - If neither leads to a successful match, the match fails.

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"color"` | `"colou?r"` | `true` | Matches with 0 `'u'`s |
| `"colour"` | `"colou?r"` | `true` | Matches with 1 `'u'` |
| `"colouur"` | `"colou?r"` | `false` | Contains 2 `'u'`s |
| `"dogs"` | `"dogs?"` | `true` | Matches with 1 `'s'` |
| `"dog"` | `"dogs?"` | `true` | Matches with 0 `'s'` |
| `"-123"` | `"^-?\d+$"` | `true` | Leading minus matched |
| `"123"` | `"^-?\d+$"` | `true` | Leading minus skipped (0 times) |
| `"+123"` | `"^-?\d+$"` | `false` | `'+'` is not `'-'` or a digit |
| `"cat"` | `"ca+t"` | `true` | `+` quantifier continues to work |
| `"ct"` | `"ca+t"` | `false` | `+` requires at least one occurrence |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support the `?` quantifier matching zero or one occurrence of the preceding literal or character class (`\d`, `\w`, `[...]`, `[^...]`).
- Continue supporting the `+` quantifier, anchors (`^`, `$`), and all previous pattern features.
- Return `false` otherwise. If `pattern` is empty, return `true`.
