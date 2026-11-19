---
language: typescript
badge: ts
aliases: [ts, typescript, js, javascript]
---

## Interface vs Type Alias
```typescript
// Interface (open for declaration merging, ideal for OOP contracts):
interface User {
  id: number;
  name: string;
}

// Type Alias (flexible unions, primitives, tuples):
type ID = string | number;
type Point = { x: number; y: number };
```
Defines object schemas and type shapes, choosing interfaces for extensible public APIs and type aliases for unions/tuples.

## Utility Types (Partial, Pick, Omit, Record)
```typescript
type UserDraft = Partial<User>;                     // All properties optional
type UserCredentials = Pick<User, "id">;            // Subset of properties
type UserWithoutId = Omit<User, "id">;              // Exclude specific properties
type PageConfig = Record<string, boolean>;          // Key-value dictionary type
type ReadonlyUser = Readonly<User>;                 // Immutable properties
```
Built-in type transforms that produce new types by manipulating property optionality and selection.

## Classes & Parameter Properties
```typescript
class Account {
  constructor(
    public readonly id: string,
    private balance: number = 0
  ) {}

  deposit(amount: number): void {
    if (amount <= 0) throw new Error("Amount must be positive");
    this.balance += amount;
  }

  get currentBalance(): number {
    return this.balance;
  }
}
```
Defines classes with constructor parameter shorthand, access modifiers (`public`, `private`, `protected`), and getters/setters.

## Inheritance & Abstract Classes
```typescript
abstract class Shape {
  abstract area(): number;

  describe(): void {
    console.log(`Area is ${this.area()}`);
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }

  override area(): number {
    return Math.PI * this.radius ** 2;
  }
}
```
Enforces abstract base class contracts with constructor delegation via `super()` and method `override` verification.

## Discriminated Unions & Exhaustive Checks
```typescript
type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: string[] }
  | { type: "FETCH_ERROR"; error: Error };

function reducer(action: Action): void {
  switch (action.type) {
    case "FETCH_START":   break;
    case "FETCH_SUCCESS": console.log(action.payload); break;
    case "FETCH_ERROR":   console.error(action.error); break;
    default: {
      const _exhaustiveCheck: never = action; // Compile-time check
      return _exhaustiveCheck;
    }
  }
}
```
Models distinct state variants with common discriminator tags and verifies exhaustive pattern coverage at compile time.

## Enums vs 'as const' Objects
```typescript
// Standard numeric/string enum:
enum Status {
  Pending = "PENDING",
  Active = "ACTIVE"
}

// Idiomatic modern 'as const' object (zero runtime bundle overhead):
const Direction = {
  Up: "UP",
  Down: "DOWN",
} as const;

type DirectionType = typeof Direction[keyof typeof Direction];
```
Compares TypeScript enums with tree-shakeable `as const` literal dictionary types.

## Template Literal Types
```typescript
type EventName = `on${Capitalize<string>}`;
type Getter<K extends string> = `get${Capitalize<K>}`;

type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person { name: string; age: number }
type PersonGetters = Getters<Person>;
```
Constructs string literal types by interpolating unions and applying intrinsic string type transforms (`Capitalize`, `Uppercase`, `Lowercase`, `Uncapitalize`).

## Mapped Types & Conditional Types
```typescript
type Nullable<T> = { [K in keyof T]: T[K] | null };
type ReadonlyDeep<T> = { readonly [K in keyof T]: ReadonlyDeep<T[K]> };

type IsString<T> = T extends string ? true : false;
type A = IsString<"hello">;
type B = IsString<42>;

type NonNullableProps<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};

type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;
type Str = ReturnOf<() => string>;
```
Mapped types iterate over property keys to construct new types; conditional types branch based on assignability checks with optional `infer` for type extraction.

## `keyof`, `typeof` & Index Access Types
```typescript
interface Config {
  host: string;
  port: number;
  debug: boolean;
}

type ConfigKey = keyof Config;

type PortType = Config["port"];

const defaults = { host: "localhost", port: 3000 };
type Defaults = typeof defaults;

function getConfig<K extends keyof Config>(key: K): Config[K] {
  return config[key];
}
```
`keyof` extracts property name unions, `typeof` derives types from values, and index access `T[K]` retrieves specific property types — the building blocks of all utility types.

## `satisfies` Operator (TS 4.9+)
```typescript
// Validates a value matches a type WITHOUT widening:
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
} satisfies Record<string, string | number[]>;

palette.green.toUpperCase();
palette.red.map(x => x / 255);

```
Validates that an expression matches a type at compile time while preserving the narrowest inferred type, avoiding the widening that type annotations cause.

## Tuple Types
```typescript
type Point3D = [number, number, number];
const origin: Point3D = [0, 0, 0];

type HttpResponse = [status: number, body: string];
type Range = [start: number, end: number];

type Color = [number, number, number, alpha?: number];

type AtLeastOne<T> = [T, ...T[]];
type StringPair = [string, string];

const [status, body]: HttpResponse = [200, "OK"];
```
Fixed-length arrays with per-position types, supporting labels, optional elements, and rest patterns for precise function signatures and return types.
