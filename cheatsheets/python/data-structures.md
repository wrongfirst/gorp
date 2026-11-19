---
language: python
badge: py
aliases: [py, python]
---

## Dictionary Operations (Pop, Update, Views)
```python
val = config.pop("timeout", 30) # Removes key and returns value or default
config.update({"retries": 3})   # In-place batch merge
for k, v in config.items():     # Iterate key-value pairs (also .keys(), .values())
    pass
```
Manages dictionary mappings through key removal with fallbacks, in-place merging, and dynamic views.

## Frequency Counting (Counter)
```python
from collections import Counter

counts = Counter("abracadabra")
most_common = counts.most_common(2) # [('a', 5), ('b', 2)]
counts.update(["a", "b", "c"])
```
Specialized dictionary for tallying hashable elements in $O(N)$ initialization time.

## Defaultdict for Graphs & Grouping
```python
from collections import defaultdict

adj = defaultdict(list) # Graph adjacency list
adj[u].append(v)

freq = defaultdict(int) # Counter with zero default
freq[x] += 1
```
Automatically initializes missing keys using the provided factory function upon first access.

## Sets & Set Algebra
```python
s = {1, 2, 3}
s.add(4)
s.discard(5) # Safe removal: avoids KeyError if 5 is absent (unlike s.remove(5))

# Set algebra (bitwise operators work on sets):
union = a | b          # In a OR b (or a.union(b))
intersection = a & b   # In BOTH a and b (or a.intersection(b))
difference = a - b     # In a, but NOT in b (or a.difference(b))
sym_diff = a ^ b       # In a OR b, but NOT both
```
Maintains unique elements with average $O(1)$ membership checks (`x in s`) and fast set algebra.

## Double-Ended Queue (deque)
```python
from collections import deque

dq = deque([1, 2, 3])
dq.append(4)        # O(1) push right
dq.appendleft(0)    # O(1) push left
right = dq.pop()    # O(1) pop right
left = dq.popleft() # O(1) pop left (unlike list.pop(0) which is O(N))
```
Provides $O(1)$ appends and pops from both ends, ideal for queues and BFS traversal.

## Min-Heap & Max-Heap (heapq)
```python
import heapq

# Min-heap (default):
heap = [5, 1, 8, 3]
heapq.heapify(heap)             # O(N) linear time heapify
heapq.heappush(heap, 2)         # O(log N) push
smallest = heapq.heappop(heap)  # O(log N) pop min

# Max-heap (invert values):
max_heap = []
heapq.heappush(max_heap, -val)
largest = -heapq.heappop(max_heap)

# Top-K elements:
top_k = heapq.nlargest(k, nums)
```
Priority queue algorithms implemented over standard Python lists in $O(\log N)$ time per operation.

## Monotonic Stack (Next Greater Element)
```python
n = len(nums)
result = [-1] * n
stack = [] # Indices with values in descending order

for i in range(n):
    while stack and nums[i] > nums[stack[-1]]:
        prev_idx = stack.pop()
        result[prev_idx] = nums[i]
    stack.append(i)
```
Maintains elements in monotonic order to resolve nearest greater/smaller element queries in $O(N)$ amortized time.

## 2D Matrix Allocation
```python
R, C = 4, 5
# Correct: independent row lists
grid = [[0] * C for _ in range(R)]

# Dynamic jagged list:
matrix = [[0] * cols[r] for r in range(R)]
```
Allocates a 2D matrix safely without shallow pointer duplication across rows.

## Disjoint Set Union (DSU / Union-Find)
```python
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, i):
        if self.parent[i] != i:
            self.parent[i] = self.find(self.parent[i]) # Path compression
        return self.parent[i]

    def union(self, i, j):
        root_i, root_j = self.find(i), self.find(j)
        if root_i == root_j:
            return False
        if self.rank[root_i] < self.rank[root_j]:
            root_i, root_j = root_j, root_i
        self.parent[root_j] = root_i
        if self.rank[root_i] == self.rank[root_j]:
            self.rank[root_i] += 1
        return True
```
Maintains disjoint partition sets with path compression and union by rank in nearly $O(1)$ amortized inverse Ackermann time $\alpha(N)$.

## Trie (Prefix Tree)
```python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                curr.children[ch] = TrieNode()
            curr = curr.children[ch]
        curr.is_end = True

    def search(self, word: str) -> bool:
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        return curr.is_end
```
Prefix tree structure supporting $O(L)$ insertion, search, and prefix matching for words of length $L$.
