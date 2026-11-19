---
language: typescript
badge: ts
aliases: [ts, typescript, js, javascript]
---

## Numeric Sorting & Comparators
```typescript
const nums = [10, 2, 5, 1];

// Explicit numeric comparator is REQUIRED (default sorts as strings!):
nums.sort((a, b) => a - b);
nums.sort((a, b) => b - a);

tasks.sort((a, b) => a.priority - b.priority || a.id - b.id);
```
Performs in-place stable $O(N \log N)$ sorting using a signed numeric subtraction comparator.

## Binary Search Template [left, right)
```typescript
let left = 0;
let right = nums.length;

while (left < right) {
  const mid = left + Math.floor((right - left) / 2);
  if (condition(mid)) {
    right = mid;
  } else {
    left = mid + 1;
  }
}
return left;
```
Finds threshold boundary points and insertion indices in sorted arrays in $O(\log N)$ time.

## Two Pointers & Fast-Slow Pointers
```typescript
let left = 0, right = nums.length - 1;
while (left < right) {
  const sum = nums[left] + nums[right];
  if (sum === target) return [left, right];
  if (sum < target) left++;
  else right--;
}

// Note: JS/TS has no native linked-list; assumes a custom
// ListNode<T> { val: T; next: ListNode<T> | null } structure.
let slow = head, fast = head;
while (fast !== null && fast.next !== null) {
  slow = slow.next!;
  fast = fast.next.next;
  if (slow === fast) return true;
}
```
Traverses sequential structures with two coordinated pointers in $O(N)$ time and $O(1)$ auxiliary space.

## Sliding Window (Dynamic Length)
```typescript
let left = 0;
let maxLen = 0;
const counts = new Map<string, number>();

for (let right = 0; right < s.length; right++) {
  const char = s[right];
  counts.set(char, (counts.get(char) ?? 0) + 1);

  while (!isValid(counts)) {
    const leftChar = s[left];
    counts.set(leftChar, counts.get(leftChar)! - 1);
    if (counts.get(leftChar) === 0) counts.delete(leftChar);
    left++;
  }

  maxLen = Math.max(maxLen, right - left + 1);
}
```
Maintains a valid subsegment over contiguous sequences in amortized $O(N)$ time.

## Breadth-First Search (BFS)
```typescript
const queue: [number, number][] = [[startNode, 0]]; // [node, distance]
const visited = new Set<number>([startNode]);
let head = 0; // O(1) dequeue pointer

while (head < queue.length) {
  const [node, dist] = queue[head++];
  if (node === target) return dist;

  for (const neighbor of adj.get(node) ?? []) {
    if (!visited.has(neighbor)) {
      visited.add(neighbor);
      queue.push([neighbor, dist + 1]);
    }
  }
}
```
Traverses unweighted graphs level-by-level, computing shortest hop distances in $O(V + E)$ time.

## 2D Grid Directions & Boundary Traversal
```typescript
const R = grid.length;
const C = grid[0].length;
const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // Right, Down, Left, Up

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < R && c >= 0 && c < C;
}

for (const [dr, dc] of DIRS) {
  const nr = r + dr, nc = c + dc;
  if (inBounds(nr, nc) && !visited[nr][nc]) {
    visited[nr][nc] = true;
  }
}
```
Navigates matrix grid neighbors with directional delta coordinates and boundary validation in $O(R \times C)$ time.

## Topological Sort (Kahn's Algorithm)
```typescript
const inDegree = new Array(n).fill(0);
for (const [u, v] of edges) inDegree[v]++;

const queue: number[] = [];
for (let i = 0; i < n; i++) {
  if (inDegree[i] === 0) queue.push(i);
}

const topoOrder: number[] = [];
let head = 0;

while (head < queue.length) {
  const u = queue[head++];
  topoOrder.push(u);

  for (const v of adj.get(u) ?? []) {
    inDegree[v]--;
    if (inDegree[v] === 0) queue.push(v);
  }
}
// If topoOrder.length < n, the graph contains a directed cycle!
```
Generates a linear ordering of Directed Acyclic Graph vertices and identifies cycles in $O(V + E)$ time.

## Backtracking Template
```typescript
function subsets(nums: number[]): number[][] {
  const results: number[][] = [];
  const current: number[] = [];

  function backtrack(startIdx: number): void {
    results.push([...current]);

    for (let i = startIdx; i < nums.length; i++) {
      current.push(nums[i]);
      backtrack(i + 1);
      current.pop();
    }
  }

  backtrack(0);
  return results;
}
```
Explores combinatorial state spaces (subsets, permutations, combination sums) with forward recursion and backtracking rollbacks.
