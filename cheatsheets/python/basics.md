---
language: python
badge: py
aliases: [py, python]
---

## List Comprehension
```python
squares = [x**2 for x in range(10) if x % 2 == 0]
```
Constructs a new list by mapping and filtering expressions over an iterable.

## Dictionary & Set Comprehension
```python
index_map = {item: idx for idx, item in enumerate(items)}
unique_squares = {x**2 for x in nums}
```
Constructs a new hash map or hash set from an iterable expression in $O(N)$ time.

## Enumerate with Index
```python
for idx, item in enumerate(items, start=0):
    print(f"{idx}: {item}")

indexed = {word: i for i, word in enumerate(words)}
```
Iterates over elements while maintaining a running counter, supporting an optional `start` offset. Using `enumerate` in comprehensions avoids a manual counter variable.

## Zip Multiple Iterables
```python
names = ["Alice", "Bob"]
scores = [85, 92]
roster = dict(zip(names, scores))
```
Pairs items from two or more iterables in lockstep, truncating at the shortest input sequence.

## Slicing Syntax
```python
rev = items[::-1]
sub = items[1:5:2]
head = items[:3]
```
Extracts a shallow copy of a sub-sequence from a list, tuple, or string in $O(K)$ time for slice length $K$.

## Unpacking and Splat
```python
first, *middle, last = numbers
combined = {**defaults, **overrides}

a, b = b, a
```
Unpacks sequences into target variables with extended wildcard splats and merges dictionaries. The tuple-swap idiom relies on Python evaluating the right-hand side fully before assignment.

## Tuples & Hashable State Keys
```python
point = (r, c)
single = (42,) # (42) without trailing comma evaluates as an integer!

visited = set()
visited.add((r, c))
memo[(i, rem_weight)] = best_val
```
Tuples are immutable sequences that, unlike lists, can be hashed to serve as coordinates in sets or multi-variable state keys in memoization dictionaries.

## Any and All Predicates
```python
has_valid = any(x > 0 for x in values)
all_valid = all(x > 0 for x in values)
```
Lazily short-circuits boolean evaluations over an iterable.

## Sort with Custom Key
```python
# Multi-attribute sort (ascending age, descending score):
sorted_users = sorted(users, key=lambda u: (u["age"], -u["score"]))
```
Performs a stable $O(N \log N)$ Timsort, customized using a projection key function.

## Walrus Operator (:=)
```python
if (n := len(items)) > 10:
    print(f"Batch too large: {n}")
```
Assigns values to variables within an expression, avoiding duplicate function calls or evaluations.

## Lambda Functions
```python
sorted_users = sorted(users, key=lambda u: u["age"])

evens = [x for x in nums if x % 2 == 0]

evens = list(filter(is_even, nums))
```
Lambda expressions create anonymous single-expression functions. Use lambdas for inline use as sort keys or callbacks where the expression is short and self-evident.

## Dictionary Missing Keys & Membership
```python
if "timeout" in config:
    val = config["timeout"]

val = config.get("timeout", 30)

tags = config.setdefault("tags", [])
tags.append("active")
```
Handles absent keys cleanly via membership testing, fallback defaults, or in-place initialization.

## Exception & Error Handling
```python
try:
    val = mapping[key]
    parsed = int(val)
except KeyError:
    parsed = default_val
except (ValueError, TypeError) as err:
    print(f"Conversion failed: {err}")
    raise  # Re-raise exception if unrecoverable
else:
    print("Success: runs only when no exception was raised")
finally:
    print("Cleanup: always runs regardless of outcome")
```
Captures and manages runtime exceptions, differentiates error types, and ensures proper cleanup execution.

## ASCII & Character Conversions
```python
code = ord('c')
alphabet_idx = ord('c') - ord('a') # 0-based offset from 'a'
char = chr(ord('a') + alphabet_idx)

word = ''.join(['a', 'b', 'c'])
```
`ord()` and `chr()` are Python's idiomatic way to work with character arithmetic. Unlike C's `char + 1`, Python has no implicit character type — `ord`/`chr` make the intent explicit and portable.

## String Formatting (f-strings)
```python
padded = f"{num:02d}"
fixed_w = f"{num:5d}"

decimal = f"{ratio:.2f}"

binary_str = f"{val:08b}"
hex_str = f"{val:x}"
```
Interpolates numbers with fixed padding, specified decimal precision, and binary/hexadecimal representations.

## Shallow vs Deep Copy
```python
import copy

shallow = original.copy()
deep = copy.deepcopy(original)
```
Duplicates structures safely, preventing unintentional shared mutations in 2D matrices and graphs.

## *args and **kwargs
```python
def log(message: str, *args, **kwargs):
    print(message.format(*args))
    for key, val in kwargs.items():
        print(f"  {key}={val}")

log("Values: {} {}", 1, 2, level="INFO", source="main")

nums = [1, 2, 3]
print(*nums)
result = add(**{"x": 1, "y": 2})
```
`*args` captures variadic positional arguments as a tuple; `**kwargs` captures variadic keyword arguments as a dict. The splat operators also unpack iterables/dicts at call sites.

## Type Hints
```python
from typing import Optional, Union

def greet(name: str, times: int = 1) -> str:
    return ("Hello, " + name + "! ") * times

def find(items: list[int], target: int) -> Optional[int]:
    for i, v in enumerate(items):
        if v == target:
            return i
    return None

def stringify(val: int | float) -> str:
    return str(val)
```
Type hints annotate function signatures and variables for static analysis (mypy, Pyright) and IDE support. They are **not enforced at runtime** — use `isinstance()` for runtime validation.

## Ternary / Conditional Expression
```python
status = "even" if x % 2 == 0 else "odd"
label  = "empty" if not items else f"{len(items)} items"

clipped = [x if x > 0 else 0 for x in values]
```
Single-expression conditional evaluation. Prefer this form for short, readable conditions; use a full `if/else` block when the logic is complex.

## String Methods
```python
s = "  Hello, World!  "

s.strip()                        # strip whitespace
s.lower()
s.replace("World", "Python")

parts  = "a,b,c".split(",")
joined = ",".join(parts)

"file.py".startswith("file")
"file.py".endswith(".py")

"123".isdigit()
"abc".isalpha()
```
Built-in string methods return new strings (strings are immutable). `.join()` is the idiomatic way to concatenate many strings — far more efficient than repeated `+` in a loop.
