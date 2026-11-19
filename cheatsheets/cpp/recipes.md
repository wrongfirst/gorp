---
language: cpp
badge: cpp
aliases: [cpp, c++, cplusplus]
---

## Bit Intrinsics: Standard <bit> & Compiler Builtins
```cpp
#include <bit>

unsigned int x = 42;
unsigned long long big = 1ULL << 40;

// Standard C++20 portable intrinsics (<bit>):
int count = std::popcount(x);          // Number of set bits
int lz = std::countl_zero(x);          // Leading zeros count
int tz = std::countr_zero(x);          // Trailing zeros count
bool pow2 = std::has_single_bit(x);    // Power of two check

// GCC / Clang compiler intrinsics (pre-C++20):
int c_gcc = __builtin_popcount(x);
int lz_gcc = __builtin_clz(x);
int tz_gcc = __builtin_ctz(x);
```
Executes single-cycle hardware CPU bit operations using portable C++20 `<bit>` primitives or GCC/Clang built-in intrinsics.

## Bit Manipulation Tricks & Submask Iteration
```cpp
bool is_pow2 = (x > 0) && !(x & (x - 1));
int lowest_bit = x & -x;
int cleared = x & (x - 1);

// Iterate through all submasks of mask (O(3^N) across all masks):
for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
    process(sub);
}
```
Executes elementary bitwise operations in $O(1)$ time for state compression and bitmask dynamic programming.

## Math: GCD & LCM (<numeric>)
```cpp
#include <numeric>

long long g = std::gcd(48LL, 18LL);
long long l = std::lcm(12LL, 15LL);
```
Built-in Euclidean algorithm in `<numeric>` computing greatest common divisor and least common multiple in $O(\log(\min(a, b)))$ time.

## Fast Modular Exponentiation & Inverse
```cpp
constexpr long long MOD = 1'000'000'007LL;

// (base^exp) % MOD in O(log exp) time:
long long power(long long base, long long exp) {
    long long res = 1;
    base %= MOD;
    while (exp > 0) {
        if (exp % 2 == 1) res = (res * base) % MOD;
        base = (base * base) % MOD;
        exp /= 2;
    }
    return res;
}

// Modular inverse when MOD is prime (Fermat's Little Theorem):
long long modInverse(long long n) {
    return power(n, MOD - 2);
}
```
Computes large powers and modular division in logarithmic time via binary exponentiation.

## Competitive Programming Type Aliases & Helpers
```cpp
#include <utility>
#include <vector>

using ll = long long;
using pii = std::pair<int, int>;
using vi = std::vector<int>;
using vll = std::vector<long long>;

#define all(x) (x).begin(), (x).end()
#define sz(x) (static_cast<int>((x).size()))
```
Provides standard shorthand aliases and macros to streamline repetitive type definitions in competitive programming contexts.

## Fast I/O & Stream Synchronization
```cpp
#include <iostream>

int main() {
    // 1. Disable synchronization between C and C++ standard streams:
    std::ios_base::sync_with_stdio(false);

    // 2. Untie std::cin from std::cout (prevents auto-flushing before reading):
    std::cin.tie(nullptr);

    // 3. Prefer '\n' over std::endl (std::endl forces an explicit buffer flush)
    return 0;
}
```
Maximizes stream I/O throughput by decoupling standard C I/O buffers and suppressing automatic output flushing on input.
