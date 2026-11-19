---
language: python
badge: py
aliases: [py, python]
---

## Bitwise Manipulation & Tricks
```python
is_power_of_two = (x > 0) and (x & (x - 1) == 0)
lowest_bit = x & -x
cleared = x & (x - 1)
count = x.bit_count()
length = x.bit_length()
```
Executes elementary bitwise operations in $O(1)$ time for state compression and bit testing.

## Subset Bitmask Iteration
```python
for mask in range(1 << n):
    subset = [items[i] for i in range(n) if (mask & (1 << i))]

# Iterate submasks of a specific mask:
sub = mask
while sub > 0:
    process(sub)
    sub = (sub - 1) & mask

import itertools
for r in range(n + 1):
    for subset in itertools.combinations(items, r):
        pass
```
Enumerates subsets and submasks in $O(2^n)$ and $O(3^n)$ total time across all submasks. The bitmask approach is common in competitive programming for state compression (e.g., bitmask DP); use `itertools.combinations` for general Python code.

## Math: GCD, LCM & Combinatorics
```python
import math

g = math.gcd(48, 18)
l = math.lcm(12, 15)
combinations = math.comb(n, k) # n! / (k! * (n-k)!)
permutations = math.perm(n, k) # n! / (n-k)!
```
Built-in Euclidean algorithm and combinatorics functions implemented in C for $O(\log(\min(a, b)))$ efficiency.

## Modular Arithmetic & Modular Inverse
```python
MOD = 1_000_000_007

# Fast modular exponentiation: (base ** exp) % MOD
result = pow(base, exp, MOD)

# Modular multiplicative inverse (when MOD is prime):
inv = pow(val, MOD - 2, MOD) # Fermat's Little Theorem
```
Calculates modular powers and inverses in $O(\log(\text{exp}))$ time via binary exponentiation.

## Integer Division & Negative Modulo
```python
# Floor division (//) rounds towards -infinity:
pos = 7 // 2
neg = -7 // 2     # -4 (NOT -3 like C++/Java!)

# Truncation towards zero (matching C++/Java):
trunc = int(-7 / 2)

# Negative modulo: always non-negative for positive divisor (ideal for circular indices):
prev_idx = (-1) % 5
```
Distinguishes Python's floor division from truncation towards zero, and highlights non-negative modulo behavior for circular array indexing.

## Fast I/O Setup *(Competitive Programming)*
```python
import sys

input = sys.stdin.readline

def read_all():
    return sys.stdin.read().split()
```
Replaces standard `input()` to avoid per-call buffer overhead when reading large competitive programming input streams. This is a **competitive programming–specific** pattern with no general application outside online judge environments.
