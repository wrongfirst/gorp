In all previous chapters, matching lines in `grep` was tightly coupled to a single function: `matchPattern(line, pattern) bool`.

As our codebase evolves to support multiple pattern matching engines (such as our upcoming **Thompson NFA** engine), hardcoding a specific matching function creates unnecessary friction. In production systems like the Go standard library (`regexp`), pattern compilation is decoupled from execution via clean **interfaces**.

By introducing an interface abstraction:
1. Callers (like `grep`, file search, line highlighting) depend only on `Matcher` and `RegexEngine` interfaces.
2. We can plug in, test, and benchmark different engines (Backtracking, Thompson NFA, DFA) interchangeably without rewriting business logic.

## The Matcher Interfaces

```go
// Matcher represents a compiled regular expression ready to match strings.
type Matcher interface {
    Match(text string) bool
    Pattern() string
}

// RegexEngine abstracts the compilation of regex patterns into Matchers.
type RegexEngine interface {
    Compile(pattern string) (Matcher, error)
}
```

In this exercise, we refactor our recursive backtracking engine into a concrete implementation of these interfaces:
- `BacktrackingMatcher`: Implements `Matcher`. Stores pre-parsed tokens and anchor configurations.
- `BacktrackingEngine`: Implements `RegexEngine`. Parses patterns into a `BacktrackingMatcher`.
- `GrepWithEngine(engine RegexEngine, pattern string, lines []string) ([]string, error)`: Filters input lines using any engine that satisfies `RegexEngine`.

### Examples

```go
engine := NewBacktrackingEngine()
matcher, err := engine.Compile("^error:")
if err != nil {
    log.Fatal(err)
}

matcher.Match("error: file not found") // returns true
matcher.Match("info: ready")           // returns false
matcher.Pattern()                      // returns "^error:"

lines := []string{"error: failed", "warning: retry", "error: timeout"}
results, _ := GrepWithEngine(engine, "^error:", lines)
// results == ["error: failed", "error: timeout"]
```

---

## Problem Statement

Implement the `Matcher` and `RegexEngine` interfaces along with `BacktrackingMatcher`, `BacktrackingEngine`, and `GrepWithEngine` in the editor on the right:

```go
type Matcher interface {
    Match(text string) bool
    Pattern() string
}

type RegexEngine interface {
    Compile(pattern string) (Matcher, error)
}

func NewBacktrackingEngine() *BacktrackingEngine
func GrepWithEngine(engine RegexEngine, pattern string, lines []string) ([]string, error)
```

The implementation should:
- Implement `Match(text string) bool` and `Pattern() string` on `*BacktrackingMatcher`.
- Implement `Compile(pattern string) (Matcher, error)` on `*BacktrackingEngine`.
- Enable `GrepWithEngine` to compile `pattern` via `engine` and return all lines for which `matcher.Match(line)` is `true`.
