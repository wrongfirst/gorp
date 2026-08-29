#ifndef _CODEBOOK_HARNESS_C_
#define _CODEBOOK_HARNESS_C_

#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include <limits.h>

/* ========================================================================== */
/* 1. Data Structures                                                         */
/* ========================================================================== */

typedef struct ListNode {
    int val;
    struct ListNode *next;
} ListNode;

typedef struct TreeNode {
    int val;
    struct TreeNode *left;
    struct TreeNode *right;
} TreeNode;

typedef struct Node {
    int val;
    int numNeighbors;
    struct Node **neighbors;
} Node;

typedef struct Interval {
    int start;
    int end;
} Interval;

/* ========================================================================== */
/* 2. Helper Functions - Memory & Builders                                    */
/* ========================================================================== */

static inline ListNode* create_list_node(int val) {
    ListNode* node = (ListNode*)malloc(sizeof(ListNode));
    node->val = val;
    node->next = NULL;
    return node;
}

static inline TreeNode* create_tree_node(int val) {
    TreeNode* node = (TreeNode*)malloc(sizeof(TreeNode));
    node->val = val;
    node->left = NULL;
    node->right = NULL;
    return node;
}

static inline int* make_int(int v) {
    int* ptr = (int*)malloc(sizeof(int));
    *ptr = v;
    return ptr;
}

ListNode* list_to_linked_list(const int* arr, int len) {
    if (!arr || len <= 0) return NULL;
    ListNode* head = create_list_node(arr[0]);
    ListNode* curr = head;
    for (int i = 1; i < len; i++) {
        curr->next = create_list_node(arr[i]);
        curr = curr->next;
    }
    return head;
}

int* linked_list_to_list(const ListNode* head, int* out_len) {
    if (!out_len) return NULL;
    if (!head) {
        *out_len = 0;
        return (int*)malloc(sizeof(int) * 1);
    }

    int capacity = 16;
    int count = 0;
    int* res = (int*)malloc(sizeof(int) * capacity);
    const ListNode** visited = (const ListNode**)malloc(sizeof(const ListNode*) * capacity);

    const ListNode* curr = head;
    const int MAX_SAFETY_NODES = 50000;

    while (curr && count < MAX_SAFETY_NODES) {
        bool cycle = false;
        for (int i = 0; i < count; i++) {
            if (visited[i] == curr) {
                cycle = true;
                break;
            }
        }
        if (cycle) break;

        if (count >= capacity) {
            capacity *= 2;
            res = (int*)realloc(res, sizeof(int) * capacity);
            visited = (const ListNode**)realloc(visited, sizeof(const ListNode*) * capacity);
        }

        visited[count] = curr;
        res[count] = curr->val;
        count++;
        curr = curr->next;
    }

    free(visited);
    *out_len = count;
    return res;
}

ListNode* make_cycle(const int* arr, int len, int pos) {
    ListNode* head = list_to_linked_list(arr, len);
    if (pos < 0 || !head) return head;

    ListNode* tail = head;
    ListNode* target = NULL;
    int idx = 0;
    while (tail) {
        if (idx == pos) {
            target = tail;
        }
        if (!tail->next) break;
        tail = tail->next;
        idx++;
    }

    if (tail && target) {
        tail->next = target;
    }
    return head;
}

TreeNode* ints_to_tree(const int* arr, int len) {
    if (!arr || len <= 0) return NULL;
    TreeNode* root = create_tree_node(arr[0]);

    TreeNode** queue = (TreeNode**)malloc(sizeof(TreeNode*) * (len + 1));
    int head = 0, tail = 0;
    queue[tail++] = root;

    int i = 1;
    while (head < tail && i < len) {
        TreeNode* curr = queue[head++];
        if (i < len) {
            curr->left = create_tree_node(arr[i++]);
            queue[tail++] = curr->left;
        }
        if (i < len) {
            curr->right = create_tree_node(arr[i++]);
            queue[tail++] = curr->right;
        }
    }

    free(queue);
    return root;
}

