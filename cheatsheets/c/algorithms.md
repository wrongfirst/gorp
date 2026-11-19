---
language: c
badge: c
aliases: [c]
---

## Safe Sorting & Searching (qsort and bsearch)
```c
#include <stdlib.h>

// Generic comparator: stdlib passes elements via generic const void * pointers.
// Explicitly cast to the concrete type before dereferencing.
// PITFALL: Avoid (x - y) subtraction which causes signed overflow on INT_MIN / INT_MAX!
int cmp_ints(const void *a, const void *b) {
    int x = *(const int *)a;
    int y = *(const int *)b;
    return (x > y) - (x < y); // Returns -1, 0, or 1 safely without overflow
}

qsort(arr, n, sizeof(int), cmp_ints);

int key = 42;
int *found = bsearch(&key, arr, n, sizeof(int), cmp_ints);
if (found != NULL) {
    int index = found - arr;
}
```
Sorts and searches contiguous arrays using type-erased `const void *` comparators while avoiding arithmetic overflow.

## Binary Search Template [left, right)
```c
int left = 0, right = n;

while (left < right) {
    int mid = left + (right - left) / 2; // Avoids integer overflow (left + right)
    if (condition(mid)) {
        right = mid;
    } else {
        left = mid + 1;
    }
}
return left;
```
Implements custom predicate search over sorted arrays or monotonic answer spaces without off-by-one errors.

## Two Pointers & Fast-Slow Pointers
```c
int left = 0, right = n - 1;
while (left < right) {
    int sum = nums[left] + nums[right];
    if (sum == target) {
        break;
    } else if (sum < target) {
        left++;
    } else {
        right--;
    }
}

ListNode *slow = head, *fast = head;
while (fast != NULL && fast->next != NULL) {
    slow = slow->next;
    fast = fast->next->next;
    if (slow == fast) return 1;
}
```
Traverses sequential structures with two coordinated pointers in $O(N)$ time and $O(1)$ space.

## Sliding Window Pattern
```c
int left = 0, best = 0;
int counts[256] = {0};

for (int right = 0; s[right] != '\0'; right++) {
    counts[(unsigned char)s[right]]++;

    while (!is_valid(counts)) {
        counts[(unsigned char)s[left]]--;
        left++;
    }

    int curr_len = right - left + 1;
    if (curr_len > best) best = curr_len;
}
```
Expands right and contracts left to find optimal contiguous subsegments in amortized $O(N)$ linear time.

## 2D Grid Directions & Boundary Traversal
```c
int R = 10, C = 20;
const int dr[] = {0, 1, 0, -1}; // Right, Down, Left, Up
const int dc[] = {1, 0, -1, 0};

for (int d = 0; d < 4; d++) {
    int nr = r + dr[d], nc = c + dc[d];
    if (nr >= 0 && nr < R && nc >= 0 && nc < C && !visited[nr][nc]) {
        visited[nr][nc] = 1;
    }
}
```
Traverses orthogonal neighbors in 2D grid matrices safely with delta offsets and boundary guards.

## Breadth-First Search (BFS)
```c
q_push(q, start_node);
dist[start_node] = 0;

while (q->count > 0) {
    int u = q_pop(q);
    if (u == target) break;

    for (int i = 0; i < adj_size[u]; i++) {
        int v = adj[u][i];
        if (dist[v] == -1) {
            dist[v] = dist[u] + 1;
            q_push(q, v);
        }
    }
}
```
Explores unweighted graphs level-by-level, computing shortest hop path distances in $O(V + E)$ time.

## Backtracking Template
```c
int result_count = 0;

void backtrack(int start_idx, int *nums, int n, int *current, int cur_len) {
    process_solution(current, cur_len);

    for (int i = start_idx; i < n; i++) {
        current[cur_len] = nums[i];
        backtrack(i + 1, nums, n, current, cur_len + 1);
    }
}
```
Explores combinatorial state spaces (subsets, combinations) recursively using a stack-allocated buffer without dynamic allocations.
