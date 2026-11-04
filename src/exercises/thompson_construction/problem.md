In 1968, Ken Thompson published his landmark paper introducing the algorithm that compiles regular expressions into NFAs in guaranteed linear time $O(N)$ with $O(N)$ states.

The algorithm consumes a regular expression in **Postfix Notation** (from Exercise 3) and processes it from left to right using a stack of **NFA fragments**:

```go
type Frag struct {
    Start *State
    Out   []**State // pointers to dangling arrow targets to be patched
}
```

A fragment represents an incomplete sub-automaton with:
- An entry state (`Start`).
- A list of dangling outgoing arrows (`Out`). Each arrow is stored as `**State` — a pointer to a `*State` field — so that when downstream states are created, all dangling arrows can be connected (**patched**) instantly in $O(1)$ without searching:

```go
func patch(l []**State, s *State) {
    for _, ptr := range l {
        *ptr = s
    }
}
```

## Thompson's Construction Rules

For each token in the postfix stream:

1. **Operand** (Literal rune, Wildcard `.`, Digit `\d`, Word `\w`):
   - Allocate state `s` matching the token.
   - Push `Frag{Start: s, Out: []**State{&s.Out}}`.

2. **Concatenation (`TokConcat`, `·`)**:
   - Pop `e2`, Pop `e1`.
   - Patch `e1`'s dangling arrows to enter `e2.Start`: `patch(e1.Out, e2.Start)`.
   - Push `Frag{Start: e1.Start, Out: e2.Out}`.

3. **Alternation (`TokAlter`, `|`)**:
   - Pop `e2`, Pop `e1`.
   - Allocate a split state branching to both: `s := NewSplitState(id, e1.Start, e2.Start)`.
   - Push `Frag{Start: s, Out: append(e1.Out, e2.Out...)}`.

4. **Zero or more (`TokStar`, `*`)**:
   - Pop `e`.
   - Allocate split state: `s := NewSplitState(id, e.Start, nil)`.
   - Loop `e`'s exits back to `s`: `patch(e.Out, s)`.
   - Push `Frag{Start: s, Out: []**State{&s.Out1}}`.

5. **One or more (`TokPlus`, `+`)**:
   - Pop `e`.
   - Allocate split state: `s := NewSplitState(id, e.Start, nil)`.
   - Connect `e`'s exits into `s`: `patch(e.Out, s)`.
   - Push `Frag{Start: e.Start, Out: []**State{&s.Out1}}`.

6. **Zero or one (`TokQuest`, `?`)**:
   - Pop `e`.
   - Allocate split state: `s := NewSplitState(id, e.Start, nil)`.
   - Push `Frag{Start: s, Out: append(e.Out, &s.Out1)}`.

7. **Completion**:
   - Pop the final fragment `e`.
   - Create the accepting `matchState := NewMatchState(id)`.
   - Connect `patch(e.Out, matchState)`.
   - Return `e.Start`!

---

## Problem Statement

Implement `Post2NFA` and `CompileToNFA` in the editor on the right:

```go
func Post2NFA(postfix []Token) (*State, error)
func CompileToNFA(pattern string) (*State, error)
```

The functions should:
- Maintain a stack of `Frag`s and patch dangling pointers correctly according to Thompson's rules.
- Connect the final fragment's dangling arrows to a newly created `StateMatch`.
- Return the starting state `*State` of the assembled NFA.
- Return an error if the postfix expression is invalid (e.g. stack underflow or empty expression).
