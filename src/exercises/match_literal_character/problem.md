A literal pattern matches if the character or literal substring exists anywhere within the input line.

## Examples

```go
matchPattern("dog", "d")   // true ('d' is present)
matchPattern("cat", "d")   // false
matchPattern("apple", "pp") // true (literal substring matches anywhere in the line)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Return `true` if the literal character or substring in `pattern` appears anywhere in `line`.
- Return `false` otherwise.
- Return `true` if `pattern` is empty.