int* tree_to_ints(const TreeNode* root, int* out_len) {
    if (!out_len) return NULL;
    if (!root) {
        *out_len = 0;
        return (int*)malloc(sizeof(int) * 1);
    }

    int q_cap = 16, q_head = 0, q_tail = 0;
    const TreeNode** queue = (const TreeNode**)malloc(sizeof(const TreeNode*) * q_cap);

    int res_cap = 16, count = 0;
    int* res = (int*)malloc(sizeof(int) * res_cap);

    queue[q_tail++] = root;

    while (q_head < q_tail) {
        const TreeNode* curr = queue[q_head++];
        if (curr) {
            if (count >= res_cap) {
                res_cap *= 2;
                res = (int*)realloc(res, sizeof(int) * res_cap);
            }
            res[count++] = curr->val;

            if (q_tail + 2 >= q_cap) {
                q_cap *= 2;
                queue = (const TreeNode**)realloc(queue, sizeof(const TreeNode*) * q_cap);
            }
            queue[q_tail++] = curr->left;
            queue[q_tail++] = curr->right;
        }
    }

    free(queue);
    *out_len = count;
    return res;
}

TreeNode* list_to_tree(const int** arr, int len) {
    if (!arr || len <= 0 || arr[0] == NULL) return NULL;

    TreeNode* root = create_tree_node(*arr[0]);
    TreeNode** queue = (TreeNode**)malloc(sizeof(TreeNode*) * (len + 1));
    int head = 0, tail = 0;
    queue[tail++] = root;

    int i = 1;
    while (head < tail && i < len) {
        TreeNode* curr = queue[head++];
        if (i < len && arr[i] != NULL) {
            curr->left = create_tree_node(*arr[i]);
            queue[tail++] = curr->left;
        }
        i++;
        if (i < len && arr[i] != NULL) {
            curr->right = create_tree_node(*arr[i]);
            queue[tail++] = curr->right;
        }
        i++;
    }

    free(queue);
    return root;
}

int** tree_to_list(const TreeNode* root, int* out_len) {
    if (!out_len) return NULL;
    if (!root) {
        *out_len = 0;
        return NULL;
    }

    int q_cap = 16, q_head = 0, q_tail = 0;
    const TreeNode** queue = (const TreeNode**)malloc(sizeof(const TreeNode*) * q_cap);

    int res_cap = 16, count = 0;
    int** res = (int**)malloc(sizeof(int*) * res_cap);

    queue[q_tail++] = root;

    while (q_head < q_tail) {
        const TreeNode* curr = queue[q_head++];
        if (count >= res_cap) {
            res_cap *= 2;
            res = (int**)realloc(res, sizeof(int*) * res_cap);
        }

        if (curr) {
            res[count++] = make_int(curr->val);

            if (q_tail + 2 >= q_cap) {
                q_cap *= 2;
                queue = (const TreeNode**)realloc(queue, sizeof(const TreeNode*) * q_cap);
            }
            queue[q_tail++] = curr->left;
            queue[q_tail++] = curr->right;
        } else {
            res[count++] = NULL;
        }
    }

    // Trim trailing NULLs
    while (count > 0 && res[count - 1] == NULL) {
        count--;
    }

    free(queue);
    *out_len = count;
    return res;
}

Node* build_graph(int** adj, const int* col_sizes, int row_size) {
    if (!adj || row_size <= 0) return NULL;

    Node** nodes = (Node**)malloc(sizeof(Node*) * row_size);
    for (int i = 0; i < row_size; i++) {
        nodes[i] = (Node*)malloc(sizeof(Node));
        nodes[i]->val = i + 1;
        nodes[i]->numNeighbors = col_sizes ? col_sizes[i] : 0;
        nodes[i]->neighbors = (Node**)malloc(sizeof(Node*) * (nodes[i]->numNeighbors > 0 ? nodes[i]->numNeighbors : 1));
    }

    for (int i = 0; i < row_size; i++) {
        int n_count = col_sizes ? col_sizes[i] : 0;
        for (int j = 0; j < n_count; j++) {
            int target_val = adj[i][j];
            nodes[i]->neighbors[j] = nodes[target_val - 1];
        }
    }

    Node* start = nodes[0];
    free(nodes);
    return start;
}

