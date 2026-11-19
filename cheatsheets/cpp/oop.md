---
language: cpp
badge: cpp
aliases: [cpp, c++, cplusplus]
---

## Struct vs Class & Member Initialization
```cpp
struct Node {
    int val;
    Node* next;
    Node(int v, Node* n = nullptr) : val(v), next(n) {}
};

class Counter {
private:
    int count;
public:
    explicit Counter(int init = 0) : count(init) {}
    int get() const { return count; }
};
```
Defines object blueprints, contrasting default access specifiers and using initializer lists for optimal member construction.

## Const Member Functions
```cpp
class Account {
private:
    double balance;
public:
    Account(double b) : balance(b) {}

    double getBalance() const {
        return balance;
    }
};
```
Enforces const correctness, permitting methods to be invoked on `const` references and objects.

## Operator Overloading (operator< for Sorting & Heaps)
```cpp
struct Edge {
    int u, v, weight;

    // Strict weak ordering for std::sort and std::priority_queue:
    bool operator<(const Edge& other) const {
        return weight < other.weight;
    }

    bool operator==(const Edge& other) const {
        return u == other.u && v == other.v && weight == other.weight;
    }
};
```
Overloads comparison operators as const methods, enabling objects to be sorted or stored directly in STL containers.

## Inheritance & Polymorphism (virtual, override)
```cpp
class Shape {
public:
    // Always provide a virtual destructor for polymorphic base classes:
    virtual ~Shape() = default;

    virtual double area() const { return 0.0; }
};

class Rectangle : public Shape {
private:
    double width, height;
public:
    Rectangle(double w, double h) : width(w), height(h) {}

    double area() const override {
        return width * height;
    }
};
```
Derives child classes with polymorphic method overrides and virtual destructor safety for proper dynamic cleanup.

## Pure Virtual Interface (Abstract Base Class)
```cpp
#include <vector>

class ISolver {
public:
    virtual ~ISolver() = default;

    // Pure virtual method (= 0): must be implemented by derived classes
    virtual int solve(const std::vector<int>& data) = 0;
};
```
Declares abstract interfaces that cannot be instantiated directly, enforcing contract implementation in derived types.

## RAII & Scope-Based Resource Management
```cpp
#include <cstdio>
#include <mutex>

std::mutex mtx;

void safeOperation() {
    std::lock_guard<std::mutex> lock(mtx);
}

class FileHandle {
    std::FILE* fp;
public:
    explicit FileHandle(const char* path) : fp(std::fopen(path, "r")) {}
    ~FileHandle() { if (fp) std::fclose(fp); }
    std::FILE* get() const { return fp; }
};
```
Ties resource acquisition and release directly to object lifetime, ensuring deterministic cleanup even when exceptions occur.

## Rule of Zero & Rule of Five
```cpp
#include <memory>
#include <vector>

// Rule of Zero: When members manage their own resources (STL / smart ptrs),
// declare none of the 5 special member functions:
class Graph {
    std::vector<std::vector<int>> adj;
    std::unique_ptr<int> metadata;
};

// Rule of Five: If managing raw resources manually, declare all five:
class Buffer {
    int* ptr;
    size_t size;
public:
    ~Buffer() { delete[] ptr; }                                  // 1. Destructor
    Buffer(const Buffer& o);                                     // 2. Copy Constructor
    Buffer& operator=(const Buffer& o);                          // 3. Copy Assignment
    Buffer(Buffer&& o) noexcept : ptr(o.ptr), size(o.size) {     // 4. Move Constructor
        o.ptr = nullptr; o.size = 0;
    }
    Buffer& operator=(Buffer&& o) noexcept;                      // 5. Move Assignment
};
```
Defines resource-management contracts: prefer Rule of Zero with standard wrappers; implement the Rule of Five when managing raw resources directly.
