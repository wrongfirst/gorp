---
language: c
badge: c
aliases: [c]
---

## Bit Intrinsics (GCC/Clang & C23 <stdbit.h>)
```c
unsigned int x = 42;
unsigned long long big = 1ULL << 40;

// GCC/Clang built-in intrinsics (non-standard compiler extensions):
int count    = __builtin_popcount(x);
int count_ll = __builtin_popcountll(big);
int lz       = __builtin_clz(x); // Note: undefined behavior if x == 0!
int tz       = __builtin_ctz(x); // Note: undefined behavior if x == 0!

// C23 standard alternatives (<stdbit.h> - safe for all values):
#if __STDC_VERSION__ >= 202311L
#include <stdbit.h>
unsigned int c = stdc_count_ones(x);
unsigned int l = stdc_leading_zeros(x);
unsigned int t = stdc_trailing_zeros(x);
#endif

// Portable software popcount fallback (Kernighan's algorithm):
int popcount_portable(unsigned int v) {
    int c = 0;
    for (; v; c++) v &= (v - 1);
    return c;
}
```
Executes hardware-accelerated bit operations via compiler intrinsics or standard C23 `<stdbit.h>`, with fallback portable bit counting.

## Reverse Iteration & Unsigned Underflow Pitfall
```c
#include <stddef.h>

size_t n = 10;
int arr[10];

// PITFALL: Infinite loop because size_t is unsigned (i >= 0 is always true):
// for (size_t i = n - 1; i >= 0; i--) { ... } // BUG: underflows to SIZE_MAX!

// Idiomatic C post-decrement pattern (safe for unsigned types):
for (size_t i = n; i-- > 0; ) {
    arr[i] = (int)i;
}

for (ptrdiff_t i = (ptrdiff_t)n - 1; i >= 0; i--) {
    arr[i] = (int)i;
}
```
Iterates backwards over unsigned collections safely without triggering unsigned integer underflow into infinite loops.

## Bit Manipulation Tricks & Submasks
```c
int is_pow2 = (x > 0) && !(x & (x - 1));
int lowest_bit = x & -x;
int cleared = x & (x - 1);

for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
    process(sub);
}
```
Executes elementary bitwise operations in $O(1)$ time for state compression and bitmask dynamic programming.

## Math: GCD, LCM & Modular Exponentiation
```c
long long gcd(long long a, long long b) {
    while (b != 0) {
        long long t = b;
        b = a % b;
        a = t;
    }
    return a;
}

long long lcm(long long a, long long b) {
    return (a / gcd(a, b)) * b;
}

long long mod_pow(long long base, long long exp, long long mod) {
    long long res = 1;
    base %= mod;
    while (exp > 0) {
        if (exp & 1) res = (res * base) % mod;
        base = (base * base) % mod;
        exp >>= 1;
    }
    return res;
}
```
Computes number-theoretic primitives in logarithmic time via Euclidean algorithm and binary exponentiation.
