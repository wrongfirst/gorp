---
language: typescript
badge: ts
aliases: [ts, typescript, js, javascript]
---

## Optional Chaining & Nullish Coalescing
```typescript
const timeout = config?.network?.timeout ?? 5000;
const userName = user?.profile?.getName?.() ?? "Anonymous";
```
Safely accesses deeply nested properties without runtime exceptions, falling back to a default value only when `null` or `undefined` (preserving `0` and `""`).

## Object & Array Destructuring
```typescript
const { name: fullName, age = 18, ...restProps } = person;

const [first, second, ...remaining] = items;

const merged = { ...defaults, ...overrides };
const cloned = [...items, newItem];
```
Extracts properties and elements cleanly into distinct variables and performs non-destructive shallow merges.

## Array Transformations (map, filter, reduce)
```typescript
const activeNames = users
  .filter(u => u.isActive)
  .map(u => u.name);

const sum = numbers.reduce((acc, curr) => acc + curr, 0);
const hasNegative = numbers.some(x => x < 0);
const allPositive = numbers.every(x => x > 0);
```
Functional sequence methods operating over arrays to filter, transform, aggregate, or test boolean conditions.

## Type Guards & Narrowing
```typescript
function isUser(val: unknown): val is User {
  return typeof val === "object" && val !== null && "id" in val;
}

if (typeof input === "string") {
  input.toUpperCase();
} else if (isUser(input)) {
  console.log(input.id);
}
```
Informs the TypeScript compiler to narrow down broad `unknown` or union types within conditional blocks.

## Generic Functions
```typescript
function firstOrFallback<T>(items: T[], fallback: T): T {
  return items.length > 0 ? items[0] : fallback;
}

const num = firstOrFallback([10, 20], 0);
const str = firstOrFallback([], "default");
```
Parametric polymorphism enabling functions and classes to operate over arbitrary types while retaining type integrity.

## ASCII & Character Conversions
```typescript
const charCode = "c".charCodeAt(0);
const alphabetIdx = "c".charCodeAt(0) - "a".charCodeAt(0);

const char = String.fromCharCode("a".charCodeAt(0) + alphabetIdx);

const str = ["a", "b", "c"].join("");
```
Translates characters to UTF-16 code units and back, and joins token sequences into strings.

## Shallow vs Deep Copy
```typescript
const shallowArr = [...originalArr];
const shallowObj = { ...originalObj };

const deepClone = structuredClone(complexState);
```
Duplicates JavaScript objects and arrays safely, leveraging modern `structuredClone` for deep nested state replication.

## Exception & Error Handling
```typescript
try {
  const data = JSON.parse(rawText);
  process(data);
} catch (err: unknown) {
  if (err instanceof SyntaxError) {
    console.error("Invalid JSON format:", err.message);
  } else {
    throw err;
  }
} finally {
  cleanup();
}
```
Catches runtime exceptions with type-safe `unknown` error discrimination and guaranteed cleanup execution.

## Async / Await
```typescript
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadData(): Promise<void> {
  try {
    const user = await fetchUser("42");
    console.log(user.name);
  } catch (err: unknown) {
    if (err instanceof Error) console.error(err.message);
  }
}
```
Suspends execution at each `await` until the promise resolves, enabling sequential async logic with standard `try`/`catch` error handling.

## Promise Combinators
```typescript
// All must succeed — rejects on first failure:
const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);

// Wait for all to settle (never rejects):
const results = await Promise.allSettled([taskA(), taskB()]);
for (const r of results) {
  if (r.status === "fulfilled") console.log(r.value);
  else console.error(r.reason);
}

// First to settle wins (resolve or reject):
const fastest = await Promise.race([fetchPrimary(), timeout(5000)]);

// First to succeed wins (ignores rejections unless all fail):
const first = await Promise.any([mirrorA(), mirrorB(), mirrorC()]);
```
Four settlement strategies: `all` (fail-fast parallel), `allSettled` (graceful degradation), `race` (timeout patterns), `any` (first-success).

