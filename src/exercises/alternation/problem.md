In regular expressions, the vertical bar `|` represents **alternation** (logical OR). It allows a pattern to match one of multiple subpatterns.

Alternation can be used:
1. **Top-level**: `cat|dog` matches any line containing either `"cat"` or `"dog"`.
2. **Within parentheses**: `(cat|dog)` confines the alternation to a specific part of a pattern, such as `I love (cats|dogs)!` or `^(cat|dog)$`.
3. **Multiple options**: `(apple|banana|cherry)` matches any of the three choices.

Let's extend our pattern matcher to support alternation.

## How Alternation Works

1. **Grouped Alternation `(...)`**:
   - Locate the parenthesized group `(option1|option2|...)`.
   - The pattern succeeds if any candidate formed by substituting one of the options matches the input line.

2. **Top-Level Alternation `|`**:
   - If the pattern contains `|` outside of any parentheses (e.g. `cat|dog` or `^cat|dog$`), split the pattern by top-level `|`.
   - The match succeeds if any alternative matches the line.

3. **Combined with Anchors and Quantifiers**:
   - `^(cat|dog)$`: Matches only if the whole string is `"cat"` or `"dog"`.
   - `\d+ (cats?|dogs?)`: Matches `"3 cats"`, `"1 dog"`, etc.

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"I have a cat"` | `"cat\|dog"` | `true` | Matches `"cat"` |
| `"I have a dog"` | `"cat\|dog"` | `true` | Matches `"dog"` |
| `"I have a fish"` | `"cat\|dog"` | `false` | Neither alternative matches |
| `"I love cats!"` | `"I love (cats\|dogs)!"` | `true` | Matches option `"cats"` |
| `"I love dogs!"` | `"I love (cats\|dogs)!"` | `true` | Matches option `"dogs"` |
| `"I love birds!"` | `"I love (cats\|dogs)!"` | `false` | `"birds"` is not an option |
| `"cat"` | `"^(cat\|dog)$"` | `true` | Entire string is `"cat"` |
| `"cats"` | `"^(cat\|dog)$"` | `false` | Neither exact `"cat"` nor `"dog"` |
| `"3 dogs"` | `"^\d+ (cat\|dog)s?$"` | `true` | Digit quantifier combined with alternation |
| `"category"` | `"^cat\|dog$"` | `true` | Matches `^cat` alternative |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support alternation using `|`, both top-level (`cat|dog`) and inside parentheses (`(cat|dog)`).
- Support multiple alternatives (`(apple|banana|cherry)`).
- Seamlessly integrate with anchors (`^`, `$`), quantifiers (`+`, `?`), wildcard (`.`), and character classes (`\d`, `\w`, `[...]`, `[^...]`).
- Return `false` otherwise. If `pattern` is empty, return `true`.
