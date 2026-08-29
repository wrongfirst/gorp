#ifndef _CODEBOOK_HARNESS_HPP_
#define _CODEBOOK_HARNESS_HPP_

#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <map>
#include <memory>
#include <numeric>
#include <optional>
#include <queue>
#include <set>
#include <stack>
#include <string>
#include <tuple>
#include <type_traits>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <variant>
#include <vector>

/* ========================================================================== */
/* 1. Data Structures                                                         */
/* ========================================================================== */

struct ListNode {
  int val;
  ListNode *next;
  ListNode(int x = 0, ListNode *n = nullptr) : val(x), next(n) {}
};

struct TreeNode {
  int val;
  TreeNode *left;
  TreeNode *right;
  TreeNode(int x = 0, TreeNode *l = nullptr, TreeNode *r = nullptr)
      : val(x), left(l), right(r) {}
};

struct Node {
  int val;
  std::vector<Node *> neighbors;
  Node(int _val = 0, std::vector<Node *> _neighbors = {})
      : val(_val), neighbors(_neighbors) {}
};

struct Interval {
  int start;
  int end;
  Interval(int s = 0, int e = 0) : start(s), end(e) {}
  bool operator==(const Interval &other) const {
    return start == other.start && end == other.end;
  }
};

/* ========================================================================== */
/* 2. Helper Functions                                                        */
/* ========================================================================== */

inline ListNode *list_to_linked_list(const std::vector<int> &arr) {
  if (arr.empty())
    return nullptr;
  ListNode *head = new ListNode(arr[0]);
  ListNode *curr = head;
  for (size_t i = 1; i < arr.size(); ++i) {
    curr->next = new ListNode(arr[i]);
    curr = curr->next;
  }
  return head;
}

inline std::vector<int> linked_list_to_list(const ListNode *head) {
  std::vector<int> res;
  const ListNode *curr = head;
  std::unordered_set<const ListNode *> visited;
  const size_t MAX_SAFETY = 50000;
  while (curr != nullptr && res.size() < MAX_SAFETY) {
    if (visited.count(curr)) {
      break;
    }
    visited.insert(curr);
    res.push_back(curr->val);
    curr = curr->next;
  }
  return res;
}

inline ListNode *make_cycle(const std::vector<int> &arr, int pos) {
  ListNode *head = list_to_linked_list(arr);
  if (pos == -1 || head == nullptr)
    return head;

  ListNode *tail = head;
  ListNode *target = nullptr;
  int idx = 0;
  while (tail != nullptr) {
    if (idx == pos)
      target = tail;
    if (tail->next == nullptr)
      break;
    tail = tail->next;
    idx++;
  }
  if (tail && target) {
    tail->next = target;
  }
  return head;
}

inline TreeNode *list_to_tree(const std::vector<std::optional<int>> &arr) {
  if (arr.empty() || !arr[0].has_value())
    return nullptr;
  TreeNode *root = new TreeNode(arr[0].value());
  std::queue<TreeNode *> q;
  q.push(root);
  size_t i = 1;
  while (!q.empty() && i < arr.size()) {
    TreeNode *curr = q.front();
    q.pop();

    if (i < arr.size() && arr[i].has_value()) {
      curr->left = new TreeNode(arr[i].value());
      q.push(curr->left);
    }
    i++;

    if (i < arr.size() && arr[i].has_value()) {
      curr->right = new TreeNode(arr[i].value());
      q.push(curr->right);
    }
    i++;
  }
  return root;
}

inline TreeNode *ints_to_tree(const std::vector<int> &arr) {
  std::vector<std::optional<int>> opt_arr;
  opt_arr.reserve(arr.size());
  for (int v : arr)
    opt_arr.push_back(v);
  return list_to_tree(opt_arr);
}

inline std::vector<std::optional<int>> tree_to_list(const TreeNode *root) {
  std::vector<std::optional<int>> res;
  if (!root)
    return res;

  std::queue<const TreeNode *> q;
  q.push(root);

  while (!q.empty()) {
    const TreeNode *curr = q.front();
    q.pop();

    if (curr) {
      res.push_back(curr->val);
      q.push(curr->left);
      q.push(curr->right);
    } else {
      res.push_back(std::nullopt);
    }
  }

  // Trim trailing nulls
  while (!res.empty() && !res.back().has_value()) {
    res.pop_back();
  }
  return res;
}

inline std::vector<int> tree_to_ints(const TreeNode *root) {
  std::vector<int> res;
  if (!root)
    return res;
  std::queue<const TreeNode *> q;
  q.push(root);
  while (!q.empty()) {
    const TreeNode *curr = q.front();
    q.pop();
    if (curr) {
      res.push_back(curr->val);
      if (curr->left)
        q.push(curr->left);
      if (curr->right)
        q.push(curr->right);
    }
  }
  return res;
}

