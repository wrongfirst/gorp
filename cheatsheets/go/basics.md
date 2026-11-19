---
language: go
badge: go
aliases: [go, golang]
---

## Slice Operations (Make, Append, Sub-Slice)
```go
nums := make([]int, 0, 10)
nums = append(nums, 1, 2, 3)
sub := nums[1:3]
nums = append(nums, sub...)
```
Constructs dynamically sized array views with preallocated capacity, appending elements and slicing without memory reallocation.

## Map Operations & Comma-Ok Idiom
```go
counts := make(map[string]int)
counts["apple"] = 5

// Comma-ok test distinguishes missing keys from zero-values:
val, ok := counts["apple"]
delete(counts, "apple")
```
Initializes hash tables and validates key existence safely without sentinel zero-value ambiguity.

## Multiple Return Values & Error Handling
```go
import (
    "errors"
    "fmt"
)

func parseData(raw string) (string, error) {
    if raw == "" {
        return "", errors.New("empty input payload")
    }
    return raw, nil
}

res, err := parseData(input)
if err != nil {
    return fmt.Errorf("parsing failed: %w", err) // %w wraps error for errors.Is/As
}
```
Propagates errors explicitly as return values, adhering to Go's standard control-flow error conventions.

## Defer for Resource Cleanup
```go
file, err := os.Open("data.txt")
if err != nil {
    return err
}
defer file.Close()
```
Defers execution of a function call until the surrounding function exits, ensuring reliable cleanup.

## Range Loops with Blank Identifier
```go
for idx, val := range items {
    fmt.Printf("%d: %v\n", idx, val)
}

for _, val := range items {
    process(val)
}

for k, v := range counts {
    fmt.Println(k, v)
}
```
Iterates over slices, arrays, maps, strings, and channels using the blank identifier `_` to suppress unused index compiler errors.

## Pointers & Memory Allocation
```go
x := 42
p := &x
*p = 100

ptr := new(int)
```
Manipulates memory addresses directly and passes pointers to functions to avoid copying large structures and allow in-place mutations.

## Structs and Receiver Methods
```go
type Counter struct {
    count int
}

// Pointer receiver: mutates receiver state
func (c *Counter) Increment() {
    c.count++
}

// Value receiver: operates on a read-only copy
func (c Counter) Value() int {
    return c.count
}
```
Defines composite data types with methods, using pointer receivers to mutate fields and avoid copying large structs.

## Struct Embedding (Composition)
```go
type BaseEntity struct {
    ID        string
    CreatedAt time.Time
}

type User struct {
    BaseEntity
    Username string
}

u := User{
    BaseEntity: BaseEntity{ID: "usr_123"},
    Username:   "alice",
}
fmt.Println(u.ID)
```
Implements object composition by embedding inner structs directly, promoting code reuse without class hierarchies.

## Interfaces & Implicit Satisfaction
```go
type Stringer interface {
    String() string
}

type Point struct {
    X, Y int
}

func (p Point) String() string {
    return fmt.Sprintf("(%d, %d)", p.X, p.Y)
}
```
Defines behavioral contracts satisfied implicitly by any type implementing the required method signatures.

## Type Assertions & Type Switches
```go
var val any = "hello"

if str, ok := val.(string); ok {
    fmt.Println("String:", str)
}

switch v := val.(type) {
case int:
    fmt.Println("Integer:", v)
case string:
    fmt.Println("String:", v)
}
```
Inspects dynamic concrete types stored inside `any` (or `interface{}`) safely using assertions and switch statements.

## Enums with const and iota
```go
type Status int

const (
    Pending Status = iota
    Active
    Complete
    Failed
)
```
Creates strongly typed enumerations using Go's `iota` sequential constant generator.

## String Building & Conversions
```go
import (
    "strconv"
    "strings"
)

var b strings.Builder
b.WriteString("hello ")
b.WriteString("world")
res := b.String()

num, err := strconv.Atoi("42")
str := strconv.Itoa(100)
```
Concatenates strings efficiently through byte buffers and converts between numbers and strings.

## Goroutines, Channels & Select
```go
ch := make(chan int, 2)

go func() {
    ch <- 42
    close(ch)
}()

select {
case msg, ok := <-ch:
    if ok {
        fmt.Println("Received:", msg)
    }
case <-time.After(1 * time.Second):
    fmt.Println("Timed out")
}
```
Executes concurrent lightweight goroutines and coordinates synchronization with channels and multiplexed `select` blocks.

## Generics & Type Constraints
```go
type Number interface {
    ~int | ~int64 | ~float64
}

func Min[T Number](a, b T) T {
    if a < b {
        return a
    }
    return b
}

func Keys[K comparable, V any](m map[K]V) []K {
    keys := make([]K, 0, len(m))
    for k := range m {
        keys = append(keys, k)
    }
    return keys
}
```
Defines parameterized types and functions (Go 1.18+) using `any`, `comparable`, or union constraints with the `~` underlying type operator.

## Concurrency Synchronization (sync Package)
```go
import "sync"

var wg sync.WaitGroup
for _, id := range []int{1, 2, 3} {
    wg.Add(1)
    go func(i int) {
        defer wg.Done()
        process(i)
    }(id)
}
wg.Wait()

var mu sync.RWMutex
var cache = make(map[string]int)

mu.Lock()
cache["k"] = 42
mu.Unlock()

mu.RLock()
val := cache["k"]
mu.RUnlock()

var once sync.Once
once.Do(func() { initResource() })
```
Coordinates goroutine completion with `sync.WaitGroup`, guards concurrent state with `Mutex`/`RWMutex`, and ensures single-execution setup with `sync.Once`.