int** graph_to_adj(const Node* node, int* out_row_size, int** out_col_sizes) {
    if (!node || !out_row_size || !out_col_sizes) {
        if (out_row_size) *out_row_size = 0;
        if (out_col_sizes) *out_col_sizes = NULL;
        return NULL;
    }

    int q_cap = 16, q_head = 0, q_tail = 0;
    const Node** queue = (const Node**)malloc(sizeof(const Node*) * q_cap);

    int v_cap = 16, v_count = 0;
    const Node** visited = (const Node**)malloc(sizeof(const Node*) * v_cap);

    queue[q_tail++] = node;
    visited[v_count++] = node;

    while (q_head < q_tail) {
        const Node* curr = queue[q_head++];
        for (int i = 0; i < curr->numNeighbors; i++) {
            const Node* nei = curr->neighbors[i];
            if (!nei) continue;
            bool seen = false;
            for (int j = 0; j < v_count; j++) {
                if (visited[j] == nei) {
                    seen = true;
                    break;
                }
            }
            if (!seen) {
                if (v_count >= v_cap) {
                    v_cap *= 2;
                    visited = (const Node**)realloc(visited, sizeof(const Node*) * v_cap);
                }
                visited[v_count++] = nei;

                if (q_tail >= q_cap) {
                    q_cap *= 2;
                    queue = (const Node**)realloc(queue, sizeof(const Node*) * q_cap);
                }
                queue[q_tail++] = nei;
            }
        }
    }

    free(queue);

    int max_val = 0;
    for (int i = 0; i < v_count; i++) {
        if (visited[i]->val > max_val) {
            max_val = visited[i]->val;
        }
    }

    int row_size = max_val;
    int** adj = (int**)malloc(sizeof(int*) * (row_size > 0 ? row_size : 1));
    int* col_sizes = (int*)malloc(sizeof(int) * (row_size > 0 ? row_size : 1));

    for (int i = 0; i < row_size; i++) {
        adj[i] = NULL;
        col_sizes[i] = 0;
    }

    for (int i = 0; i < v_count; i++) {
        const Node* n = visited[i];
        int idx = n->val - 1;
        if (idx >= 0 && idx < row_size) {
            col_sizes[idx] = n->numNeighbors;
            if (n->numNeighbors > 0) {
                adj[idx] = (int*)malloc(sizeof(int) * n->numNeighbors);
                for (int j = 0; j < n->numNeighbors; j++) {
                    adj[idx][j] = n->neighbors[j] ? n->neighbors[j]->val : 0;
                }
            }
        }
    }

    free(visited);
    *out_row_size = row_size;
    *out_col_sizes = col_sizes;
    return adj;
}

/* ========================================================================== */
/* 3. Sorting & Normalization Helpers                                         */
/* ========================================================================== */

static int cmp_ints(const void* a, const void* b) {
    int ia = *(const int*)a;
    int ib = *(const int*)b;
    return (ia > ib) - (ia < ib);
}

static int cmp_strings(const void* a, const void* b) {
    return strcmp(*(const char**)a, *(const char**)b);
}

int* sort_ints(const int* arr, int len) {
    if (!arr || len <= 0) return NULL;
    int* cp = (int*)malloc(sizeof(int) * len);
    memcpy(cp, arr, sizeof(int) * len);
    qsort(cp, len, sizeof(int), cmp_ints);
    return cp;
}

char** sort_strings(const char** arr, int len) {
    if (!arr || len <= 0) return NULL;
    char** cp = (char**)malloc(sizeof(char*) * len);
    memcpy(cp, arr, sizeof(char*) * len);
    qsort(cp, len, sizeof(char*), cmp_strings);
    return cp;
}

typedef struct {
    int* data;
    int len;
} _IntRow;

