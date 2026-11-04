Now that we have constructed an NFA using Thompson's algorithm, how do we execute it?

In recursive backtracking, the engine explores one path at a time. If it hits a dead end, it rewinds. When a pattern has ambiguous branches, this depth-first strategy leads to exponential time $O(2^N)$.

Thompson's insight was to execute the NFA **in lockstep (breadth-first)**:
Instead of tracking one state and backtracking on failure, we track the **set of all active states** at the current position in the input string simultaneously:

```
Input: "ab"

Position 0: Active states = { Start } (expanded via epsilon transitions)
Read 'a':   Filter states that match 'a', advance to Out -> Active states = { s_b }
Read 'b':   Filter states that match 'b', advance to Out -> Active states = { MatchState }
End:        MatchState is active -> MATCH SUCCEEDED!
```

Because an NFA with $S$ states can have at most $S$ active states at any time, processing each input character takes at most $O(S)$ operations. For an input string of length $N$, the entire match runs in **guaranteed $O(N \times S)$ time** — completely eliminating catastrophic backtracking!

## Lockstep Simulation Algorithm

1. **Epsilon Closure (`addState`)**:
   When adding a state to the active list:
   - Check a `visited map[*State]bool` to avoid infinite loops on epsilon cycles and duplicate states.
   - If `s.Kind == StateSplit`: recursively add `s.Out` and `s.Out1` without consuming an input character.
   - Otherwise: append `s` to the active state list.

2. **Step (`step`)**:
   For each character `r` in the input string:
   - Create an empty `nextList` and a fresh `visited` map.
   - For every state `s` in `currentList`:
     - If `MatchesRune(s, r)`: add `s.Out` to `nextList` via `addState`.
   - Replace `currentList` with `nextList`.

3. **Anchored vs Unanchored Matching**:
   - In **anchored matching** (`anchored = true`), matching must start at index 0 and end after consuming the text.
   - In **unanchored matching** (`anchored = false`), a match can begin anywhere. Before consuming each character, we also re-add `start` to `currentList`.

4. **Acceptance (`isMatch`)**:
   After processing the characters, the string matches if any state in `currentList` has `s.Kind == StateMatch`.

---

## Problem Statement

Implement `SimulateNFA` and `SimulateNFAWithMetrics` in the editor on the right:

```go
type SimulationMetrics struct {
    Matched           bool
    TransitionsTested int
}

func SimulateNFA(start *State, text string, anchored bool) bool
func SimulateNFAWithMetrics(start *State, text string, anchored bool) SimulationMetrics
```

The functions should:
- Maintain active states in lockstep using `addState` and cycle-preventing visited tracking.
- Correctly evaluate anchored (`anchored = true`) and unanchored (`anchored = false`) matching.
- Track total transition tests performed in `SimulationMetrics`.
- Accurately determine whether `start` accepts `text`.
