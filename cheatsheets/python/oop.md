---
language: python
badge: py
aliases: [py, python]
---

## Class Definition & Constructor (__init__)
```python
class Node:
    def __init__(self, val: int, next_node=None):
        self.val = val
        self.next = next_node

    def has_next(self) -> bool:
        return self.next is not None

head = Node(1, Node(2))
```
Defines classes with instance state initialization and instance methods bound to `self`.

## Inheritance & super()
```python
class Animal:
    def __init__(self, name: str):
        self.name = name

class Dog(Animal):
    def __init__(self, name: str, breed: str):
        super().__init__(name)
        self.breed = breed
```
Inherits attributes and methods from base classes and delegates initialization using `super()`.

## Data Classes (@dataclass)
```python
from dataclasses import dataclass, field

@dataclass(order=True)
class Item:
    priority: int
    name: str = field(compare=False) # Excluded from comparisons

item = Item(priority=1, name="task")
```
Synthesizes boilerplate constructor, string representation, and comparison methods for record types.

## Custom Comparison (__lt__, __eq__)
```python
class Point:
    def __init__(self, x: int, y: int):
        self.x, self.y = x, y

    def __lt__(self, other: "Point") -> bool:
        # Sort primarily by x, tie-break by y
        return (self.x, self.y) < (other.x, other.y)

    def __eq__(self, other: object) -> bool:
        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)

```
Overloads comparison operators so custom objects can be sorted or stored directly in `heapq` without crashes.

## Properties (@property & Setters)
```python
class Circle:
    def __init__(self, radius: float):
        self._radius = radius

    @property
    def radius(self) -> float:
        return self._radius

    @radius.setter
    def radius(self, value: float) -> None:
        if value < 0:
            raise ValueError("Radius cannot be negative")
        self._radius = value
```
Exposes getter and setter validation methods behind standard attribute access syntax.

## Class Methods & Static Methods
```python
class Date:
    def __init__(self, year: int, month: int, day: int):
        self.year, self.month, self.day = year, month, day

    @classmethod
    def from_iso(cls, iso_str: str) -> "Date":
        y, m, d = map(int, iso_str.split("-"))
        return cls(y, m, d)

    @staticmethod
    def is_valid_month(m: int) -> bool:
        return 1 <= m <= 12
```
Defines alternative factory constructors with `@classmethod` and self-contained helper functions with `@staticmethod`.

## Sequence Emulation (__len__, __getitem__)
```python
class CustomDeck:
    def __init__(self, cards):
        self._cards = list(cards)

    def __len__(self) -> int:
        return len(self._cards)

    def __getitem__(self, idx: int):
        return self._cards[idx]

```
Enables custom classes to support `len()`, bracket indexing `obj[i]`, slicing, and iteration protocols.

## Abstract Base Classes (ABC)
```python
from abc import ABC, abstractmethod

class BaseSolver(ABC):
    @abstractmethod
    def solve(self, data: list[int]) -> int:
        """Subclasses must implement this method"""
        pass
```
Enforces interface contracts, preventing instantiation if declared abstract methods are unimplemented.

## Context Managers (with statement)
```python

with open("data.txt") as f:
    content = f.read()

from contextlib import contextmanager

@contextmanager
def timer(label: str):
    import time
    start = time.perf_counter()
    yield
    elapsed = time.perf_counter() - start
    print(f"{label}: {elapsed:.4f}s")

with timer("processing"):
    result = expensive_operation()

class ManagedResource:
    def __enter__(self):
        self.resource = acquire()
        return self.resource

    def __exit__(self, exc_type, exc_val, exc_tb):
        release(self.resource)
        return False  # False = don't suppress exceptions
```
The `with` statement ensures setup and teardown always run as a pair, even if an exception is raised inside the block. Use `contextlib.contextmanager` for simple cases; implement `__enter__`/`__exit__` for class-based managers.

## Decorators
```python
import functools, time

def timer(func):
    @functools.wraps(func)   # Preserves __name__, __doc__, etc.
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(f"{func.__name__}: {time.perf_counter() - start:.4f}s")
        return result
    return wrapper

@timer
def slow_sort(nums):
    return sorted(nums)

def repeat(n: int):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for _ in range(n):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def greet(name):
    print(f"Hello, {name}!")
```
A decorator is a callable that takes a function and returns a replacement. Always use `@functools.wraps` to preserve the wrapped function's metadata. Built-in decorators like `@property`, `@classmethod`, `@staticmethod`, `@cache`, and `@dataclass` follow the same pattern.

## NamedTuple
```python
from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
    z: float = 0.0  # Default values supported

p = Point(1.0, 2.0)
print(p.x, p.y, p.z)
print(p[0], p[1])
x, y, z = p

# Also hashable → usable as dict key or set element:
visited = {Point(0, 0), Point(1, 1)}

from collections import namedtuple
Color = namedtuple("Color", ["r", "g", "b"])
red = Color(255, 0, 0)
```
`NamedTuple` is an immutable, hashable, memory-efficient record type — effectively a typed tuple with named fields. Prefer it over plain tuples when field names matter for readability, and over `@dataclass` when immutability and hashability are required.
