In regular expressions, character groups `[...]` can define a **range of characters** using a hyphen `-` between two characters (for example, `[a-z]`).

Instead of writing out every character like `[0123456789]` or `[abcdefghijklmnopqrstuvwxyz]`, you can write `[0-9]` or `[a-z]`. A range matches any character whose ASCII/Unicode value falls between the starting and ending characters (inclusive).

Common single ranges include:
- `[a-z]`: matches any lowercase letter from `'a'` to `'z'`.
- `[A-Z]`: matches any uppercase letter from `'A'` to `'Z'`.
- `[0-9]`: matches any digit from `'0'` to `'9'`.
- `[a-e]`: matches any letter between `'a'` and `'e'` (`'a'`, `'b'`, `'c'`, `'d'`, or `'e'`).

For example:
- `c[a-e]t`: matches `"cat"`, `"cbt"`, and `"cet"`, but does **not** match `"cut"` or `"cot"`.
- `[0-9][0-9][0-9]`: matches three consecutive digits (like `"555"`).
- `[a-z][0-9]`: matches a lowercase letter followed immediately by a digit (like `"a1"`).

Let's extend our pattern matcher to support single character ranges inside brackets.

## How Character Range Matching Works

1. **Detecting Ranges**:
   - Inside a bracket group `[...]`, check if the content contains three characters in the form `start-end` (for example, `a-z` or `0-9`).
   - Extract `start := group[0]` and `end := group[2]`.

2. **Evaluating the Range**:
   - A character `char` falls within the range if:
     ```go
     char >= start && char <= end
     ```
   - If the group does not contain a range (e.g. `[abc]`), fall back to checking if the character is contained in the group as before.

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"cat"` | `"c[a-e]t"` | `true` | `'a'` is between `'a'` and `'e'` |
| `"cet"` | `"c[a-e]t"` | `true` | `'e'` is between `'a'` and `'e'` |
| `"cut"` | `"c[a-e]t"` | `false` | `'u'` is outside `'a'`–`'e'` |
| `"item 3"` | `"item [0-9]"` | `true` | `'3'` is between `'0'` and `'9'` |
| `"item x"` | `"item [0-9]"` | `false` | `'x'` is not a digit |
| `"CODE_A"` | `"CODE_[A-Z]"` | `true` | `'A'` is between `'A'` and `'Z'` |
| `"CODE_a"` | `"CODE_[A-Z]"` | `false` | `'a'` is lowercase (outside `'A'`–`'Z'`) |
| `"room b2"` | `"[a-z][0-9]"` | `true` | `'b'` matches `[a-z]` and `'2'` matches `[0-9]` |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support single character ranges `[start-end]` inside brackets (e.g. `[a-z]`, `[0-9]`, `[A-Z]`, `[a-e]`).
- Continue supporting individual character groups (`[abc]`), negative character groups (`[^abc]`), `\d`, `\w`, and literal character sequences.
- Return `false` otherwise. If `pattern` is empty, return `true`.
