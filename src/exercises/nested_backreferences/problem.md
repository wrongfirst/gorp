Capturing groups can be nested, numbered strictly by the order of their opening parentheses `(`:

```text
  (  ( hello )   ( world )  )
  ^  ^           ^
  1  2           3
```

- Group 1: `((hello) (world))` -> `"hello world"`
- Group 2: `(hello)` -> `"hello"`
- Group 3: `(world)` -> `"world"`

## Examples

```go
matchPattern("hello world hello world hello", `((hello) (world)) \1 \2`) // true (\1="hello world", \2="hello")
matchPattern("hello world world", `((hello) (world)) \3`)                 // true (\3 matches inner "world")
matchPattern("hello world other", `((hello) (world)) \2`)                 // false
matchPattern("'cat' 'cat' cat", `^('([^']*)') \1 \2$`)                   // true (outer has quotes, inner does not)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support nested capturing groups `((...) (...))` numbered by opening parenthesis order.
- Support single-digit backreferences (`\1`–`\9`) referencing any outer or inner capturing group; a backreference to an unmatched/optional group fails to match (`false`).
- Retain existing support for quantifiers, anchors, alternation, wildcard, escaped metacharacters (`\.`, `\[`, `\]`, `\\`), and character classes.
- Return `false` otherwise. If `pattern` is empty, return `true`.
