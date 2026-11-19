---
language: go
badge: go
aliases: [go, golang]
---

## Binary Search (Standard & Monotonic Predicate)
```go
import (
    "slices"
    "sort"
)

idx, found := slices.BinarySearch(nums, target)

// Returns the smallest index i in [0, n) where f(i) is true:
firstIdx := sort.Search(len(nums), func(i int) bool {
    return condition(nums[i])
})
```
Finds boundaries and insertion indices in sorted slices or monotonic solution spaces in $O(\log N)$ time.

## Custom Struct Sorting (slices.SortFunc & sort.Slice)
```go
import (
    "cmp"
    "slices"
    "sort"
)

type Item struct {
    Val      int
    Priority int
}

// Modern (Go 1.21+): generic 3-way comparator (-1, 0, 1)
slices.SortFunc(items, func(a, b Item) int {
    if diff := cmp.Compare(a.Priority, b.Priority); diff != 0 {
        return diff
    }
    return cmp.Compare(b.Val, a.Val) // Inverted for descending
})

// Classic sort.Slice / sort.SliceStable: boolean less-function
sort.Slice(items, func(i, j int) bool {
    if items[i].Priority != items[j].Priority {
        return items[i].Priority < items[j].Priority
    }
    return items[i].Val > items[j].Val
})
```
Sorts custom structs using modern generic 3-way comparators (`slices.SortFunc`) or classic boolean predicate functions (`sort.Slice` / `sort.SliceStable`) in $O(N \log N)$ time.

## Two Pointers & Fast-Slow Pointers
```go
left, right := 0, len(nums)-1
for left < right {
    sum := nums[left] + nums[right]
    if sum == target {
        return []int{left, right}
    } else if sum < target {
        left++
    } else {
        right--
    }
}

type ListNode struct {
    Val  int
    Next *ListNode
}

slow, fast := head, head
for fast != nil && fast.Next != nil {
    slow = slow.Next
    fast = fast.Next.Next
    if slow == fast {
        return true
    }
}
```
Traverses sequential structures and linked lists with coordinating pointers in $O(N)$ time and $O(1)$ space.

## Sliding Window Pattern
```go
left := 0
maxLen := 0
counts := make(map[byte]int)

for right := 0; right < len(s); right++ {
    counts[s[right]]++

    for !isValid(counts) {
        counts[s[left]]--
        if counts[s[left]] == 0 {
            delete(counts, s[left])
        }
        left++
    }

    if currLen := right - left + 1; currLen > maxLen {
        maxLen = currLen
    }
}
```
Maintains dynamic valid substrings or subarrays with two pointers in amortized $O(N)$ time.

## Graph BFS & Shortest Path
```go
adj := make(map[int][]int)
dist := make(map[int]int)
queue := []int{start}
head := 0
dist[start] = 0

for head < len(queue) {
    u := queue[head]
    head++

    if u == target {
        break
    }

    for _, v := range adj[u] {
        if _, seen := dist[v]; !seen {
            dist[v] = dist[u] + 1
            queue = append(queue, v)
        }
    }
}
```
Explores unweighted graphs level-by-level, computing shortest hop distances in $O(V + E)$ time using head-pointer queue indexing.

## 2D Grid Directions & Boundary Traversal
```go
R, C := len(grid), len(grid[0])
dirs := [][2]int{{0, 1}, {1, 0}, {0, -1}, {-1, 0}} // Right, Down, Left, Up

inBounds := func(r, c int) bool {
    return r >= 0 && r < R && c >= 0 && c < C
}

for _, d := range dirs {
    nr, nc := r+d[0], c+d[1]
    if inBounds(nr, nc) && !visited[nr][nc] {
        visited[nr][nc] = true
    }
}
```
Navigates orthogonal 2D matrix cells cleanly with delta coordinate offsets and boundary validation in $O(R \times C)$ time.

## Backtracking Template (Slice Copying)
```go
func subsets(nums []int) [][]int {
    var results [][]int
    var path []int

    var backtrack func(start int)
    backtrack = func(start int) {
        // Crucial: copy path slice, otherwise subsequent appends will overwrite answers!
        snapshot := make([]int, len(path))
        copy(snapshot, path)
        results = append(results, snapshot)

        for i := start; i < len(nums); i++ {
            path = append(path, nums[i])
            backtrack(i + 1)
            path = path[:len(path)-1]
        }
    }

    backtrack(0)
    return results
}
```
Explores combinatorial state spaces (subsets, permutations) with forward recursion and backtracking rollbacks, taking defensive copies.

## Topological Sort (Kahn's Algorithm)
```go
inDegree := make([]int, n)
for u := 0; u < n; u++ {
    for _, v := range adj[u] {
        inDegree[v]++
    }
}

var queue []int
for i := 0; i < n; i++ {
    if inDegree[i] == 0 {
        queue = append(queue, i)
    }
}

var topoOrder []int
head := 0
for head < len(queue) {
    u := queue[head]
    head++
    topoOrder = append(topoOrder, u)

    for _, v := range adj[u] {
        inDegree[v]--
        if inDegree[v] == 0 {
            queue = append(queue, v)
        }
    }
}
// If len(topoOrder) < n, graph contains a cycle!
```
Generates a valid topological sequence of vertices in a DAG and detects cycles in $O(V + E)$ time using head-pointer queue traversal.
