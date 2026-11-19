Compile postfix regex tokens into a connected NFA in linear time `O(N)` using Ken Thompson's fragment-based construction.

## Construction Rules
- **Operand** (literal, `.`, `\d`, `\w`): creates a matcher state with one unresolved outgoing transition.
- **Concatenation (`·`)**: connects the first fragment's unresolved exits to the second fragment's start state.
- **Alternation (`|`)**: introduces a split state branching to both fragments, combining their unresolved exits.
- **Zero or more (`*`)**: introduces a split state branching to the fragment or bypassing it, looping the fragment's exits back to that split state.
- **One or more (`+`)**: runs the fragment first, then uses a split state to loop back to the fragment's start or continue onward.
- **Zero or one (`?`)**: introduces a split state branching to the fragment or bypassing it, combining both exit paths.
- **Completion**: connects the final unresolved exits to an accepting match state.

## Examples

```go
nfa, _ := CompileToNFA("ab")
// start matches 'a', transitions to state matching 'b', then transitions to Match state

nfa, _ = CompileToNFA("a|b")
// start is a Split state branching to 'a' and 'b', both leading to Match state
```

---

## Instructions

Implement `patch`, `Post2NFA`, and `CompileToNFA`:

- Track dangling outgoing transitions for each compiled fragment and resolve them once their target state is known.
- Connect the final fragment's dangling exits to a newly created match state.
- Return the starting `*State` of the assembled NFA.
- Return an error if the postfix expression is invalid or empty.
