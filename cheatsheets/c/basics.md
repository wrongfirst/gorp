---
language: c
badge: c
aliases: [c]
---

## Pointers & Dereferencing
```c
int val = 42;
int *ptr = &val;
*ptr = 100;

int arr[3] = {10, 20, 30};
int *next = arr + 1;
```
Manipulates raw memory addresses directly using address-of `&`, dereference `*`, and type-scaled pointer arithmetic.

## Const Correctness & Pointer Semantics
```c
int x = 10, y = 20;

// Pointer to const int (data is immutable; pointer can rebind):
const int *p1 = &x;
// *p1 = 30;     // Error: assignment of read-only location
p1 = &y;         // OK

// Const pointer to int (data is mutable; pointer address is immutable):
int *const p2 = &x;
*p2 = 30;        // OK
// p2 = &y;      // Error: assignment of read-only variable

// Const pointer to const int (both pointer and pointee are immutable):
const int *const p3 = &x;
```
Enforces immutability constraints at compile time by distinguishing between read-only pointee data and read-only pointer addresses.

## Dynamic Memory Allocation (malloc, calloc, realloc, free)
```c
#include <stdlib.h>

int *arr = malloc(n * sizeof(int));
if (arr == NULL) return -1;

int *zeroed = calloc(n, sizeof(int));

int *tmp = realloc(arr, new_cap * sizeof(int));
if (tmp != NULL) arr = tmp;

free(arr);
arr = NULL;
```
Manages heap allocations manually; always check for `NULL` returns and pair allocations with `free()` to prevent resource leaks.

## Memory Manipulation (memset, memcpy, memmove)
```c
#include <string.h>

int arr[5];
memset(arr, 0, sizeof(arr));
memset(arr, -1, sizeof(arr));

int dest[5];
memcpy(dest, arr, sizeof(arr));

memmove(arr + 1, arr, 4 * sizeof(int));
```
Manipulates raw byte sequences directly in memory; use `memcpy` for non-overlapping buffers and `memmove` when source and destination buffers may overlap.

## Generic Pointers (void *) & Casting
```c
#include <stdio.h>

void print_value(const void *ptr, char type) {
    if (type == 'i') {
        printf("%d\n", *(const int *)ptr);
    } else if (type == 'f') {
        printf("%.2f\n", *(const float *)ptr);
    }
}

int num = 42;
print_value(&num, 'i');
```
Enables type-agnostic APIs and generic data structures by representing untyped memory addresses that implicitly convert to and from any object pointer.

## Structs, Typedefs & Designated Initializers
```c
typedef struct {
    int x;
    int y;
} Point;

Point p = { .x = 10, .y = 20 };

Point *ptr = &p;
ptr->x = 15;
```
Defines composite data structures with `typedef` aliases and accesses members directly with `.` or via pointers with `->`.

## Compound Literals & Flexible Array Members (C99)
```c
#include <stdlib.h>

typedef struct {
    int x, y;
} Point;

Point p = (Point){ .x = 10, .y = 20 };

// Flexible array member: trailing unsized array in dynamic struct:
typedef struct {
    size_t len;
    int data[]; // Flexible array member (must be the last member)
} Buffer;

Buffer *buf = malloc(sizeof(Buffer) + 10 * sizeof(int));
buf->len = 10;
buf->data[0] = 42;
free(buf);
```
Constructs anonymous objects in-place with compound literals and enables variable-sized heap allocations via C99 flexible array members.

## Enums & Bitwise Flags
```c
typedef enum {
    READ    = 1 << 0,
    WRITE   = 1 << 1,
    EXECUTE = 1 << 2
} Permission;

int perms = READ | WRITE;
int has_read = (perms & READ);
perms &= ~WRITE;
```
Combines and inspects orthogonal binary flags using strongly-named `enum` constants and bitwise masking.

## Fixed-Width Integers (<stdint.h>, <inttypes.h>)
```c
#include <stdint.h>
#include <inttypes.h>
#include <stdio.h>

int32_t count = -42;
uint64_t large_val = UINT64_MAX;
uint8_t byte = 0xFF;

printf("Count: %" PRId32 ", Big: %" PRIu64 "\n", count, large_val);
```
Guarantees exact bit widths across architectures and provides portable format specifiers for printing fixed-width types.

## Safe String Operations (snprintf, strncpy)
```c
#include <stdio.h>
#include <string.h>

char buffer[64];
snprintf(buffer, sizeof(buffer), "User: %s (id: %d)", name, uid);

char dest[32];
strncpy(dest, src, sizeof(dest) - 1);
dest[sizeof(dest) - 1] = '\0';
```
Formats and copies bounded character strings to prevent buffer overflow vulnerabilities.

## Array Decay to Pointers in Functions
```c
size_t count = sizeof(arr) / sizeof(arr[0]);

void process(const int *arr, size_t len) {
    for (size_t i = 0; i < len; i++) {
        // ...
    }
}
```
Computes static array element count with `sizeof`; arrays decay to raw pointers across function call boundaries.

