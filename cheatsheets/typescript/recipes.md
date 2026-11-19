---
language: typescript
badge: ts
aliases: [ts, typescript, js, javascript]
---

## Bitwise Flags & Permission Masks
```typescript
const READ    = 1 << 0;
const WRITE   = 1 << 1;
const EXECUTE = 1 << 2;

let perms = READ | WRITE;

const canWrite = (perms & WRITE) !== 0;

perms &= ~WRITE;

perms ^= EXECUTE;
```
Manages composite boolean states and access control flags efficiently using bitwise mask arithmetic.

## Bit Manipulation Tricks
```typescript
const isPowerOfTwo = (x: number) => x > 0 && (x & (x - 1)) === 0;

const lowestBit = x & -x;

const cleared = x & (x - 1);
```
Executes elementary bitwise arithmetic in $O(1)$ time.

## 32-Bit Truncation & Unsigned Coercion (>>> 0)
```typescript
const signed = -1;
const unsigned = signed >>> 0; // coerces to unsigned 32-bit integer
```
Converts numbers into unsigned 32-bit representations and enforces integer boundaries.

## BigInt for Large Numbers
```typescript
const MOD = 1000000007n;

// BigInt operations require explicit 'n' suffix:
const bigA = 10n ** 18n;
const bigB = 2n;
const prod = (bigA * bigB) % MOD;

const asNumber = Number(prod);
```
Performs arbitrary-precision integer arithmetic without 64-bit float precision loss beyond `Number.MAX_SAFE_INTEGER` ($2^{53} - 1$).

## Math: GCD, LCM & Modular Exponentiation
```typescript
function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

// Fast modular exponentiation (base^exp % mod):
// Note: this is primarily a competitive-programming pattern;
// production code needing this would typically use a crypto library.
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let res = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) res = (res * base) % mod;
    base = (base * base) % mod;
    exp /= 2n;
  }
  return res;
}
```
Computes number-theoretic primitives in $O(\log(\min(a, b)))$ and $O(\log(\text{exp}))$ time.