static int _cmp_int_rows(const void* a, const void* b) {
    const _IntRow* ra = (const _IntRow*)a;
    const _IntRow* rb = (const _IntRow*)b;
    if (ra->len != rb->len) return ra->len - rb->len;
    for (int i = 0; i < ra->len; i++) {
        if (ra->data[i] != rb->data[i]) {
            return (ra->data[i] > rb->data[i]) - (ra->data[i] < rb->data[i]);
        }
    }
    return 0;
}

int** normalize_nested_ints(int** arr, const int* col_sizes, int row_size, int** out_col_sizes) {
    if (!arr || row_size <= 0) {
        if (out_col_sizes) *out_col_sizes = NULL;
        return NULL;
    }

    _IntRow* rows = (_IntRow*)malloc(sizeof(_IntRow) * row_size);
    for (int i = 0; i < row_size; i++) {
        int len = col_sizes ? col_sizes[i] : 0;
        rows[i].len = len;
        if (len > 0 && arr[i]) {
            rows[i].data = (int*)malloc(sizeof(int) * len);
            memcpy(rows[i].data, arr[i], sizeof(int) * len);
            qsort(rows[i].data, len, sizeof(int), cmp_ints);
        } else {
            rows[i].data = NULL;
        }
    }

    qsort(rows, row_size, sizeof(_IntRow), _cmp_int_rows);

    int** res = (int**)malloc(sizeof(int*) * row_size);
    int* res_cols = (int*)malloc(sizeof(int) * row_size);

    for (int i = 0; i < row_size; i++) {
        res[i] = rows[i].data;
        res_cols[i] = rows[i].len;
    }

    free(rows);
    if (out_col_sizes) *out_col_sizes = res_cols;
    else free(res_cols);

    return res;
}

typedef struct {
    char** data;
    int len;
} _StrRow;

static int _cmp_str_rows(const void* a, const void* b) {
    const _StrRow* ra = (const _StrRow*)a;
    const _StrRow* rb = (const _StrRow*)b;
    if (ra->len != rb->len) return ra->len - rb->len;
    for (int i = 0; i < ra->len; i++) {
        int c = strcmp(ra->data[i], rb->data[i]);
        if (c != 0) return c;
    }
    return 0;
}

char*** normalize_nested_strings(char*** arr, const int* col_sizes, int row_size, int** out_col_sizes) {
    if (!arr || row_size <= 0) {
        if (out_col_sizes) *out_col_sizes = NULL;
        return NULL;
    }

    _StrRow* rows = (_StrRow*)malloc(sizeof(_StrRow) * row_size);
    for (int i = 0; i < row_size; i++) {
        int len = col_sizes ? col_sizes[i] : 0;
        rows[i].len = len;
        if (len > 0 && arr[i]) {
            rows[i].data = (char**)malloc(sizeof(char*) * len);
            memcpy(rows[i].data, arr[i], sizeof(char*) * len);
            qsort(rows[i].data, len, sizeof(char*), cmp_strings);
        } else {
            rows[i].data = NULL;
        }
    }

    qsort(rows, row_size, sizeof(_StrRow), _cmp_str_rows);

    char*** res = (char***)malloc(sizeof(char**) * row_size);
    int* res_cols = (int*)malloc(sizeof(int) * row_size);

    for (int i = 0; i < row_size; i++) {
        res[i] = rows[i].data;
        res_cols[i] = rows[i].len;
    }

    free(rows);
    if (out_col_sizes) *out_col_sizes = res_cols;
    else free(res_cols);

    return res;
}

/* ========================================================================== */
/* 4. Test Assertion API                                                      */
/* ========================================================================== */

static void _harness_bool_check(const char* msg, bool condition) {
    if (condition) {
        printf("Test passed: %s\n", msg);
    } else {
        printf("Test failed: %s\n", msg);
        exit(1);
    }
}