## Pointer Aliasing & restrict Qualifier (C99)
```c
// 'restrict' promises the compiler that dest, a, and b do NOT overlap in memory:
void vec_add(int *restrict dest, const int *restrict a, const int *restrict b, size_t n) {
    for (size_t i = 0; i < n; i++) {
        dest[i] = a[i] + b[i]; // Enables compiler loop vectorization (SIMD)
    }
}
```
Informs the compiler that pointers reference disjoint memory regions, enabling aggressive optimizations such as loop vectorization and register caching.

## Function Pointers
```c
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }

// Function pointer declaration: return_type (*name)(param_types)
int (*operation)(int, int) = add;
int result = operation(10, 5);
```
Stores addresses of executable functions in pointer variables, enabling dynamic callbacks and comparator passing.

## The static Keyword (Linkage, Lifetime & Hints)
```c
// 1. File-scope: internal linkage (private to this translation unit)
static int file_private_var = 100;
static void helper(void) { /* hidden from linker */ }

// 2. Function-scope: static storage duration (persists across calls)
int next_id(void) {
    static int counter = 0; // Initialized once before program startup
    return ++counter;
}

// 3. Array parameter hint (C99): guarantees array has at least 4 elements
void process_quad(const int values[static 4]) {
    // Compiler can assume values != NULL and contains >= 4 elements
}
```
Controls symbol visibility with internal linkage, preserves local state across function invocations, and specifies minimum array sizes to the optimizer.

## Preprocessor Directives & Macro Pitfalls
```c
// Header guard / conditional compilation:
#ifndef CONFIG_H
#define CONFIG_H
#define BUFFER_SIZE 1024
#endif

// Function-like macro: ALWAYS wrap parameters and body in parentheses
#define SQUARE(x) ((x) * (x))

// PITFALL: Macro arguments with side-effects evaluate multiple times!
int a = 5;
int bad = SQUARE(a++); // Expands to: ((a++) * (a++)) -> UB / double increment!

// Stringification (#) and token pasting (##):
#define STRINGIFY(x) #x
#define CONCAT(a, b) a##b
```
Performs text-level substitution and conditional compilation before parsing; requires disciplined parenthesization to prevent operator precedence and double-evaluation bugs.

## Header Files, Declarations & Linkage
```c
// math_utils.h (Interface):
#pragma once // Modern include guard
extern int g_call_count;             // Variable declaration (defined in .c)
int add(int a, int b);               // Function prototype (declaration)

// math_utils.c (Implementation):
#include "math_utils.h"
int g_call_count = 0;                // Variable definition (allocates storage)
int add(int a, int b) {              // Function definition
    g_call_count++;
    return a + b;
}
```
Separates declarations from definitions across compilation units, using `extern` for shared symbols and include guards to prevent redefinition errors.

## Formatted I/O (printf, scanf)
```c
#include <stdio.h>

printf("Int: %d, Size: %zu, Hex: 0x%X, Ptr: %p\n", num, sz, hex, ptr);

int val;
if (scanf("%d", &val) == 1) {
    // ...
}
```
Reads and writes formatted input and output using standard specifiers like `%d` (int), `%zu` (`size_t`), and `%p` (pointer).

## File I/O (fopen, fread, fwrite, fclose)
```c
#include <stdio.h>

FILE *fp = fopen("output.txt", "w");
if (fp == NULL) return -1;
fprintf(fp, "Score: %d\n", 100);
fclose(fp);

FILE *bin = fopen("data.bin", "rb");
if (bin != NULL) {
    int buffer[10];
    size_t items_read = fread(buffer, sizeof(int), 10, bin);
    fclose(bin);
}
```
Manages buffered stream I/O for text and binary data, verifying file pointer handles and tracking the number of items transferred.

## Defensive Assertions (<assert.h>)
```c
#include <assert.h>

int divide(int a, int b) {
    assert(b != 0 && "Divisor must not be zero");
    return a / b;
}

// In production builds, define NDEBUG before <assert.h> or via -DNDEBUG
// to strip all assert() statements without runtime overhead:
// #define NDEBUG
```
Verifies internal invariants and preconditions during development, aborting with file and line diagnostics when violated, and can be disabled globally via `NDEBUG`.

## Error Handling Patterns (errno, perror, strerror)
```c
#include <stdio.h>
#include <errno.h>
#include <string.h>

FILE *f = fopen("nonexistent.txt", "r");
if (f == NULL) {
    // errno holds the error code set by the failed standard library call:
    perror("fopen failed");
    fprintf(stderr, "Error %d: %s\n", errno, strerror(errno));
    return -1;
}
fclose(f);
```
Propagates and inspects standard runtime errors via return codes and the thread-local `errno` global, producing human-readable error descriptions.

## Variadic Functions (<stdarg.h>)
```c
#include <stdio.h>
#include <stdarg.h>

int sum_all(int count, ...) {
    va_list args;
    va_start(args, count);

    int total = 0;
    for (int i = 0; i < count; i++) {
        total += va_arg(args, int);
    }

    va_end(args);
    return total;
}

int result = sum_all(3, 10, 20, 30);
```
Accepts a variable number of arguments at runtime using `va_list` traversal macros.
