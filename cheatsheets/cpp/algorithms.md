---
language: cpp
badge: cpp
aliases: [cpp, c++, cplusplus]
---

## Binary Search (lower_bound, upper_bound & Predicate)
```cpp
#include <algorithm>
#include <vector>

auto it1 = std::lower_bound(nums.begin(), nums.end(), target); // first element >= target
auto it2 = std::upper_bound(nums.begin(), nums.end(), target); // first element > target
int idx = it1 - nums.begin();

int left = 0, right = n;
while (left < right) {
    int mid = left + (right - left) / 2;
    if (check(mid)) {
        right = mid;
    } else {
        left = mid + 1;
    }
}
return left;
```
Finds threshold boundaries and target indices in sorted ranges in $O(\log N)$ time, avoiding integer overflow.

## Two Pointers & Fast-Slow Pointers
```cpp
#include <utility>
#include <vector>

int left = 0, right = nums.size() - 1;
while (left < right) {
    int sum = nums[left] + nums[right];
    if (sum == target) return {left, right};
    else if (sum < target) ++left;
    else --right;
}

struct ListNode {
    int val;
    ListNode* next;
};

ListNode *slow = head, *fast = head;
while (fast && fast->next) {
    slow = slow->next;
    fast = fast->next->next;
    if (slow == fast) return true;
}
```
Traverses sequential structures with two coordinating indices in $O(N)$ time and $O(1)$ space.

## Sliding Window (Dynamic Length)
```cpp
#include <unordered_map>
#include <vector>

int left = 0, best = 0;
std::unordered_map<int, int> window_freq;

for (int right = 0; right < nums.size(); ++right) {
    window_freq[nums[right]]++;

    while (!isValid(window_freq)) {
        if (--window_freq[nums[left]] == 0) {
            window_freq.erase(nums[left]);
        }
        left++;
    }

    best = std::max(best, right - left + 1);
}
```
Expands and contracts a contiguous subarray window to satisfy dynamic constraints in amortized $O(N)$ time.

## Standard STL Algorithms (sort, reverse, accumulate)
```cpp
#include <algorithm>
#include <numeric>
#include <vector>

std::sort(nums.begin(), nums.end());
std::reverse(nums.begin(), nums.end());

long long total = std::accumulate(nums.begin(), nums.end(), 0LL);

auto min_it = std::min_element(nums.begin(), nums.end());
auto max_it = std::max_element(nums.begin(), nums.end());
```
Canonical generic STL algorithms operating over iterator ranges with optimal algorithmic complexity.

## STL Search, Count & Predicates (find_if, count_if, all_of)
```cpp
#include <algorithm>
#include <vector>

auto it = std::find_if(nums.begin(), nums.end(), [](int x) { return x % 2 == 0; });
int evens = std::count_if(nums.begin(), nums.end(), [](int x) { return x % 2 == 0; });

bool all_pos = std::all_of(nums.begin(), nums.end(), [](int x) { return x > 0; });
bool has_neg = std::any_of(nums.begin(), nums.end(), [](int x) { return x < 0; });
```
Performs declarative linear scans and boolean range validations with inline lambda predicates.

## STL Transformations & Permutations (unique, next_permutation)
```cpp
#include <algorithm>
#include <vector>

// Remove consecutive duplicates (must be sorted first; returns new logical end):
std::sort(nums.begin(), nums.end());
nums.erase(std::unique(nums.begin(), nums.end()), nums.end());

std::transform(nums.begin(), nums.end(), nums.begin(), [](int x) { return x * 2; });

// Lexicographical next permutation (returns false when reset to smallest):
bool has_next = std::next_permutation(nums.begin(), nums.end());
```
Modifies ranges in-place and generates combinatorial permutations directly in lexicographical order.

## Custom Sorting Comparators
```cpp
#include <algorithm>
#include <vector>

struct Task { int priority; int id; };

// Sort: descending priority, ascending id tie-breaker:
std::sort(tasks.begin(), tasks.end(), [](const Task& a, const Task& b) {
    if (a.priority != b.priority) return a.priority > b.priority;
    return a.id < b.id;
});
```
Customizes sorting orders with inline strict-weak-ordering lambda predicates.

## Queue & BFS Graph Traversal
```cpp
#include <queue>
#include <vector>

std::vector<std::vector<int>> adj(n);
std::vector<int> dist(n, -1);
std::queue<int> q;

q.push(start);
dist[start] = 0;

while (!q.empty()) {
    int u = q.front(); q.pop();
    for (int v : adj[u]) {
        if (dist[v] == -1) {
            dist[v] = dist[u] + 1;
            q.push(v);
        }
    }
}
```
Traverses unweighted graphs level-by-level, finding shortest hop paths in $O(V + E)$ time.

## 2D Grid Directions & Boundary Traversal
```cpp
#include <vector>

int R = grid.size(), C = grid[0].size();
const int dr[] = {0, 1, 0, -1}; // Right, Down, Left, Up
const int dc[] = {1, 0, -1, 0};

auto in_bounds = [&](int r, int c) {
    return r >= 0 && r < R && c >= 0 && c < C;
};

for (int d = 0; d < 4; ++d) {
    int nr = r + dr[d], nc = c + dc[d];
    if (in_bounds(nr, nc) && !visited[nr][nc]) {
        visited[nr][nc] = true;
    }
}
```
Navigates orthogonal 2D matrix cells cleanly with delta coordinate offsets and boundary guards.

## Dijkstra's Shortest Path Algorithm
```cpp
#include <queue>
#include <vector>

constexpr int INF = 1'000'000'000; // Distinct large sentinel safe from arithmetic overflow
using pii = std::pair<int, int>;   // {dist, u}

std::vector<int> dist(n, INF);
std::priority_queue<pii, std::vector<pii>, std::greater<pii>> pq;

dist[src] = 0;
pq.push({0, src});

while (!pq.empty()) {
    auto [d, u] = pq.top(); pq.pop();
    if (d > dist[u]) continue; // Skip outdated distance pairs

    for (auto& [v, weight] : adj[u]) {
        if (dist[u] + weight < dist[v]) {
            dist[v] = dist[u] + weight;
            pq.push({dist[v], v});
        }
    }
}
```
Computes single-source shortest paths on non-negative weighted graphs in $O((V + E) \log V)$ time.

## Topological Sort (Kahn's Algorithm)
```cpp
#include <queue>
#include <vector>

std::vector<int> in_degree(n, 0);
for (int u = 0; u < n; ++u)
    for (int v : adj[u]) in_degree[v]++;

std::queue<int> q;
for (int i = 0; i < n; ++i)
    if (in_degree[i] == 0) q.push(i);

std::vector<int> topo_order;
while (!q.empty()) {
    int u = q.front(); q.pop();
    topo_order.push_back(u);
    for (int v : adj[u])
        if (--in_degree[v] == 0) q.push(v);
}
// If topo_order.size() < n, graph contains a directed cycle!
```
Generates a valid topological sequence of vertices in a DAG and detects directed cycles in $O(V + E)$ time.

## Backtracking Template
```cpp
#include <vector>

std::vector<std::vector<int>> results;
std::vector<int> current;

void backtrack(int start_idx, const std::vector<int>& candidates) {
    results.push_back(current);

    for (int i = start_idx; i < candidates.size(); ++i) {
        current.push_back(candidates[i]);
        backtrack(i + 1, candidates);
        current.pop_back();
    }
}
```
Generates combinatorial state spaces (subsets, permutations, combinations) via depth-first decision rollback.
