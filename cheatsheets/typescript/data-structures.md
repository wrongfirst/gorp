---
language: typescript
badge: ts
aliases: [ts, typescript, js, javascript]
---

## Map & Frequency Counting
```typescript
const counts = new Map<number, number>();
for (const x of nums) {
  counts.set(x, (counts.get(x) ?? 0) + 1);
}

const adj = new Map<number, number[]>();
for (const [u, v] of edges) {
  if (!adj.has(u)) adj.set(u, []);
  adj.get(u)!.push(v);
}
```
Hash map supporting arbitrary key types with average $O(1)$ insertions, lookups, and frequency updates.

## Set Operations & Uniqueness
```typescript
const seen = new Set<number>([1, 2, 3]);
seen.add(4);
seen.delete(2);
const exists = seen.has(3);

const uniqueList = Array.from(seen);
```
Maintains unique elements with average $O(1)$ membership tests and fast array deduplication.

## 2D Matrix Allocation
```typescript
const R = 4, C = 5;

const grid: number[][] = Array.from({ length: R }, () => new Array(C).fill(0));

const jagged: number[][] = Array.from({ length: R }, (_, r) => new Array(rowSizes[r]).fill(0));
```
Allocates 2D arrays safely without pointer duplication across rows (`new Array(R).fill(new Array(C))` shares the same row reference!).

## Pointer-Based Queue (Avoiding O(N) shift)
```typescript
const queue: number[] = [startNode];
let head = 0;

while (head < queue.length) {
  const current = queue[head++];
}
```
Avoids JavaScript's native `Array.prototype.shift()` $O(N)$ reallocation overhead during BFS and queue operations.

## Lightweight MinHeap / PriorityQueue
```typescript
class MinHeap<T> {
  private data: T[] = [];
  constructor(private compare: (a: T, b: T) => number) {}

  get size(): number { return this.data.length; }
  peek(): T | undefined { return this.data[0]; }

  push(val: T): void {
    this.data.push(val);
    let i = this.data.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.compare(this.data[i], this.data[p]) >= 0) break;
      [this.data[i], this.data[p]] = [this.data[p], this.data[i]];
      i = p;
    }
  }

  pop(): T | undefined {
    if (this.size === 0) return undefined;
    const top = this.data[0];
    const bottom = this.data.pop()!;
    if (this.size > 0) {
      this.data[0] = bottom;
      let i = 0;
      while ((i << 1) + 1 < this.data.length) {
        let left = (i << 1) + 1, right = left + 1, best = left;
        if (right < this.data.length && this.compare(this.data[right], this.data[left]) < 0) best = right;
        if (this.compare(this.data[best], this.data[i]) >= 0) break;
        [this.data[i], this.data[best]] = [this.data[best], this.data[i]];
        i = best;
      }
    }
    return top;
  }
}
```
A lightweight, self-contained generic binary heap supporting $O(\log N)$ push and pop operations with custom comparators.

## Monotonic Stack (Next Greater Element)
```typescript
const n = nums.length;
const result = new Array(n).fill(-1);
const stack: number[] = [];

for (let i = 0; i < n; i++) {
  while (stack.length > 0 && nums[i] > nums[stack[stack.length - 1]]) {
    const poppedIdx = stack.pop()!;
    result[poppedIdx] = nums[i];
  }
  stack.push(i);
}
```
Resolves nearest greater or smaller elements across an array in linear $O(N)$ amortized time.

## Disjoint Set Union (DSU / Union-Find)
```typescript
class DSU {
  private parent: number[];
  private rank: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }

  find(i: number): number {
    if (this.parent[i] !== i) {
      this.parent[i] = this.find(this.parent[i]); // Path compression
    }
    return this.parent[i];
  }

  union(i: number, j: number): boolean {
    let rootI = this.find(i);
    let rootJ = this.find(j);
    if (rootI === rootJ) return false;

    if (this.rank[rootI] < this.rank[rootJ]) [rootI, rootJ] = [rootJ, rootI];
    this.parent[rootJ] = rootI;
    if (this.rank[rootI] === this.rank[rootJ]) this.rank[rootI]++;
    return true;
  }
}
```
Maintains disjoint partition subsets with path compression and rank heuristics in nearly $O(1)$ inverse Ackermann time $\alpha(N)$.

## Trie (Prefix Tree)
```typescript
class TrieNode {
  children = new Map<string, TrieNode>();
  isEnd = false;
}

class Trie {
  root = new TrieNode();

  insert(word: string): void {
    let curr = this.root;
    for (const ch of word) {
      if (!curr.children.has(ch)) {
        curr.children.set(ch, new TrieNode());
      }
      curr = curr.children.get(ch)!;
    }
    curr.isEnd = true;
  }

  startsWith(prefix: string): boolean {
    let curr = this.root;
    for (const ch of prefix) {
      if (!curr.children.has(ch)) return false;
      curr = curr.children.get(ch)!;
    }
    return true;
  }
}
```
Tree structure supporting word insertion and prefix queries in $O(L)$ time for strings of length $L$.
