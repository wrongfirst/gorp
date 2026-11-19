---
language: go
badge: go
aliases: [go, golang]
---

## Bit Manipulation with math/bits
```go
import "math/bits"

count := bits.OnesCount(uint(x))

lz := bits.LeadingZeros(uint(x))
tz := bits.TrailingZeros(uint(x))

isPow2 := x > 0 && (x&(x-1)) == 0
lowest := x & -x
cleared := x & (x - 1)
```
Executes hardware-accelerated bitwise operations and bitmask inspections using standard library primitives.

## Math: GCD, LCM & Modular Exponentiation
```go
func gcd(a, b int) int {
    for b != 0 {
        a, b = b, a%b
    }
    return a
}

func lcm(a, b int) int {
    return (a / gcd(a, b)) * b
}

func modPow(base, exp, mod int64) int64 {
    var res int64 = 1
    base %= mod
    for exp > 0 {
        if exp%2 == 1 {
            res = (res * base) % mod
        }
        base = (base * base) % mod
        exp /= 2
    }
    return res
}
```
Computes number-theoretic primitives in logarithmic time via Euclidean algorithm and binary exponentiation.

## High-Throughput Buffered I/O (bufio)
```go
import (
    "bufio"
    "os"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    // Enlarge buffer if lines can exceed default 64KB:
    scanner.Buffer(make([]byte, 1024*1024), 1024*1024)

    // Buffered writer to minimize syscall overhead (remember to Flush!):
    writer := bufio.NewWriter(os.Stdout)
    defer writer.Flush()

    for scanner.Scan() {
        line := scanner.Text()
        writer.WriteString(line + "\n")
    }
}
```
Replaces unbuffered `fmt.Scan` and `fmt.Print` syscalls with high-throughput buffered streaming for files, network streams, and large dataset processing.
