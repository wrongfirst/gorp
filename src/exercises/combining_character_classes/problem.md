So far, our pattern matcher evaluated patterns that contained only a single character or a single character class (`\d`, `\w`, `[abc]`, `[^abc]`, or a single literal).

In real-world regular expressions, patterns combine multiple character classes and literals in sequence, such as:
- `\d \w\w\w` (a digit, followed by a space, followed by 3 word characters, like `"1 dog"`, `"3 cats"`)
- `[abc]\d_` (one of `'a'`, `'b'`, `'c'`, followed by a digit, followed by an underscore)
- `\d\d\d-\d\d\d` (three digits, hyphen, three digits)

Let's upgrade our pattern matcher to parse patterns into individual tokens and match sequences of tokens anywhere within a line.

> NOTE: Breaking down your pattern into a list of parsed tokens (such as `\d`, `\w`, `[...]`, `[^...]`, or a literal rune) and matching them position-by-position makes your matcher robust and ready for future chapters.

You can update `matchPattern` and add helper functions in your `matcher.go` file.

## How Sequential Pattern Matching Works

1. **Parse the Pattern into Tokens**:
   - `\d` or `\w`: Escape sequence token (2 characters)
   - `[^...]`: Negative character group token
   - `[...]`: Positive character group token
   - Any other character: Single literal character token

2. **Match Anywhere in the Line**:
   - Try matching the full sequence of tokens starting at each character index `i` in the target line.
   - If every token matches the corresponding character starting at index `i`, the match succeeds (`true`).
   - If no starting index matches the complete sequence, the match fails (`false`).

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"I have 3 dogs"` | `"\d \w\w\w\w"` | `true` | Matches `"3 dogs"` (`\d`, space, and 4 `\w`) |
| `"item_a1_end"` | `"[abc]\d"` | `true` | Matches `"a1"` |
| `"code_z9"` | `"[^abc]\d"` | `true` | Matches `"z9"` (`'z'` is not in `[abc]`, followed by `'9'`) |
| `"I have no dogs"` | `"\d \w\w\w\w"` | `false` | No digit followed by 4 word characters |
| `"item_d1_end"` | `"[abc]\d"` | `false` | `'d'` is not in `[abc]` |
| `"apple"` | `"\w\w\w"` | `true` | Matches `"app"`, `"ppl"`, etc. |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Parse `pattern` into a sequence of tokens (`\d`, `\w`, `[...]`, `[^...]`, and literal characters).
- Return `true` if the sequence of tokens matches a contiguous sequence of characters anywhere in `line`.
- Return `false` otherwise. If `pattern` is empty, return `true`.
