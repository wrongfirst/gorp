(function(){var e=`#ifndef _CODEBOOK_HARNESS_C_
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
        printf("Test passed: %s\\n", msg);
    } else {
        printf("Test failed: %s\\n", msg);
        exit(1);
    }
}

static void _harness_equal_check_int(const char* msg, int expected, int actual) {
    if (expected == actual) {
        printf("Test passed: %s\\n", msg);
    } else {
        printf("Test failed: %s\\nExpected: %d\\nActual:   %d\\n", msg, expected, actual);
        exit(1);
    }
}

static void _harness_equal_check_long(const char* msg, long long expected, long long actual) {
    if (expected == actual) {
        printf("Test passed: %s\\n", msg);
    } else {
        printf("Test failed: %s\\nExpected: %lld\\nActual:   %lld\\n", msg, expected, actual);
        exit(1);
    }
}

static void _harness_equal_check_double(const char* msg, double expected, double actual) {
    double diff = expected - actual;
    if (diff < 0) diff = -diff;
    if (diff < 1e-6) {
        printf("Test passed: %s\\n", msg);
    } else {
        printf("Test failed: %s\\nExpected: %f\\nActual:   %f\\n", msg, expected, actual);
        exit(1);
    }
}

static void _harness_equal_check_str(const char* msg, const char* expected, const char* actual) {
    if (expected == actual || (expected && actual && strcmp(expected, actual) == 0)) {
        printf("Test passed: %s\\n", msg);
    } else {
        printf("Test failed: %s\\nExpected: %s\\nActual:   %s\\n", msg, expected ? expected : "NULL", actual ? actual : "NULL");
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
            printf("Test passed: %s\\n", msg);
            return;
        }
    }

    printf("Test failed: %s\\nExpected: [", msg);
    for (int i = 0; i < exp_len; i++) printf("%d%s", expected[i], (i + 1 < exp_len) ? ", " : "");
    printf("]\\nActual:   [");
    for (int i = 0; i < act_len; i++) printf("%d%s", actual[i], (i + 1 < act_len) ? ", " : "");
    printf("]\\n");
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
        printf("Test passed: %s\\n", msg);
        return;
    }

    printf("Test failed: %s\\nExpected:\\n[", msg);
    for (int i = 0; i < exp_rows; i++) {
        int elen = exp_cols ? exp_cols[i] : 0;
        printf("  [");
        for (int j = 0; j < elen; j++) printf("%d%s", exp[i][j], (j + 1 < elen) ? ", " : "");
        printf("]%s\\n", (i + 1 < exp_rows) ? "," : "");
    }
    printf("]\\nActual:\\n[");
    for (int i = 0; i < act_rows; i++) {
        int alen = act_cols ? act_cols[i] : 0;
        printf("  [");
        for (int j = 0; j < alen; j++) printf("%d%s", act[i][j], (j + 1 < alen) ? ", " : "");
        printf("]%s\\n", (i + 1 < act_rows) ? "," : "");
    }
    printf("]\\n");
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
        printf("Test passed: %s\\n", msg);
        return;
    }

    printf("Test failed: %s\\nExpected:\\n[", msg);
    for (int i = 0; i < exp_rows; i++) {
        int elen = n_exp_cols ? n_exp_cols[i] : 0;
        printf("  [");
        for (int j = 0; j < elen; j++) printf("\\"%s\\"%s", n_exp[i][j], (j + 1 < elen) ? ", " : "");
        printf("]%s\\n", (i + 1 < exp_rows) ? "," : "");
    }
    printf("]\\nActual:\\n[");
    for (int i = 0; i < act_rows; i++) {
        int alen = n_act_cols ? n_act_cols[i] : 0;
        printf("  [");
        for (int j = 0; j < alen; j++) printf("\\"%s\\"%s", n_act[i][j], (j + 1 < alen) ? ", " : "");
        printf("]%s\\n", (i + 1 < act_rows) ? "," : "");
    }
    printf("]\\n");
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

#define equal_check(msg, exp, act) _Generic((exp), \\
    int: _harness_equal_check_int, \\
    long long: _harness_equal_check_long, \\
    double: _harness_equal_check_double, \\
    char*: _harness_equal_check_str, \\
    const char*: _harness_equal_check_str, \\
    default: _harness_equal_check_int \\
)(msg, exp, act)

#endif
`,t=class e{static read_bytes(t,n){let r=new e;return r.buf=t.getUint32(n,!0),r.buf_len=t.getUint32(n+4,!0),r}static read_bytes_array(t,n,r){let i=[];for(let a=0;a<r;a++)i.push(e.read_bytes(t,n+8*a));return i}},n=class e{static read_bytes(t,n){let r=new e;return r.buf=t.getUint32(n,!0),r.buf_len=t.getUint32(n+4,!0),r}static read_bytes_array(t,n,r){let i=[];for(let a=0;a<r;a++)i.push(e.read_bytes(t,n+8*a));return i}},r=class{write_bytes(e,t){e.setUint8(t,this.fs_filetype),e.setUint16(t+2,this.fs_flags,!0),e.setBigUint64(t+8,this.fs_rights_base,!0),e.setBigUint64(t+16,this.fs_rights_inherited,!0)}constructor(e,t){this.fs_rights_base=0n,this.fs_rights_inherited=0n,this.fs_filetype=e,this.fs_flags=t}},i=class{write_bytes(e,t){e.setBigUint64(t,this.dev,!0),e.setBigUint64(t+8,this.ino,!0),e.setUint8(t+16,this.filetype),e.setBigUint64(t+24,this.nlink,!0),e.setBigUint64(t+32,this.size,!0),e.setBigUint64(t+38,this.atim,!0),e.setBigUint64(t+46,this.mtim,!0),e.setBigUint64(t+52,this.ctim,!0)}constructor(e,t,n){this.dev=0n,this.nlink=0n,this.atim=0n,this.mtim=0n,this.ctim=0n,this.ino=e,this.filetype=t,this.size=n}},a=class e{static read_bytes(t,n){return new e(t.getBigUint64(n,!0),t.getUint8(n+8),t.getUint32(n+16,!0),t.getBigUint64(n+24,!0),t.getUint16(n+36,!0))}constructor(e,t,n,r,i){this.userdata=e,this.eventtype=t,this.clockid=n,this.timeout=r,this.flags=i}},o=class{write_bytes(e,t){e.setBigUint64(t,this.userdata,!0),e.setUint16(t+8,this.error,!0),e.setUint8(t+10,this.eventtype)}constructor(e,t,n){this.userdata=e,this.error=t,this.eventtype=n}};let s=class{enable(e){this.log=c(e===void 0||e,this.prefix)}get enabled(){return this.isEnabled}constructor(e){this.isEnabled=e,this.prefix=`wasi:`,this.enable(e)}};function c(e,t){return e?console.log.bind(console,`%c%s`,`color: #265BA0`,t):()=>{}}let l=new s(!1);var u=class extends Error{constructor(e){super(`exit with exit code `+e),this.code=e}};let d=class{start(e){this.inst=e;try{return e.exports._start(),0}catch(e){if(e instanceof u)return e.code;throw e}}initialize(e){this.inst=e,e.exports._initialize&&e.exports._initialize()}constructor(e,r,i,s={}){this.args=[],this.env=[],this.fds=[],l.enable(s.debug),this.args=e,this.env=r,this.fds=i;let c=this;this.wasiImport={args_sizes_get(e,t){let n=new DataView(c.inst.exports.memory.buffer);n.setUint32(e,c.args.length,!0);let r=0;for(let e of c.args)r+=e.length+1;return n.setUint32(t,r,!0),l.log(n.getUint32(e,!0),n.getUint32(t,!0)),0},args_get(e,t){let n=new DataView(c.inst.exports.memory.buffer),r=new Uint8Array(c.inst.exports.memory.buffer),i=t;for(let i=0;i<c.args.length;i++){n.setUint32(e,t,!0),e+=4;let a=new TextEncoder().encode(c.args[i]);r.set(a,t),n.setUint8(t+a.length,0),t+=a.length+1}return l.enabled&&l.log(new TextDecoder(`utf-8`).decode(r.slice(i,t))),0},environ_sizes_get(e,t){let n=new DataView(c.inst.exports.memory.buffer);n.setUint32(e,c.env.length,!0);let r=0;for(let e of c.env)r+=new TextEncoder().encode(e).length+1;return n.setUint32(t,r,!0),l.log(n.getUint32(e,!0),n.getUint32(t,!0)),0},environ_get(e,t){let n=new DataView(c.inst.exports.memory.buffer),r=new Uint8Array(c.inst.exports.memory.buffer),i=t;for(let i=0;i<c.env.length;i++){n.setUint32(e,t,!0),e+=4;let a=new TextEncoder().encode(c.env[i]);r.set(a,t),n.setUint8(t+a.length,0),t+=a.length+1}return l.enabled&&l.log(new TextDecoder(`utf-8`).decode(r.slice(i,t))),0},clock_res_get(e,t){let n;switch(e){case 1:n=5000n;break;case 0:n=1000000n;break;default:return 52}return new DataView(c.inst.exports.memory.buffer).setBigUint64(t,n,!0),0},clock_time_get(e,t,n){let r=new DataView(c.inst.exports.memory.buffer);if(e===0)r.setBigUint64(n,BigInt(new Date().getTime())*1000000n,!0);else if(e==1){let e;try{e=BigInt(Math.round(performance.now()*1e6))}catch{e=0n}r.setBigUint64(n,e,!0)}else r.setBigUint64(n,0n,!0);return 0},fd_advise(e,t,n,r){return c.fds[e]==null?8:0},fd_allocate(e,t,n){return c.fds[e]==null?8:c.fds[e].fd_allocate(t,n)},fd_close(e){if(c.fds[e]!=null){let t=c.fds[e].fd_close();return c.fds[e]=void 0,t}return 8},fd_datasync(e){return c.fds[e]==null?8:c.fds[e].fd_sync()},fd_fdstat_get(e,t){if(c.fds[e]!=null){let{ret:n,fdstat:r}=c.fds[e].fd_fdstat_get();return r?.write_bytes(new DataView(c.inst.exports.memory.buffer),t),n}return 8},fd_fdstat_set_flags(e,t){return c.fds[e]==null?8:c.fds[e].fd_fdstat_set_flags(t)},fd_fdstat_set_rights(e,t,n){return c.fds[e]==null?8:c.fds[e].fd_fdstat_set_rights(t,n)},fd_filestat_get(e,t){if(c.fds[e]!=null){let{ret:n,filestat:r}=c.fds[e].fd_filestat_get();return r?.write_bytes(new DataView(c.inst.exports.memory.buffer),t),n}return 8},fd_filestat_set_size(e,t){return c.fds[e]==null?8:c.fds[e].fd_filestat_set_size(t)},fd_filestat_set_times(e,t,n,r){return c.fds[e]==null?8:c.fds[e].fd_filestat_set_times(t,n,r)},fd_pread(e,n,r,i,a){let o=new DataView(c.inst.exports.memory.buffer),s=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let l=t.read_bytes_array(o,n,r),u=0;for(let t of l){let{ret:n,data:r}=c.fds[e].fd_pread(t.buf_len,i);if(n!=0)return o.setUint32(a,u,!0),n;if(s.set(r,t.buf),u+=r.length,i+=BigInt(r.length),r.length!=t.buf_len)break}return o.setUint32(a,u,!0),0}return 8},fd_prestat_get(e,t){let n=new DataView(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let{ret:r,prestat:i}=c.fds[e].fd_prestat_get();return i?.write_bytes(n,t),r}return 8},fd_prestat_dir_name(e,t,n){if(c.fds[e]!=null){let{ret:r,prestat:i}=c.fds[e].fd_prestat_get();if(i==null)return r;let a=i.inner.pr_name;return new Uint8Array(c.inst.exports.memory.buffer).set(a.slice(0,n),t),a.byteLength>n?37:0}return 8},fd_pwrite(e,t,r,i,a){let o=new DataView(c.inst.exports.memory.buffer),s=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let l=n.read_bytes_array(o,t,r),u=0;for(let t of l){let n=s.slice(t.buf,t.buf+t.buf_len),{ret:r,nwritten:l}=c.fds[e].fd_pwrite(n,i);if(r!=0)return o.setUint32(a,u,!0),r;if(u+=l,i+=BigInt(l),l!=n.byteLength)break}return o.setUint32(a,u,!0),0}return 8},fd_read(e,n,r,i){let a=new DataView(c.inst.exports.memory.buffer),o=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let s=t.read_bytes_array(a,n,r),l=0;for(let t of s){let{ret:n,data:r}=c.fds[e].fd_read(t.buf_len);if(n!=0)return a.setUint32(i,l,!0),n;if(o.set(r,t.buf),l+=r.length,r.length!=t.buf_len)break}return a.setUint32(i,l,!0),0}return 8},fd_readdir(e,t,n,r,i){let a=new DataView(c.inst.exports.memory.buffer),o=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let s=0;for(;;){let{ret:l,dirent:u}=c.fds[e].fd_readdir_single(r);if(l!=0)return a.setUint32(i,s,!0),l;if(u==null)break;if(n-s<u.head_length()){s=n;break}let d=new ArrayBuffer(u.head_length());if(u.write_head_bytes(new DataView(d),0),o.set(new Uint8Array(d).slice(0,Math.min(d.byteLength,n-s)),t),t+=u.head_length(),s+=u.head_length(),n-s<u.name_length()){s=n;break}u.write_name_bytes(o,t,n-s),t+=u.name_length(),s+=u.name_length(),r=u.d_next}return a.setUint32(i,s,!0),0}return 8},fd_renumber(e,t){if(c.fds[e]!=null&&c.fds[t]!=null){let n=c.fds[t].fd_close();return n==0?(c.fds[t]=c.fds[e],c.fds[e]=void 0,0):n}return 8},fd_seek(e,t,n,r){let i=new DataView(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let{ret:a,offset:o}=c.fds[e].fd_seek(t,n);return i.setBigInt64(r,o,!0),a}return 8},fd_sync(e){return c.fds[e]==null?8:c.fds[e].fd_sync()},fd_tell(e,t){let n=new DataView(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let{ret:r,offset:i}=c.fds[e].fd_tell();return n.setBigUint64(t,i,!0),r}return 8},fd_write(e,t,r,i){let a=new DataView(c.inst.exports.memory.buffer),o=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let s=n.read_bytes_array(a,t,r),l=0;for(let t of s){let n=o.slice(t.buf,t.buf+t.buf_len),{ret:r,nwritten:s}=c.fds[e].fd_write(n);if(r!=0)return a.setUint32(i,l,!0),r;if(l+=s,s!=n.byteLength)break}return a.setUint32(i,l,!0),0}return 8},path_create_directory(e,t,n){let r=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let i=new TextDecoder(`utf-8`).decode(r.slice(t,t+n));return c.fds[e].path_create_directory(i)}return 8},path_filestat_get(e,t,n,r,i){let a=new DataView(c.inst.exports.memory.buffer),o=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let s=new TextDecoder(`utf-8`).decode(o.slice(n,n+r)),{ret:l,filestat:u}=c.fds[e].path_filestat_get(t,s);return u?.write_bytes(a,i),l}return 8},path_filestat_set_times(e,t,n,r,i,a,o){let s=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let l=new TextDecoder(`utf-8`).decode(s.slice(n,n+r));return c.fds[e].path_filestat_set_times(t,l,i,a,o)}return 8},path_link(e,t,n,r,i,a,o){let s=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null&&c.fds[i]!=null){let l=new TextDecoder(`utf-8`).decode(s.slice(n,n+r)),u=new TextDecoder(`utf-8`).decode(s.slice(a,a+o)),{ret:d,inode_obj:f}=c.fds[e].path_lookup(l,t);return f==null?d:c.fds[i].path_link(u,f,!1)}return 8},path_open(e,t,n,r,i,a,o,s,u){let d=new DataView(c.inst.exports.memory.buffer),f=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let p=new TextDecoder(`utf-8`).decode(f.slice(n,n+r));l.log(p);let{ret:m,fd_obj:h}=c.fds[e].path_open(t,p,i,a,o,s);if(m!=0)return m;c.fds.push(h);let g=c.fds.length-1;return d.setUint32(u,g,!0),0}return 8},path_readlink(e,t,n,r,i,a){let o=new DataView(c.inst.exports.memory.buffer),s=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let u=new TextDecoder(`utf-8`).decode(s.slice(t,t+n));l.log(u);let{ret:d,data:f}=c.fds[e].path_readlink(u);if(f!=null){let e=new TextEncoder().encode(f);if(e.length>i)return o.setUint32(a,0,!0),8;s.set(e,r),o.setUint32(a,e.length,!0)}return d}return 8},path_remove_directory(e,t,n){let r=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let i=new TextDecoder(`utf-8`).decode(r.slice(t,t+n));return c.fds[e].path_remove_directory(i)}return 8},path_rename(e,t,n,r,i,a){let o=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null&&c.fds[r]!=null){let s=new TextDecoder(`utf-8`).decode(o.slice(t,t+n)),l=new TextDecoder(`utf-8`).decode(o.slice(i,i+a)),{ret:u,inode_obj:d}=c.fds[e].path_unlink(s);if(d==null)return u;if(u=c.fds[r].path_link(l,d,!0),u!=0&&c.fds[e].path_link(s,d,!0)!=0)throw`path_link should always return success when relinking an inode back to the original place`;return u}return 8},path_symlink(e,t,n,r,i){let a=new Uint8Array(c.inst.exports.memory.buffer);return c.fds[n]==null?8:(new TextDecoder(`utf-8`).decode(a.slice(e,e+t)),new TextDecoder(`utf-8`).decode(a.slice(r,r+i)),58)},path_unlink_file(e,t,n){let r=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let i=new TextDecoder(`utf-8`).decode(r.slice(t,t+n));return c.fds[e].path_unlink_file(i)}return 8},poll_oneoff(e,t,n){if(n===0)return 28;if(n>1)return l.log(`poll_oneoff: only a single subscription is supported`),58;let r=new DataView(c.inst.exports.memory.buffer),i=a.read_bytes(r,e),s=i.eventtype,u=i.clockid,d=i.timeout;if(s!==0)return l.log(`poll_oneoff: only clock subscriptions are supported`),58;let f;if(u===1)f=()=>BigInt(Math.round(performance.now()*1e6));else if(u===0)f=()=>BigInt(new Date().getTime())*1000000n;else return 28;let p=i.flags&1?d:f()+d;for(;p>f(););return new o(i.userdata,0,s).write_bytes(r,t),0},proc_exit(e){throw new u(e)},proc_raise(e){throw`raised signal `+e},sched_yield(){},random_get(e,t){let n=new Uint8Array(c.inst.exports.memory.buffer).subarray(e,e+t);if(`crypto`in globalThis&&(typeof SharedArrayBuffer>`u`||!(c.inst.exports.memory.buffer instanceof SharedArrayBuffer)))for(let e=0;e<t;e+=65536)crypto.getRandomValues(n.subarray(e,e+65536));else for(let e=0;e<t;e++)n[e]=Math.random()*256|0},sock_recv(e,t,n){throw`sockets not supported`},sock_send(e,t,n){throw`sockets not supported`},sock_shutdown(e,t){throw`sockets not supported`},sock_accept(e,t){throw`sockets not supported`}}}};var f=class{fd_allocate(e,t){return 58}fd_close(){return 0}fd_fdstat_get(){return{ret:58,fdstat:null}}fd_fdstat_set_flags(e){return 58}fd_fdstat_set_rights(e,t){return 58}fd_filestat_get(){return{ret:58,filestat:null}}fd_filestat_set_size(e){return 58}fd_filestat_set_times(e,t,n){return 58}fd_pread(e,t){return{ret:58,data:new Uint8Array}}fd_prestat_get(){return{ret:58,prestat:null}}fd_pwrite(e,t){return{ret:58,nwritten:0}}fd_read(e){return{ret:58,data:new Uint8Array}}fd_readdir_single(e){return{ret:58,dirent:null}}fd_seek(e,t){return{ret:58,offset:0n}}fd_sync(){return 0}fd_tell(){return{ret:58,offset:0n}}fd_write(e){return{ret:58,nwritten:0}}path_create_directory(e){return 58}path_filestat_get(e,t){return{ret:58,filestat:null}}path_filestat_set_times(e,t,n,r,i){return 58}path_link(e,t,n){return 58}path_unlink(e){return{ret:58,inode_obj:null}}path_lookup(e,t){return{ret:58,inode_obj:null}}path_open(e,t,n,r,i,a){return{ret:54,fd_obj:null}}path_readlink(e){return{ret:58,data:null}}path_remove_directory(e){return 58}path_rename(e,t,n){return 58}path_unlink_file(e){return 58}},p=class e{static issue_ino(){return e.next_ino++}static root_ino(){return 0n}constructor(){this.ino=e.issue_ino()}};p.next_ino=1n;var m=class extends f{fd_allocate(e,t){if(!(this.file.size>e+t)){let n=new Uint8Array(Number(e+t));n.set(this.file.data,0),this.file.data=n}return 0}fd_fdstat_get(){return{ret:0,fdstat:new r(4,0)}}fd_filestat_set_size(e){if(this.file.size>e)this.file.data=new Uint8Array(this.file.data.buffer.slice(0,Number(e)));else{let t=new Uint8Array(Number(e));t.set(this.file.data,0),this.file.data=t}return 0}fd_read(e){let t=this.file.data.slice(Number(this.file_pos),Number(this.file_pos+BigInt(e)));return this.file_pos+=BigInt(t.length),{ret:0,data:t}}fd_pread(e,t){return{ret:0,data:this.file.data.slice(Number(t),Number(t+BigInt(e)))}}fd_seek(e,t){let n;switch(t){case 0:n=e;break;case 1:n=this.file_pos+e;break;case 2:n=BigInt(this.file.data.byteLength)+e;break;default:return{ret:28,offset:0n}}return n<0?{ret:28,offset:0n}:(this.file_pos=n,{ret:0,offset:this.file_pos})}fd_tell(){return{ret:0,offset:this.file_pos}}fd_write(e){if(this.file.readonly)return{ret:8,nwritten:0};if(this.file_pos+BigInt(e.byteLength)>this.file.size){let t=this.file.data;this.file.data=new Uint8Array(Number(this.file_pos+BigInt(e.byteLength))),this.file.data.set(t)}return this.file.data.set(e,Number(this.file_pos)),this.file_pos+=BigInt(e.byteLength),{ret:0,nwritten:e.byteLength}}fd_pwrite(e,t){if(this.file.readonly)return{ret:8,nwritten:0};if(t+BigInt(e.byteLength)>this.file.size){let n=this.file.data;this.file.data=new Uint8Array(Number(t+BigInt(e.byteLength))),this.file.data.set(n)}return this.file.data.set(e,Number(t)),{ret:0,nwritten:e.byteLength}}fd_filestat_get(){return{ret:0,filestat:this.file.stat()}}constructor(e){super(),this.file_pos=0n,this.file=e}},h=class extends p{path_open(e,t,n){if(this.readonly&&(t&BigInt(64))==BigInt(64))return{ret:63,fd_obj:null};if((e&8)==8){if(this.readonly)return{ret:63,fd_obj:null};this.data=new Uint8Array([])}let r=new m(this);return n&1&&r.fd_seek(0n,2),{ret:0,fd_obj:r}}get size(){return BigInt(this.data.byteLength)}stat(){return new i(this.ino,4,this.size)}constructor(e,t){super(),this.data=new Uint8Array(e),this.readonly=!!t?.readonly}},g=class e extends f{fd_filestat_get(){return{ret:0,filestat:new i(this.ino,2,BigInt(0))}}fd_fdstat_get(){let e=new r(2,0);return e.fs_rights_base=BigInt(64),{ret:0,fdstat:e}}fd_write(e){return this.write(e),{ret:0,nwritten:e.byteLength}}static lineBuffered(t){let n=new TextDecoder(`utf-8`,{fatal:!1}),r=``;return new e(e=>{r+=n.decode(e,{stream:!0});let i=r.split(`
`);for(let[e,n]of i.entries())e<i.length-1?t(n):r=n})}constructor(e){super(),this.ino=p.issue_ino(),this.write=e}};function _(e){function t(e){self.postMessage(e)}let n=[],r=!1,i=new Set,a=null;Promise.resolve().then(()=>e.init?.()).then(()=>{t({type:`READY`})}).catch(e=>{console.error(`[Worker Init Error]:`,e),t({type:`INIT_ERROR`,error:e?.message||String(e)})});async function o(n){let{id:r,userCode:a,testCode:o=``}=n;if(i.has(r)){i.delete(r),t({type:`RESULT`,id:r,success:!1,output:``,error:`Execution cancelled.`});return}let s={id:r,userCode:a,testCode:o,isCancelled:()=>i.has(r)};try{let n=await e.execute(a,o,s);t({type:`RESULT`,id:r,success:n.success,output:n.output,error:n.error})}catch(e){t({type:`RESULT`,id:r,success:!1,output:``,error:e?.message||String(e)})}finally{i.delete(r)}}async function s(n){let{id:r,code:o}=n;if(a&&a!==r){t({type:`LINT_RESULT`,id:r,diagnostics:[]});return}if(i.has(r)){i.delete(r),t({type:`LINT_RESULT`,id:r,diagnostics:[]});return}let s={id:r,code:o,isCancelled:()=>i.has(r)||a!==null&&a!==r};try{let n=e.lint?await e.lint(o,s):[];t({type:`LINT_RESULT`,id:r,diagnostics:Array.isArray(n)?n:[]})}catch(e){console.error(`[Worker Lint Error]:`,e),t({type:`LINT_RESULT`,id:r,diagnostics:[]})}finally{i.delete(r)}}async function c(n){try{e.reset&&await e.reset(),t({type:`RESET_DONE`,id:n.id})}catch(e){console.error(`[Worker Reset Error]:`,e),t({type:`RESET_DONE`,id:n.id})}}async function l(){if(!r){r=!0;try{for(;n.length>0;){let e=n.shift();e.type===`RUN`?await o(e):e.type===`LINT`?await s(e):e.type===`RESET`&&await c(e)}}finally{r=!1}}}self.onmessage=e=>{let t=e.data;if(!(!t||!t.type)){if(t.type===`CANCEL`){i.add(t.id);return}t.type===`LINT`&&(a=t.id),n.push(t),l()}}}let v=null,y=!1,b=null;async function x(){if(!(y&&v))try{let t=await import(`https://cdn.jsdelivr.net/npm/@yowasp/clang@22.0.0-git20542-10/gen/bundle.js`);if(v=t.runClang||t.commands?.clang||t.default?.runClang,!v)throw Error(`Failed to find runClang in the loaded module`);try{let t=(await v([`clang`,`-x`,`c-header`,`-Xclang`,`-fno-pch-timestamp`,`harness.h`,`-o`,`harness.pch`],{"harness.h":e},{stdout:()=>{},stderr:()=>{}}))?.[`harness.pch`];t&&t instanceof Uint8Array&&(b=t)}catch(e){console.warn(`[C Worker] PCH precompilation skipped, using direct include fallback:`,e),b=null}b||await v([`clang`,`--version`],{},{stdout:()=>{},stderr:()=>{}}),y=!0}catch(e){throw console.error(`[C Worker] Clang warmup failed:`,e),e}}function S(e,t=``,n=!0){let r=/\b(?:int\s+)?main\s*\(/,i=r.test(t),a=r.test(e),o=``;return n&&(o+=`#ifndef _CODEBOOK_HARNESS_C_
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
        printf("Test passed: %s\\n", msg);
    } else {
        printf("Test failed: %s\\n", msg);
        exit(1);
    }
}

static void _harness_equal_check_int(const char* msg, int expected, int actual) {
    if (expected == actual) {
        printf("Test passed: %s\\n", msg);
    } else {
        printf("Test failed: %s\\nExpected: %d\\nActual:   %d\\n", msg, expected, actual);
        exit(1);
    }
}

static void _harness_equal_check_long(const char* msg, long long expected, long long actual) {
    if (expected == actual) {
        printf("Test passed: %s\\n", msg);
    } else {
        printf("Test failed: %s\\nExpected: %lld\\nActual:   %lld\\n", msg, expected, actual);
        exit(1);
    }
}

static void _harness_equal_check_double(const char* msg, double expected, double actual) {
    double diff = expected - actual;
    if (diff < 0) diff = -diff;
    if (diff < 1e-6) {
        printf("Test passed: %s\\n", msg);
    } else {
        printf("Test failed: %s\\nExpected: %f\\nActual:   %f\\n", msg, expected, actual);
        exit(1);
    }
}

static void _harness_equal_check_str(const char* msg, const char* expected, const char* actual) {
    if (expected == actual || (expected && actual && strcmp(expected, actual) == 0)) {
        printf("Test passed: %s\\n", msg);
    } else {
        printf("Test failed: %s\\nExpected: %s\\nActual:   %s\\n", msg, expected ? expected : "NULL", actual ? actual : "NULL");
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
            printf("Test passed: %s\\n", msg);
            return;
        }
    }

    printf("Test failed: %s\\nExpected: [", msg);
    for (int i = 0; i < exp_len; i++) printf("%d%s", expected[i], (i + 1 < exp_len) ? ", " : "");
    printf("]\\nActual:   [");
    for (int i = 0; i < act_len; i++) printf("%d%s", actual[i], (i + 1 < act_len) ? ", " : "");
    printf("]\\n");
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
        printf("Test passed: %s\\n", msg);
        return;
    }

    printf("Test failed: %s\\nExpected:\\n[", msg);
    for (int i = 0; i < exp_rows; i++) {
        int elen = exp_cols ? exp_cols[i] : 0;
        printf("  [");
        for (int j = 0; j < elen; j++) printf("%d%s", exp[i][j], (j + 1 < elen) ? ", " : "");
        printf("]%s\\n", (i + 1 < exp_rows) ? "," : "");
    }
    printf("]\\nActual:\\n[");
    for (int i = 0; i < act_rows; i++) {
        int alen = act_cols ? act_cols[i] : 0;
        printf("  [");
        for (int j = 0; j < alen; j++) printf("%d%s", act[i][j], (j + 1 < alen) ? ", " : "");
        printf("]%s\\n", (i + 1 < act_rows) ? "," : "");
    }
    printf("]\\n");
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
        printf("Test passed: %s\\n", msg);
        return;
    }

    printf("Test failed: %s\\nExpected:\\n[", msg);
    for (int i = 0; i < exp_rows; i++) {
        int elen = n_exp_cols ? n_exp_cols[i] : 0;
        printf("  [");
        for (int j = 0; j < elen; j++) printf("\\"%s\\"%s", n_exp[i][j], (j + 1 < elen) ? ", " : "");
        printf("]%s\\n", (i + 1 < exp_rows) ? "," : "");
    }
    printf("]\\nActual:\\n[");
    for (int i = 0; i < act_rows; i++) {
        int alen = n_act_cols ? n_act_cols[i] : 0;
        printf("  [");
        for (int j = 0; j < alen; j++) printf("\\"%s\\"%s", n_act[i][j], (j + 1 < alen) ? ", " : "");
        printf("]%s\\n", (i + 1 < act_rows) ? "," : "");
    }
    printf("]\\n");
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

#define equal_check(msg, exp, act) _Generic((exp), \\
    int: _harness_equal_check_int, \\
    long long: _harness_equal_check_long, \\
    double: _harness_equal_check_double, \\
    char*: _harness_equal_check_str, \\
    const char*: _harness_equal_check_str, \\
    default: _harness_equal_check_int \\
)(msg, exp, act)

#endif


`),i&&a?(o+=`#define main __user_unused_main
`,o+=`#line 1 "user.c"
`+e+`

`,o+=`#undef main
`):o+=`#line 1 "user.c"
`+e+`

`,t.trim()&&(o+=`#line 1 "test.c"
`+t+`
`),!i&&!a&&(o+=`
int main(int argc, char** argv) {
    return 0;
}
`),o}function C(e){if(!e||!e.trim())return[];let t=[],n=/(?:user\.c):(\d+):(\d+):\s*(error|warning|note):\s*(.*)/g,r,i=null;for(;(r=n.exec(e))!==null;){let e=parseInt(r[1],10)||1,n=parseInt(r[2],10)||1,a=r[3],o=r[4].trim();if(a===`note`){i&&Math.abs((i.line||1)-e)<=1&&(i.message+=` (note: ${o})`);continue}let s={line:e,column:n,endLine:e,endColumn:n+1,message:o,severity:a===`error`?`error`:`warning`,source:`clang`};t.push(s),i=s}return t}function w(e){if(!e)return``;let t=e.split(`
`),n=[];for(let e of t)if(e.includes(`test.c:`)){let t=e.replace(/test\.c:\d+:\d+:\s*(error|warning):\s*/,``);n.push(`[Function Signature Mismatch] Test harness compilation error:\n  -> ${t}`)}else n.push(e);return n.join(`
`)}_({async init(){await x()},async execute(t,n=``){await x();let r=!!b,i=S(t,n,!r),a=``,o=new TextDecoder(`utf-8`),s=[`clang`,`-O0`,`-Wall`,`-Wno-unused-variable`,`-Wno-unused-function`],c={"main.c":i};r&&b&&(s.push(`-include-pch`,`harness.pch`),c[`harness.pch`]=b,c[`harness.h`]=e),s.push(`main.c`,`-o`,`main.wasm`);let l;try{l=await v(s,c,{stdout:()=>{},stderr:e=>{e&&(a+=o.decode(e))}})}catch(e){return{success:!1,output:``,error:w(a)||e?.message||String(e)}}let f=l?.[`main.wasm`];if(!f||typeof f==`string`||!(f instanceof Uint8Array))return{success:!1,output:``,error:w(a)||`Compilation failed: no WebAssembly binary was generated.`};let p=``,_=``,y=new g(e=>{p+=o.decode(e)}),C=new g(e=>{_+=o.decode(e)}),T=new m(new h(new Uint8Array)),E=new d([`main.wasm`],[],[T,y,C]);try{let e=await WebAssembly.instantiate(f,{wasi_snapshot_preview1:E.wasiImport}),t=e.instance||e,n=0;try{E.start(t)}catch(e){if(e instanceof u)n=e.code;else throw e}let r=n===0;return{success:r,output:p,error:r?_||void 0:_||`Process exited with code ${n}`}}catch(e){return{success:!1,output:p,error:e?.message||String(e)}}},async lint(t){if(!t.trim())return[];try{await x();let n=!!b,r=S(t,``,!n),i=``,a=new TextDecoder(`utf-8`),o=[`clang`,`-fsyntax-only`,`-Wall`],s={"main.c":r};n&&b&&(o.push(`-include-pch`,`harness.pch`),s[`harness.pch`]=b,s[`harness.h`]=e),o.push(`main.c`);try{await v(o,s,{stdout:()=>{},stderr:e=>{e&&(i+=a.decode(e))}})}catch{}return C(i)}catch(e){return console.warn(`[C Worker Lint Error]:`,e),[]}},async reset(){y=!1,b=null,await x()}})})();