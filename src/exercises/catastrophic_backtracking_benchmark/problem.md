Up to this point, our regex engine has relied on **recursive backtracking** (implemented in `matchAt`). When matching an input string against a regular expression, the matcher attempts to consume characters greedily and recursively proceeds. If a downstream token fails to match, it rewinds (backtracks) and tries shorter matches or alternative branches.

For simple patterns, recursive backtracking feels instantaneous. However, it harbors a fatal algorithmic flaw known as **Catastrophic Backtracking** (or **ReDoS** — Regular Expression Denial of Service).

When a pattern contains multiple adjacent quantifiers (e.g. `^a*a*a*a*b$`) or nested quantifiers (e.g. `^(a+)+$`), the number of ways to partition the input string among the quantifiers grows **exponentially** with the length of the string:

```text
Pattern: ^a*a*a*a*b$
Input:   "aaaa" (no 'b' exists!)

Branch 1: a* takes 4, remaining fail -> backtrack
Branch 2: a* takes 3, next a* takes 1, ...
Branch 3: a* takes 2, next a* takes 2, ...
...
Every possible combination is exhaustively tested before reporting failure!
```

For `N` characters with 4 adjacent quantifiers, the recursive engine evaluates `O(N^4)` paths. With nested quantifiers like `(a+)+`, the complexity explodes to `O(2^N)`! An input of just 30 characters can trigger over a billion function calls, freezing a CPU core for hours.

In this exercise, we instrument our backtracking engine to track its computational cost by counting how many times `matchAt` is invoked.

## How Step Counting Works

1. Maintain a counter (`steps *int`) that increments by `1` every time `matchAt` (or `matchAtCounted`) is called.
2. Return a `MatchStepResult`:
   ```go
   type MatchStepResult struct {
       Matched   bool
       StepCount int
   }
   ```
3. Implement `CountBacktrackSteps(line string, pattern string) MatchStepResult`:
   - Parses `pattern`.
   - Initializes a step counter to `0`.
   - Executes the backtracking match and increments the counter on every recursive attempt.
   - Returns the match outcome and the total calls made.
4. Implement `IsCatastrophic(line string, pattern string, maxSteps int) bool`:
   - Returns `true` if `CountBacktrackSteps` executed `maxSteps` or more recursive calls.

### Examples

| Pattern | Input | Matched | Step Count | Explanation |
| :--- | :--- | :--- | :--- | :--- |
| `"^hello$"` | `"hello"` | `true` | ~6 | Deterministic linear match (1 step per token) |
| `"^a+b$"` | `"aaaa"` | `false` | ~5 | Fast failure: single quantifier tries lengths 4, 3, 2, 1 |
| `"^a*a*a*a*b$"` | `"aaaa"` | `false` | 126 | 4 adjacent quantifiers exhaustively backtrack |
| `"^a*a*a*a*b$"` | `"aaaaaaaa"` | `false` | 715 | Doubling input length more than quintuples the steps |
| `"^a?a?a?a?a?a?a?a?b$"` | `"aaaaaaaa"` | `false` | 256+ | Exponential branching: `2^8` combinations tested |

---

## Problem Statement

Implement `CountBacktrackSteps` and `IsCatastrophic` in the editor on the right:

```go
type MatchStepResult struct {
    Matched   bool
    StepCount int
}

func CountBacktrackSteps(line string, pattern string) MatchStepResult
func IsCatastrophic(line string, pattern string, maxSteps int) bool
```

The functions should:
- Correctly count each invocation of `matchAt` (or recursive matching attempt).
- Accurately determine whether `pattern` matches `line`.
- Detect when step counts exceed `maxSteps`.