inline Node *build_graph(const std::vector<std::vector<int>> &adj) {
  if (adj.empty())
    return nullptr;
  std::unordered_map<int, Node *> node_map;
  for (size_t i = 1; i <= adj.size(); ++i) {
    node_map[static_cast<int>(i)] = new Node(static_cast<int>(i));
  }
  for (size_t i = 0; i < adj.size(); ++i) {
    int u = static_cast<int>(i + 1);
    for (int v : adj[i]) {
      if (node_map.count(v)) {
        node_map[u]->neighbors.push_back(node_map[v]);
      }
    }
  }
  return node_map.count(1) ? node_map[1] : nullptr;
}

inline std::vector<std::vector<int>> graph_to_adj(Node *node) {
  if (!node)
    return {};
  std::unordered_map<int, Node *> visited;
  std::function<void(Node *)> dfs = [&](Node *curr) {
    if (!curr || visited.count(curr->val))
      return;
    visited[curr->val] = curr;
    for (Node *nei : curr->neighbors) {
      dfs(nei);
    }
  };
  dfs(node);

  int max_val = 0;
  for (const auto &pair : visited) {
    if (pair.first > max_val) {
      max_val = pair.first;
    }
  }

  std::vector<std::vector<int>> adj(max_val);
  for (int i = 1; i <= max_val; ++i) {
    if (visited.count(i)) {
      for (Node *nei : visited[i]->neighbors) {
        if (nei) {
          adj[i - 1].push_back(nei->val);
        }
      }
    }
  }
  return adj;
}

template <typename T>
inline std::vector<std::vector<T>>
normalize_nested(std::vector<std::vector<T>> groups) {
  for (auto &inner : groups) {
    std::sort(inner.begin(), inner.end());
  }
  std::sort(groups.begin(), groups.end());
  return groups;
}

inline std::vector<std::string> sort_strings(std::vector<std::string> arr) {
  std::sort(arr.begin(), arr.end());
  return arr;
}

inline std::vector<int> sort_ints(std::vector<int> arr) {
  std::sort(arr.begin(), arr.end());
  return arr;
}

/* ========================================================================== */
/* 3. Value Serialization & Pretty Printing Helpers                           */
/* ========================================================================== */

namespace _harness_detail {

// Forward declarations
inline std::string to_string_repr(bool val);
inline std::string to_string_repr(char val);
inline std::string to_string_repr(const char *val);
inline std::string to_string_repr(const std::string &val);
inline std::string to_string_repr(const Interval &val);
inline std::string to_string_repr(const ListNode *head);
inline std::string to_string_repr(const TreeNode *root);

template <typename T>
typename std::enable_if<std::is_arithmetic<T>::value &&
                            !std::is_same<T, bool>::value &&
                            !std::is_same<T, char>::value,
                        std::string>::type
to_string_repr(const T &val);

template <typename T1, typename T2>
std::string to_string_repr(const std::pair<T1, T2> &p);

template <typename T> std::string to_string_repr(const std::optional<T> &val);
template <typename T> std::string to_string_repr(const std::vector<T> &vec);
template <typename T>
std::string to_string_repr(const std::vector<std::vector<T>> &mat);
template <typename K, typename V>
std::string to_string_repr(const std::map<K, V> &m);
template <typename K, typename V>
std::string to_string_repr(const std::unordered_map<K, V> &m);
template <typename T> std::string to_string_repr(const std::set<T> &s);
template <typename T> std::string to_string_repr(const std::unordered_set<T> &s);

inline std::string to_string_repr(bool val) { return val ? "true" : "false"; }

inline std::string to_string_repr(char val) {
  return std::string("'") + val + "'";
}

inline std::string to_string_repr(const char *val) {
  if (!val)
    return "null";
  return std::string("\"") + val + "\"";
}

inline std::string to_string_repr(const std::string &val) {
  return std::string("\"") + val + "\"";
}

template <typename T>
typename std::enable_if<std::is_arithmetic<T>::value &&
                            !std::is_same<T, bool>::value &&
                            !std::is_same<T, char>::value,
                        std::string>::type
to_string_repr(const T &val) {
  return std::to_string(val);
}

inline std::string to_string_repr(const Interval &val) {
  return "[" + std::to_string(val.start) + ", " + std::to_string(val.end) + "]";
}

template <typename T1, typename T2>
std::string to_string_repr(const std::pair<T1, T2> &p) {
  return "(" + to_string_repr(p.first) + ", " + to_string_repr(p.second) + ")";
}

template <typename T> std::string to_string_repr(const std::optional<T> &val) {
  if (!val.has_value())
    return "null";
  return to_string_repr(val.value());
}

template <typename T> std::string to_string_repr(const std::vector<T> &vec) {
  std::string res = "[";
  for (size_t i = 0; i < vec.size(); ++i) {
    if (i > 0) res += ", ";
    res += to_string_repr(vec[i]);
  }
  res += "]";
  return res;
}

template <typename T>
std::string to_string_repr(const std::vector<std::vector<T>> &mat) {
  if (mat.empty())
    return "[]";
  std::string res = "[\n";
  for (size_t i = 0; i < mat.size(); ++i) {
    res += "  [";
    for (size_t j = 0; j < mat[i].size(); ++j) {
      if (j > 0) res += ", ";
      res += to_string_repr(mat[i][j]);
    }
    res += (i + 1 < mat.size()) ? "],\n" : "]\n";
  }
  res += "]";
  return res;
}

template <typename K, typename V>
std::string to_string_repr(const std::map<K, V> &m) {
  std::string res = "{";
  size_t i = 0;
  for (const auto &pair : m) {
    if (i++ > 0) res += ", ";
    res += to_string_repr(pair.first) + ": " + to_string_repr(pair.second);
  }
  res += "}";
  return res;
}

template <typename K, typename V>
std::string to_string_repr(const std::unordered_map<K, V> &m) {
  std::string res = "{";
  size_t i = 0;
  for (const auto &pair : m) {
    if (i++ > 0) res += ", ";
    res += to_string_repr(pair.first) + ": " + to_string_repr(pair.second);
  }
  res += "}";
  return res;
}

template <typename T> std::string to_string_repr(const std::set<T> &s) {
  std::string res = "{";
  size_t i = 0;
  for (const auto &item : s) {
    if (i++ > 0) res += ", ";
    res += to_string_repr(item);
  }
  res += "}";
  return res;
}

template <typename T>
std::string to_string_repr(const std::unordered_set<T> &s) {
  std::string res = "{";
  size_t i = 0;
  for (const auto &item : s) {
    if (i++ > 0) res += ", ";
    res += to_string_repr(item);
  }
  res += "}";
  return res;
}

inline std::string to_string_repr(const ListNode *head) {
  return to_string_repr(linked_list_to_list(head));
}

inline std::string to_string_repr(const TreeNode *root) {
  return to_string_repr(tree_to_list(root));
}

/* Deep equality helpers */
inline bool deep_equals(const ListNode *a, const ListNode *b) {
  return linked_list_to_list(a) == linked_list_to_list(b);
}

inline bool deep_equals(ListNode *a, ListNode *b) {
  return linked_list_to_list(a) == linked_list_to_list(b);
}

inline bool deep_equals(const TreeNode *a, const TreeNode *b) {
  return tree_to_list(a) == tree_to_list(b);
}

inline bool deep_equals(TreeNode *a, TreeNode *b) {
  return tree_to_list(a) == tree_to_list(b);
}

inline bool deep_equals(float a, float b) {
  return std::fabs(a - b) < 1e-5f;
}

inline bool deep_equals(double a, double b) {
  return std::fabs(a - b) < 1e-6;
}

inline bool deep_equals(const char *a, const char *b) {
  if (a == b)
    return true;
  if (!a || !b)
    return false;
  return std::string(a) == std::string(b);
}

inline bool deep_equals(const char *a, const std::string &b) {
  return a != nullptr && std::string(a) == b;
}

inline bool deep_equals(const std::string &a, const char *b) {
  return b != nullptr && a == std::string(b);
}

template <typename T, typename U>
inline bool deep_equals(const T &a, const U &b) {
  return a == b;
}

} // namespace _harness_detail