## Context & Cancellation (context Package)
```go
import (
    "context"
    "time"
)

ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
defer cancel()

go func(ctx context.Context) {
    select {
    case <-time.After(500 * time.Millisecond):
        // Work completed
    case <-ctx.Done():
        err := ctx.Err()
        _ = err
        return
    }
}(ctx)
```
Propagates deadlines, cancellation signals, and request-scoped metadata across goroutine call trees.

## Error Wrapping & Inspection (errors Package)
```go
import (
    "errors"
    "fmt"
    "io/fs"
    "os"
)

var ErrNotFound = errors.New("resource not found")

wrappedErr := fmt.Errorf("database query failed: %w", ErrNotFound)

if errors.Is(wrappedErr, ErrNotFound) {
    fmt.Println("Target sentinel error found in chain")
}

var pathErr *fs.PathError
if errors.As(wrappedErr, &pathErr) {
    fmt.Println("Path that failed:", pathErr.Path)
}
```
Inspects wrapped error hierarchies using `errors.Is` for sentinel matching and `errors.As` for typed error extraction.

## Package Visibility & init() Lifecycle
```go
package service

type Config struct {
    Port    int    // Exported field
    secret  string // Unexported field
}

func internalSetup() {}

func init() {
    // Executes package setup
}
```
Governs symbol visibility through identifier capitalization (Uppercase exports, lowercase keeps package-private) and runs initialization before `main()` via `init()`.

## Closures & Variable Capture
```go
func makeCounter() func() int {
    count := 0
    return func() int {
        count++
        return count
    }
}

for i := 0; i < 3; i++ {
    // Go 1.22+: 'i' is scoped per iteration (goroutines see intended value).
    // Go < 1.22: 'i' was shared across iterations, requiring explicit 'i := i' shadowing!
    go func() {
        fmt.Println(i)
    }()
}
```
Captures outer variables by reference in closures, with Go 1.22+ guaranteeing per-iteration loop variable scoping to eliminate concurrent capture traps.

## Panic & Recover
```go
import "log"

func safeOperation() {
    defer func() {
        if r := recover(); r != nil {
            log.Printf("recovered from panic: %v", r)
        }
    }()

    panic("unexpected fatal condition")
}
```
Catches runtime panics and fatal exceptions gracefully during deferred stack unwinding to prevent process crashes.

## String Formatting Verbs (fmt Package)
```go
import "fmt"

type Point struct{ X, Y int }
pt := Point{1, 2}

fmt.Printf("%v\n", pt)   // Default format
fmt.Printf("%+v\n", pt)  // Includes struct field names
fmt.Printf("%#v\n", pt)  // Go-syntax representation
fmt.Printf("%T\n", pt)   // Type name

fmt.Printf("%d\n", 42)     // Decimal integer
fmt.Printf("%b\n", 42)     // Binary representation
fmt.Printf("%s\n", "text") // Raw string
fmt.Printf("%q\n", "text") // Quoted string
fmt.Printf("%.2f\n", 3.14) // Float with precision
```
Controls string interpolation and type inspection using `fmt.Sprintf` and `fmt.Printf` format specifiers.

## Common String Utilities (strings Package)
```go
import "strings"

s := "  apple,banana,orange  "

trimmed := strings.TrimSpace(s)
parts := strings.Split(trimmed, ",")
joined := strings.Join(parts, "; ")

has := strings.Contains(trimmed, "banana")
pre := strings.HasPrefix(trimmed, "app")
suf := strings.HasSuffix(trimmed, "ge")
replaced := strings.ReplaceAll(trimmed, ",", "|")
```
Performs common string manipulation, trimming, tokenization, substring querying, and replacements via standard library helpers.

## Slice Backing Arrays & Full Slice Expressions
```go
orig := []int{1, 2, 3, 4, 5}

sub := orig[1:3]

// HAZARD: append within capacity overwrites orig[3]!
sub = append(sub, 99)

// Full slice expression [low:high:max] restricts capacity:
safeSub := orig[1:3:3]
safeSub = append(safeSub, 100) // Forces new backing array allocation
```
Prevents unintended mutations to shared backing arrays by constraining slice capacity with 3-index slicing `[low:high:max]`.

## Zero Values & Useful Defaults
```go
import (
    "bytes"
    "sync"
)

// Types are guaranteed to initialize to their zero values:
var num int
var flag bool
var str string
var slice []int       // nil (valid for len, cap, and append)
var m map[string]int  // nil (reads return 0; writes require make)

// Idiomatic types are ready-to-use in their zero state:
var buf bytes.Buffer  // Ready for buf.WriteString() without constructor
var mu sync.Mutex     // Ready for mu.Lock() without initialization
```
Leverages guaranteed zero-value initialization, writing types whose zero state is valid and directly usable without explicit constructors.

## Streaming I/O (io.Reader & io.Writer)
```go
import (
    "bytes"
    "io"
    "strings"
)

r := strings.NewReader("stream payload")
data, err := io.ReadAll(r)

src := strings.NewReader("piped input")
var dst bytes.Buffer
written, err := io.Copy(&dst, src)
```
Composes input/output pipelines through foundational `io.Reader` and `io.Writer` streaming abstractions.

## Testing & Table-Driven Tests (testing Package)
```go
package mypkg

import "testing"

func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive numbers", 2, 3, 5},
        {"zero identity", 2, 0, 2},
        {"negative numbers", 2, -3, -1},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := Add(tt.a, tt.b)
            if got != tt.expected {
                t.Errorf("Add(%d, %d) = %d; want %d", tt.a, tt.b, got, tt.expected)
            }
        })
    }
}
```
Structures unit tests using Go's built-in `testing` runner with idiomatic table-driven test cases and `t.Run` subtests.