## Closures & Higher-Order Functions
```typescript
function createCounter(initial = 0) {
  let count = initial;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
  };
}
const counter = createCounter(10);
counter.increment();
counter.getCount();

function withLogging<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args: any[]) => {
    console.log("Calling", fn.name, "with", args);
    return fn(...args);
  }) as T;
}
```
Closures capture variables from their enclosing lexical scope, enabling factory functions, data privacy, and stateful callbacks.

## `this` Binding & Arrow Functions
```typescript
// Arrow functions capture `this` from the enclosing lexical scope:
class Timer {
  seconds = 0;
  start() {
    setInterval(() => this.seconds++, 1000);
  }
}

// Regular functions have dynamic `this`, determined by call site:
function greet(this: { name: string }) {
  console.log(`Hello, ${this.name}`);
}
const obj = { name: "Alice", greet };
obj.greet(); // `this` is obj

// Explicit binding:
const boundGreet = greet.bind({ name: "Bob" });
boundGreet();
greet.call({ name: "Eve" });
```
Arrow functions inherit `this` lexically (no own binding); regular functions resolve `this` dynamically via the call site, `.bind()`, `.call()`, or `.apply()`.

## Modules (`import` / `export`)
```typescript
export function add(a: number, b: number): number { return a + b; }
export const PI = 3.14159;

export default class Logger { /* ... */ }

import { add, PI } from "./math";
import Logger from "./logger";
import { add as sum } from "./math";

export { add, PI } from "./math";
export { default as Logger } from "./logger";

const { add } = await import("./math");
```
ES module system for structuring code into self-contained files with explicit dependency declarations and tree-shakeable imports.

## Iterators & Generators
```typescript
function* range(start: number, end: number): Generator<number> {
  for (let i = start; i < end; i++) {
    yield i;
  }
}

for (const n of range(0, 5)) {
  console.log(n);
}

class Countdown implements Iterable<number> {
  constructor(private from: number) {}

  *[Symbol.iterator](): Generator<number> {
    for (let i = this.from; i > 0; i--) yield i;
  }
}

const nums = [...new Countdown(3)];
```
Generators produce values lazily on demand via `yield`, and `Symbol.iterator` makes any object usable with `for...of` and spread syntax.

## String Methods & Template Literals
```typescript
const s = "  Hello, TypeScript!  ";

s.trim();
s.includes("Type");
s.startsWith("  Hello");
s.endsWith("!  ");
s.replaceAll("!", "?");
"abc".padStart(6, "0");
"abc".padEnd(6, ".");

const name = "world";
const greeting = `Hello, ${name}!`;

const html = `
  <div>
    <p>${greeting}</p>
  </div>
`;

function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return { text: strings.join("?"), params: values };
}
const query = sql`SELECT * FROM users WHERE id = ${42}`;
```
Built-in string methods for searching, padding, and replacing, plus template literals for interpolation, multi-line strings, and tagged DSLs.

## `for...of` vs `for...in` vs `.forEach()`
```typescript
const arr = ["a", "b", "c"];

// for...of — iterates VALUES (arrays, strings, Maps, Sets, generators):
for (const val of arr) console.log(val);

// for...in — iterates enumerable PROPERTY KEYS (use on objects, not arrays):
const obj = { x: 1, y: 2 };
for (const key in obj) console.log(key);

// .forEach() — array method, no break/continue, no await support:
arr.forEach((val, idx) => console.log(idx, val));
```
`for...of` iterates values from any iterable; `for...in` enumerates object keys (avoid on arrays — includes inherited properties); `.forEach()` is an array method that cannot `break` or use `await`.

## Nullish Assignment Operators
```typescript
let config: { timeout?: number; retries?: number; verbose?: boolean } = {};

// ??= assigns only if current value is null or undefined:
config.timeout ??= 5000;
config.timeout ??= 9999;

// ||= assigns if current value is falsy (0, "", false, null, undefined):
config.retries ||= 3;

// &&= assigns only if current value is truthy:
config.verbose &&= false;
```
Shorthand assignment operators combining nullish coalescing (`??`), logical OR (`||`), and logical AND (`&&`) with assignment.
