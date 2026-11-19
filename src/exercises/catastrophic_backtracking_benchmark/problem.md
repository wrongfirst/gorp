Recursive backtracking engines suffer from exponential worst-case time complexity (ReDoS) on ambiguous patterns with adjacent or nested quantifiers (e.g. `^a*a*a*a*b$` or `^(a+)+$`). Track computational cost by counting recursive matching steps.

## Examples

```go
CountBacktrackSteps("hello", "^hello$")
// => MatchStepResult{Matched: true, StepCount: 6} (deterministic linear match)

CountBacktrackSteps("aaaa", "^a+b$")
// => MatchStepResult{Matched: false, StepCount: 5} (fast failure)

CountBacktrackSteps("aaaa", "^a*a*a*a*b$")
// => MatchStepResult{Matched: false, StepCount: 126} (adjacent quantifiers backtrack)

IsCatastrophic("aaaaaaaa", "^a?a?a?a?a?a?a?a?b$", 256)
// => true (exponential branching: 511 steps >= 256)
```

---

## Instructions

Implement `CountBacktrackSteps` and `IsCatastrophic`:

- Handle leading `^` and trailing `$` anchors (scanning from each start position when `^` is absent), and return `Matched: true, StepCount: 0` if `pattern` is empty.
- Increment `StepCount` once for each recursive matching call made while matching `pattern` against `line`.
- Return `true` in `IsCatastrophic` if `StepCount >= maxSteps`.
