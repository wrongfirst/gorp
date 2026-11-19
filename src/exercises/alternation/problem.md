The vertical bar `|` represents alternation (logical OR), matching either the left or right subpattern. Alternation can be used at the top level (`cat|dog`) or inside parentheses (`(cat|dog)`).

## Examples

```go
matchPattern("I have a cat", "cat|dog")         // true (matches "cat")
matchPattern("I have a fish", "cat|dog")        // false (neither alternative matches)
matchPattern("I love dogs!", "I love (cats|dogs)!") // true (matches grouped branch "dogs")
matchPattern("cat", "^(cat|dog)$")             // true (anchored alternation)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support alternation using `|` both at top level (`cat|dog`) and inside parentheses (`(cat|dog)`).
- Top-level `|` has lower precedence than anchors (`^cat|dog$` matches lines starting with `cat` or ending with `dog`; use `^(cat|dog)$` to anchor both branches).
- Support multiple alternatives (e.g., `(apple|banana|cherry)`) and quantifiers following parenthesized groups (e.g., `(cat|dog)s?`).
- Retain support for anchors, quantifiers, wildcard, and character classes.
- Return `false` otherwise. If `pattern` is empty, return `true`.
