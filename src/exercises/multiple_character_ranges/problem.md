Character groups can combine multiple ranges and individual characters within a single set of brackets (for example, `[a-zA-Z]`, `[0-9a-fA-F]`, or `[a-z0-9-]`).

## Examples

```go
matchPattern("Hello", "[a-zA-Z][a-zA-Z]")               // true (matches "He")
matchPattern("0x4Z", "0x[0-9a-fA-F][0-9a-fA-F]")       // false ('Z' is not a valid hex digit)
matchPattern("file-1", "[a-z0-9-]")                     // true (matches literal hyphen at boundary)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support multiple ranges within a single bracket group (e.g., `[a-zA-Z]`, `[0-9a-fA-F]`).
- Support mixing ranges with literal characters (e.g., `[a-z0-9_]`, `[-a-z]`, `[a-z-]`).
- Retain support for existing character classes and sequences.
- Return `false` otherwise. If `pattern` is empty, return `true`.
