In regular expressions, capturing groups can be **nested inside one another**.

When groups are nested, they are numbered strictly by the order in which their **opening parentheses** `(` appear from left to right:

```
  (  ( hello )   ( world )  )
  ^  ^           ^
  |  |           |
  1  2           3
```

In this example:
- **Group 1** is the outer group `((hello) (world))`, which captures the full string `"hello world"`.
- **Group 2** is the first inner group `(hello)`, which captures `"hello"`.
- **Group 3** is the second inner group `(world)`, which captures `"world"`.

Later in the regex:
- `\1` matches the full `"hello world"`.
- `\2` matches `"hello"`.
- `\3` matches `"world"`.

### Practical Examples of Nested Groups

1. **Quoted Strings and Contents**:
   - `^('([^']*)') \1 \2$`:
     - Group 1 captures the quoted string including quotes: `'test'`
     - Group 2 captures the inner content without quotes: `test`
     - Matches: `"'test' 'test' test"`
2. **Key-Value Pairs with Outer Enclosure**:
   - `(\[(\w+)=(\w+)\]) \1 \2`:
     - Group 1 captures `"[key=val]"`
     - Group 2 captures `"key"`
     - Group 3 captures `"val"`
3. **Compound Words & Prefixes**:
   - `((re)(\w+)) \1 \2 \3`:
     - Group 1 captures the entire word (e.g. `"restart"`)
     - Group 2 captures the prefix (`"re"`)
     - Group 3 captures the base (`"start"`)

Let's extend our pattern matcher to support nested capturing groups and their backreferences.

## How Nested Backreferences Work

1. **Opening Parentheses Numbering**:
   - Assign group IDs sequentially (1, 2, 3...) whenever an opening parenthesis `(` is encountered.
   - Push each group ID onto a stack to maintain nesting hierarchy.

2. **Closing Parentheses Scoping**:
   - Whenever a closing parenthesis `)` is encountered, pop the group ID from the stack.
   - The captured text for that group spans from the position where its `(` was matched up to the current position.

3. **Backreference Matching**:
   - `\1`, `\2`, `\3`, etc., resolve the corresponding group's captured substring from left-to-right parenthetical ordering.

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"hello world hello world hello"` | `"((hello) (world)) \\1 \\2"` | `true` | `\1` is `"hello world"`, `\2` is `"hello"` |
| `"hello world world"` | `"((hello) (world)) \\3"` | `true` | `\3` is `"world"` |
| `"hello world other"` | `"((hello) (world)) \\2"` | `false` | Text following does not match `\2` |
| `"'cat' 'cat' cat"` | `"^('([^']*)') \\1 \\2$"` | `true` | Group 1 is `'cat'`, Group 2 is `cat` |
| `"[a=1] [a=1] a 1"` | `"^(\\[(\\w+)=(\\d+)\\]) \\1 \\2 \\3$"` | `true` | Three nested levels matched |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right.

The function should:
- Support nested capturing groups `((...) (...))` numbered by opening parenthesis order.
- Support backreferences `\1`, `\2`, `\3`, etc., referencing any outer or inner capturing group.
- Continue supporting all previously implemented regex features: quantifiers, anchors, alternation, wildcard, and character classes.
- Return `false` otherwise. If `pattern` is empty, return `true`.