/* ========================================================================== */
/* 4. Test Assertion API (`Tests`)                                            */
/* ========================================================================== */

struct _TestsRunner {
  static void bool_check(const std::string &msg, bool condition) {
    if (condition) {
      printf("Test passed: %s\n", msg.c_str());
      fflush(stdout);
    } else {
      printf("Test failed: %s\n", msg.c_str());
      fflush(stdout);
      std::exit(1);
    }
  }

  template <typename T, typename U>
  static void equal_check(const std::string &msg, const T &expected,
                          const U &actual) {
    if (_harness_detail::deep_equals(expected, actual)) {
      printf("Test passed: %s\n", msg.c_str());
      fflush(stdout);
    } else {
      printf("Test failed: %s\n", msg.c_str());
      printf("Expected: %s\n", _harness_detail::to_string_repr(expected).c_str());
      printf("Actual:   %s\n", _harness_detail::to_string_repr(actual).c_str());
      fflush(stdout);
      std::exit(1);
    }
  }

  template <typename T>
  static void unordered_equal_check(const std::string &msg,
                                    std::vector<std::vector<T>> expected,
                                    std::vector<std::vector<T>> actual) {
    auto norm_exp = normalize_nested(expected);
    auto norm_act = normalize_nested(actual);
    if (norm_exp == norm_act) {
      printf("Test passed: %s\n", msg.c_str());
      fflush(stdout);
    } else {
      printf("Test failed: %s\n", msg.c_str());
      printf("Expected: %s\n", _harness_detail::to_string_repr(norm_exp).c_str());
      printf("Actual:   %s\n", _harness_detail::to_string_repr(norm_act).c_str());
      fflush(stdout);
      std::exit(1);
    }
  }

  template <typename T>
  static void unordered_equal_check(const std::string &msg,
                                    std::vector<T> expected,
                                    std::vector<T> actual) {
    std::sort(expected.begin(), expected.end());
    std::sort(actual.begin(), actual.end());
    equal_check(msg, expected, actual);
  }
};

static const _TestsRunner Tests;

#endif // _CODEBOOK_HARNESS_HPP_