static void _harness_equal_check_int(const char* msg, int expected, int actual) {
    if (expected == actual) {
        printf("Test passed: %s\n", msg);
    } else {
        printf("Test failed: %s\nExpected: %d\nActual:   %d\n", msg, expected, actual);
        exit(1);
    }
}

static void _harness_equal_check_long(const char* msg, long long expected, long long actual) {
    if (expected == actual) {
        printf("Test passed: %s\n", msg);
    } else {
        printf("Test failed: %s\nExpected: %lld\nActual:   %lld\n", msg, expected, actual);
        exit(1);
    }
}

static void _harness_equal_check_double(const char* msg, double expected, double actual) {
    double diff = expected - actual;
    if (diff < 0) diff = -diff;
    if (diff < 1e-6) {
        printf("Test passed: %s\n", msg);
    } else {
        printf("Test failed: %s\nExpected: %f\nActual:   %f\n", msg, expected, actual);
        exit(1);
    }
}

static void _harness_equal_check_str(const char* msg, const char* expected, const char* actual) {
    if (expected == actual || (expected && actual && strcmp(expected, actual) == 0)) {
        printf("Test passed: %s\n", msg);
    } else {
        printf("Test failed: %s\nExpected: %s\nActual:   %s\n", msg, expected ? expected : "NULL", actual ? actual : "NULL");
        exit(1);
    }
}

static void _harness_equal_check_int_arr(const char* msg, const int* expected, int exp_len, const int* actual, int act_len) {
    if (exp_len == act_len) {
        bool match = true;
        for (int i = 0; i < exp_len; i++) {
            if (expected[i] != actual[i]) {
                match = false;
                break;
            }
        }
        if (match) {
            printf("Test passed: %s\n", msg);
            return;
        }
    }

    printf("Test failed: %s\nExpected: [", msg);
    for (int i = 0; i < exp_len; i++) printf("%d%s", expected[i], (i + 1 < exp_len) ? ", " : "");
    printf("]\nActual:   [");
    for (int i = 0; i < act_len; i++) printf("%d%s", actual[i], (i + 1 < act_len) ? ", " : "");
    printf("]\n");
    exit(1);
}

static void _harness_equal_check_int_2d(const char* msg, int** exp, const int* exp_cols, int exp_rows, int** act, const int* act_cols, int act_rows) {
    bool match = (exp_rows == act_rows);
    if (match) {
        for (int i = 0; i < exp_rows; i++) {
            int elen = exp_cols ? exp_cols[i] : 0;
            int alen = act_cols ? act_cols[i] : 0;
            if (elen != alen) {
                match = false;
                break;
            }
            for (int j = 0; j < elen; j++) {
                if (exp[i][j] != act[i][j]) {
                    match = false;
                    break;
                }
            }
            if (!match) break;
        }
    }

    if (match) {
        printf("Test passed: %s\n", msg);
        return;
    }

    printf("Test failed: %s\nExpected:\n[", msg);
    for (int i = 0; i < exp_rows; i++) {
        int elen = exp_cols ? exp_cols[i] : 0;
        printf("  [");
        for (int j = 0; j < elen; j++) printf("%d%s", exp[i][j], (j + 1 < elen) ? ", " : "");
        printf("]%s\n", (i + 1 < exp_rows) ? "," : "");
    }
    printf("]\nActual:\n[");
    for (int i = 0; i < act_rows; i++) {
        int alen = act_cols ? act_cols[i] : 0;
        printf("  [");
        for (int j = 0; j < alen; j++) printf("%d%s", act[i][j], (j + 1 < alen) ? ", " : "");
        printf("]%s\n", (i + 1 < act_rows) ? "," : "");
    }
    printf("]\n");
    exit(1);
}

static void _harness_unordered_equal_check_int_2d(const char* msg, int** exp, const int* exp_cols, int exp_rows, int** act, const int* act_cols, int act_rows) {
    int* n_exp_cols = NULL;
    int* n_act_cols = NULL;
    int** n_exp = normalize_nested_ints(exp, exp_cols, exp_rows, &n_exp_cols);
    int** n_act = normalize_nested_ints(act, act_cols, act_rows, &n_act_cols);

    _harness_equal_check_int_2d(msg, n_exp, n_exp_cols, exp_rows, n_act, n_act_cols, act_rows);
}

