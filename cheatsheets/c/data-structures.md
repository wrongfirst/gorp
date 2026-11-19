---
language: c
badge: c
aliases: [c]
---

## Dynamic Resizable Vector
```c
#include <stdlib.h>
#include <assert.h>

typedef struct {
    int *data;
    size_t size;
    size_t cap;
} IntVector;

void vec_push(IntVector *v, int val) {
    if (v->size == v->cap) {
        size_t new_cap = v->cap == 0 ? 8 : v->cap * 2;
        int *tmp = realloc(v->data, new_cap * sizeof(int));
        if (tmp == NULL) return;
        v->data = tmp;
        v->cap = new_cap;
    }
    v->data[v->size++] = val;
}

int vec_pop(IntVector *v) {
    assert(v->size > 0);
    return v->data[--v->size];
}
```
Constructs a dynamically growing contiguous buffer providing $O(1)$ amortized append and stack pop operations.

## Circular Queue (Ring Buffer for BFS)
```c
#include <stdlib.h>
#include <assert.h>

typedef struct {
    int *data;
    int front, rear, count, cap;
} Queue;

Queue* q_create(int capacity) {
    Queue *q = malloc(sizeof(Queue));
    q->cap = capacity;
    q->data = malloc(capacity * sizeof(int));
    q->front = 0; q->rear = -1; q->count = 0;
    return q;
}

void q_push(Queue *q, int val) {
    assert(q->count < q->cap);
    q->rear = (q->rear + 1) % q->cap;
    q->data[q->rear] = val;
    q->count++;
}

int q_pop(Queue *q) {
    assert(q->count > 0);
    int val = q->data[q->front];
    q->front = (q->front + 1) % q->cap;
    q->count--;
    return val;
}
```
Implements an $O(1)$ FIFO queue using a fixed-capacity ring buffer with wrap-around modulo arithmetic.

## Singly Linked List Reversal
```c
#include <stdlib.h>

typedef struct ListNode {
    int val;
    struct ListNode *next;
} ListNode;

ListNode* reverse_list(ListNode *head) {
    ListNode *prev = NULL;
    ListNode *curr = head;
    while (curr != NULL) {
        ListNode *next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}
```
Reverses a singly linked list iteratively in $O(N)$ time and $O(1)$ space using three pointers.

## 2D Matrix Dynamic Allocation
```c
#include <stdlib.h>

int R = 4, C = 5;

int **matrix = malloc(R * sizeof(int*));
for (int i = 0; i < R; i++) {
    matrix[i] = calloc(C, sizeof(int));
}

for (int i = 0; i < R; i++) free(matrix[i]);
free(matrix);
```
Allocates dynamic 2D arrays safely with row pointer indirection and zero-initialized memory.

## Binary Min-Heap in Array
```c
void heapify_up(int *heap, int i) {
    while (i > 0) {
        int p = (i - 1) / 2;
        if (heap[i] >= heap[p]) break;
        int tmp = heap[i]; heap[i] = heap[p]; heap[p] = tmp;
        i = p;
    }
}

void heapify_down(int *heap, int n, int i) {
    while (2 * i + 1 < n) {
        int left = 2 * i + 1, right = 2 * i + 2, best = left;
        if (right < n && heap[right] < heap[left]) best = right;
        if (heap[i] <= heap[best]) break;
        int tmp = heap[i]; heap[i] = heap[best]; heap[best] = tmp;
        i = best;
    }
}
```
Maintains binary heap ordering on a contiguous array with $O(\log N)$ bubble-up and bubble-down routines.

## Disjoint Set Union (DSU / Union-Find)
```c
#define MAX_NODES 100000

int parent[MAX_NODES];
int rank_val[MAX_NODES];

void dsu_init(int n) {
    for (int i = 0; i < n; i++) {
        parent[i] = i;
        rank_val[i] = 0;
    }
}

int dsu_find(int i) {
    if (parent[i] != i)
        parent[i] = dsu_find(parent[i]); // Path compression
    return parent[i];
}

int dsu_union(int i, int j) {
    int root_i = dsu_find(i), root_j = dsu_find(j);
    if (root_i == root_j) return 0;
    if (rank_val[root_i] < rank_val[root_j]) {
        int tmp = root_i; root_i = root_j; root_j = tmp;
    }
    parent[root_j] = root_i;
    if (rank_val[root_i] == rank_val[root_j]) rank_val[root_i]++;
    return 1;
}
```
Maintains connected components and detects cycles using static arrays with path compression and union-by-rank.

## Binary Tree (Depth & Traversal)
```c
#include <stdlib.h>

typedef struct TreeNode {
    int val;
    struct TreeNode *left;
    struct TreeNode *right;
} TreeNode;

int max_depth(const TreeNode *root) {
    if (root == NULL) return 0;
    int left = max_depth(root->left);
    int right = max_depth(root->right);
    return 1 + (left > right ? left : right);
}
```
Defines binary tree nodes and recursively computes tree depth in $O(N)$ time.
