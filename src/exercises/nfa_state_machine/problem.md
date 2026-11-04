A **Non-deterministic Finite Automaton (NFA)** is a directed graph of states connected by transitions. Unlike a Deterministic Finite Automaton (DFA) which must have exactly one transition per input symbol, an NFA can have:
- Multiple possible transitions for the same symbol.
- **ε-transitions** (epsilon transitions): transitions that jump to another state without consuming any input character.

In Ken Thompson's classic design, every state has at most **two** outgoing arrows (`Out` and `Out1`). This keeps the data structure compact and bounded:

1. **Character / Matcher state**:
   Matches an input character or class (literal rune, wildcard `.`, digit `\d`, or word character `\w`). When the condition is met, it advances along `Out`. `Out1` is `nil`.
2. **Split state (ε-transition)**:
   Has two outgoing arrows (`Out` and `Out1`). The machine branches simultaneously to both destinations without consuming any input character (used for alternation `|` and repetition `*`, `+`, `?`).
3. **Match state**:
   The accepting state signifying that the pattern has matched successfully. It has no outgoing arrows (`Out == nil` and `Out1 == nil`).

## The State Struct

```go
const (
    StateMatch = -1 // Accepting match state
    StateSplit = -2 // Epsilon-branching split state
    StateDot   = -3 // Wildcard '.'
    StateDigit = -4 // Digit '\d'
    StateWord  = -5 // Word character '\w'
)

type State struct {
    Kind int // rune (>= 0), or StateMatch, StateSplit, StateDot, StateDigit, StateWord
    Out  *State
    Out1 *State
    ID   int
}
```

In this exercise, we implement the state constructors, rune matching predicate, and graph traversal utilities to prepare for Thompson's NFA construction algorithm.

### Examples

```go
match := NewMatchState(1)
charA := NewCharState(2, 'a', match)
charB := NewCharState(3, 'b', match)
split := NewSplitState(4, charA, charB) // branches to 'a' or 'b'

MatchesRune(charA, 'a') // true
MatchesRune(charA, 'b') // false
MatchesRune(split, 'a') // false (split states do not consume characters)

CollectStates(split)         // returns [split, charA, match, charB] (4 states)
IsReachable(split, match)    // true
IsReachable(charA, charB)    // false
```

---

## Problem Statement

Implement `NewMatchState`, `NewSplitState`, `NewCharState`, `NewClassState`, `MatchesRune`, `CollectStates`, and `IsReachable` in the editor on the right:

```go
func NewMatchState(id int) *State
func NewSplitState(id int, out, out1 *State) *State
func NewCharState(id int, r rune, out *State) *State
func NewClassState(id int, kind int, out *State) *State
func MatchesRune(s *State, r rune) bool
func CollectStates(start *State) []*State
func IsReachable(start *State, target *State) bool
```

The functions should:
- Correctly initialize state kinds and transitions.
- Check rune matching against literal runes and character classes (`\d`, `\w`, `.`).
- Traverse states safely handling cycles without infinite recursion.
- Return all reachable states from a given starting state.