static void _harness_unordered_equal_check_str_2d(const char* msg, char*** exp, const int* exp_cols, int exp_rows, char*** act, const int* act_cols, int act_rows) {
    int* n_exp_cols = NULL;
    int* n_act_cols = NULL;
    char*** n_exp = normalize_nested_strings(exp, exp_cols, exp_rows, &n_exp_cols);
    char*** n_act = normalize_nested_strings(act, act_cols, act_rows, &n_act_cols);

    bool match = (exp_rows == act_rows);
    if (match) {
        for (int i = 0; i < exp_rows; i++) {
            int elen = n_exp_cols ? n_exp_cols[i] : 0;
            int alen = n_act_cols ? n_act_cols[i] : 0;
            if (elen != alen) { match = false; break; }
            for (int j = 0; j < elen; j++) {
                if (strcmp(n_exp[i][j], n_act[i][j]) != 0) { match = false; break; }
            }
            if (!match) break;
        }
    }

    if (match) {
        printf("Test passed: %s\n", msg);
        return;
    }

    printf("Test failed: %s\nExpected:\n[", msg);
    for (int i = 0; i < exp_rows; i++) {
        int elen = n_exp_cols ? n_exp_cols[i] : 0;
        printf("  [");
        for (int j = 0; j < elen; j++) printf("\"%s\"%s", n_exp[i][j], (j + 1 < elen) ? ", " : "");
        printf("]%s\n", (i + 1 < exp_rows) ? "," : "");
    }
    printf("]\nActual:\n[");
    for (int i = 0; i < act_rows; i++) {
        int alen = n_act_cols ? n_act_cols[i] : 0;
        printf("  [");
        for (int j = 0; j < alen; j++) printf("\"%s\"%s", n_act[i][j], (j + 1 < alen) ? ", " : "");
        printf("]%s\n", (i + 1 < act_rows) ? "," : "");
    }
    printf("]\n");
    exit(1);
}

typedef struct {
    void (*bool_check)(const char* msg, bool b);
    void (*equal_check_int)(const char* msg, int exp, int act);
    void (*equal_check_long)(const char* msg, long long exp, long long act);
    void (*equal_check_double)(const char* msg, double exp, double act);
    void (*equal_check_str)(const char* msg, const char* exp, const char* act);
    void (*equal_check_int_arr)(const char* msg, const int* exp, int exp_len, const int* act, int act_len);
    void (*equal_check_int_2d)(const char* msg, int** exp, const int* exp_cols, int exp_rows, int** act, const int* act_cols, int act_rows);
    void (*unordered_equal_check)(const char* msg, int** exp, const int* exp_cols, int exp_rows, int** act, const int* act_cols, int act_rows);
    void (*unordered_equal_check_str)(const char* msg, char*** exp, const int* exp_cols, int exp_rows, char*** act, const int* act_cols, int act_rows);
} _HarnessTests;

static const _HarnessTests Tests = {
    .bool_check = _harness_bool_check,
    .equal_check_int = _harness_equal_check_int,
    .equal_check_long = _harness_equal_check_long,
    .equal_check_double = _harness_equal_check_double,
    .equal_check_str = _harness_equal_check_str,
    .equal_check_int_arr = _harness_equal_check_int_arr,
    .equal_check_int_2d = _harness_equal_check_int_2d,
    .unordered_equal_check = _harness_unordered_equal_check_int_2d,
    .unordered_equal_check_str = _harness_unordered_equal_check_str_2d,
};

#define equal_check(msg, exp, act) _Generic((exp), \
    int: _harness_equal_check_int, \
    long long: _harness_equal_check_long, \
    double: _harness_equal_check_double, \
    char*: _harness_equal_check_str, \
    const char*: _harness_equal_check_str, \
    default: _harness_equal_check_int \
)(msg, exp, act)

#endif
