(function(){var e=`#ifndef _CODEBOOK_HARNESS_HPP_
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
  return std::string("\\"") + val + "\\"";
}

inline std::string to_string_repr(const std::string &val) {
  return std::string("\\"") + val + "\\"";
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
  std::string res = "[\\n";
  for (size_t i = 0; i < mat.size(); ++i) {
    res += "  [";
    for (size_t j = 0; j < mat[i].size(); ++j) {
      if (j > 0) res += ", ";
      res += to_string_repr(mat[i][j]);
    }
    res += (i + 1 < mat.size()) ? "],\\n" : "]\\n";
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
/* 4. Test Assertion API (\`Tests\`)                                            */
/* ========================================================================== */

struct _TestsRunner {
  static void bool_check(const std::string &msg, bool condition) {
    if (condition) {
      printf("Test passed: %s\\n", msg.c_str());
      fflush(stdout);
    } else {
      printf("Test failed: %s\\n", msg.c_str());
      fflush(stdout);
      std::exit(1);
    }
  }

  template <typename T, typename U>
  static void equal_check(const std::string &msg, const T &expected,
                          const U &actual) {
    if (_harness_detail::deep_equals(expected, actual)) {
      printf("Test passed: %s\\n", msg.c_str());
      fflush(stdout);
    } else {
      printf("Test failed: %s\\n", msg.c_str());
      printf("Expected: %s\\n", _harness_detail::to_string_repr(expected).c_str());
      printf("Actual:   %s\\n", _harness_detail::to_string_repr(actual).c_str());
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
      printf("Test passed: %s\\n", msg.c_str());
      fflush(stdout);
    } else {
      printf("Test failed: %s\\n", msg.c_str());
      printf("Expected: %s\\n", _harness_detail::to_string_repr(norm_exp).c_str());
      printf("Actual:   %s\\n", _harness_detail::to_string_repr(norm_act).c_str());
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
`,t=class e{static read_bytes(t,n){let r=new e;return r.buf=t.getUint32(n,!0),r.buf_len=t.getUint32(n+4,!0),r}static read_bytes_array(t,n,r){let i=[];for(let a=0;a<r;a++)i.push(e.read_bytes(t,n+8*a));return i}},n=class e{static read_bytes(t,n){let r=new e;return r.buf=t.getUint32(n,!0),r.buf_len=t.getUint32(n+4,!0),r}static read_bytes_array(t,n,r){let i=[];for(let a=0;a<r;a++)i.push(e.read_bytes(t,n+8*a));return i}},r=class{write_bytes(e,t){e.setUint8(t,this.fs_filetype),e.setUint16(t+2,this.fs_flags,!0),e.setBigUint64(t+8,this.fs_rights_base,!0),e.setBigUint64(t+16,this.fs_rights_inherited,!0)}constructor(e,t){this.fs_rights_base=0n,this.fs_rights_inherited=0n,this.fs_filetype=e,this.fs_flags=t}},i=class{write_bytes(e,t){e.setBigUint64(t,this.dev,!0),e.setBigUint64(t+8,this.ino,!0),e.setUint8(t+16,this.filetype),e.setBigUint64(t+24,this.nlink,!0),e.setBigUint64(t+32,this.size,!0),e.setBigUint64(t+38,this.atim,!0),e.setBigUint64(t+46,this.mtim,!0),e.setBigUint64(t+52,this.ctim,!0)}constructor(e,t,n){this.dev=0n,this.nlink=0n,this.atim=0n,this.mtim=0n,this.ctim=0n,this.ino=e,this.filetype=t,this.size=n}},a=class e{static read_bytes(t,n){return new e(t.getBigUint64(n,!0),t.getUint8(n+8),t.getUint32(n+16,!0),t.getBigUint64(n+24,!0),t.getUint16(n+36,!0))}constructor(e,t,n,r,i){this.userdata=e,this.eventtype=t,this.clockid=n,this.timeout=r,this.flags=i}},o=class{write_bytes(e,t){e.setBigUint64(t,this.userdata,!0),e.setUint16(t+8,this.error,!0),e.setUint8(t+10,this.eventtype)}constructor(e,t,n){this.userdata=e,this.error=t,this.eventtype=n}};let s=class{enable(e){this.log=c(e===void 0||e,this.prefix)}get enabled(){return this.isEnabled}constructor(e){this.isEnabled=e,this.prefix=`wasi:`,this.enable(e)}};function c(e,t){return e?console.log.bind(console,`%c%s`,`color: #265BA0`,t):()=>{}}let l=new s(!1);var u=class extends Error{constructor(e){super(`exit with exit code `+e),this.code=e}};let d=class{start(e){this.inst=e;try{return e.exports._start(),0}catch(e){if(e instanceof u)return e.code;throw e}}initialize(e){this.inst=e,e.exports._initialize&&e.exports._initialize()}constructor(e,r,i,s={}){this.args=[],this.env=[],this.fds=[],l.enable(s.debug),this.args=e,this.env=r,this.fds=i;let c=this;this.wasiImport={args_sizes_get(e,t){let n=new DataView(c.inst.exports.memory.buffer);n.setUint32(e,c.args.length,!0);let r=0;for(let e of c.args)r+=e.length+1;return n.setUint32(t,r,!0),l.log(n.getUint32(e,!0),n.getUint32(t,!0)),0},args_get(e,t){let n=new DataView(c.inst.exports.memory.buffer),r=new Uint8Array(c.inst.exports.memory.buffer),i=t;for(let i=0;i<c.args.length;i++){n.setUint32(e,t,!0),e+=4;let a=new TextEncoder().encode(c.args[i]);r.set(a,t),n.setUint8(t+a.length,0),t+=a.length+1}return l.enabled&&l.log(new TextDecoder(`utf-8`).decode(r.slice(i,t))),0},environ_sizes_get(e,t){let n=new DataView(c.inst.exports.memory.buffer);n.setUint32(e,c.env.length,!0);let r=0;for(let e of c.env)r+=new TextEncoder().encode(e).length+1;return n.setUint32(t,r,!0),l.log(n.getUint32(e,!0),n.getUint32(t,!0)),0},environ_get(e,t){let n=new DataView(c.inst.exports.memory.buffer),r=new Uint8Array(c.inst.exports.memory.buffer),i=t;for(let i=0;i<c.env.length;i++){n.setUint32(e,t,!0),e+=4;let a=new TextEncoder().encode(c.env[i]);r.set(a,t),n.setUint8(t+a.length,0),t+=a.length+1}return l.enabled&&l.log(new TextDecoder(`utf-8`).decode(r.slice(i,t))),0},clock_res_get(e,t){let n;switch(e){case 1:n=5000n;break;case 0:n=1000000n;break;default:return 52}return new DataView(c.inst.exports.memory.buffer).setBigUint64(t,n,!0),0},clock_time_get(e,t,n){let r=new DataView(c.inst.exports.memory.buffer);if(e===0)r.setBigUint64(n,BigInt(new Date().getTime())*1000000n,!0);else if(e==1){let e;try{e=BigInt(Math.round(performance.now()*1e6))}catch{e=0n}r.setBigUint64(n,e,!0)}else r.setBigUint64(n,0n,!0);return 0},fd_advise(e,t,n,r){return c.fds[e]==null?8:0},fd_allocate(e,t,n){return c.fds[e]==null?8:c.fds[e].fd_allocate(t,n)},fd_close(e){if(c.fds[e]!=null){let t=c.fds[e].fd_close();return c.fds[e]=void 0,t}return 8},fd_datasync(e){return c.fds[e]==null?8:c.fds[e].fd_sync()},fd_fdstat_get(e,t){if(c.fds[e]!=null){let{ret:n,fdstat:r}=c.fds[e].fd_fdstat_get();return r?.write_bytes(new DataView(c.inst.exports.memory.buffer),t),n}return 8},fd_fdstat_set_flags(e,t){return c.fds[e]==null?8:c.fds[e].fd_fdstat_set_flags(t)},fd_fdstat_set_rights(e,t,n){return c.fds[e]==null?8:c.fds[e].fd_fdstat_set_rights(t,n)},fd_filestat_get(e,t){if(c.fds[e]!=null){let{ret:n,filestat:r}=c.fds[e].fd_filestat_get();return r?.write_bytes(new DataView(c.inst.exports.memory.buffer),t),n}return 8},fd_filestat_set_size(e,t){return c.fds[e]==null?8:c.fds[e].fd_filestat_set_size(t)},fd_filestat_set_times(e,t,n,r){return c.fds[e]==null?8:c.fds[e].fd_filestat_set_times(t,n,r)},fd_pread(e,n,r,i,a){let o=new DataView(c.inst.exports.memory.buffer),s=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let l=t.read_bytes_array(o,n,r),u=0;for(let t of l){let{ret:n,data:r}=c.fds[e].fd_pread(t.buf_len,i);if(n!=0)return o.setUint32(a,u,!0),n;if(s.set(r,t.buf),u+=r.length,i+=BigInt(r.length),r.length!=t.buf_len)break}return o.setUint32(a,u,!0),0}return 8},fd_prestat_get(e,t){let n=new DataView(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let{ret:r,prestat:i}=c.fds[e].fd_prestat_get();return i?.write_bytes(n,t),r}return 8},fd_prestat_dir_name(e,t,n){if(c.fds[e]!=null){let{ret:r,prestat:i}=c.fds[e].fd_prestat_get();if(i==null)return r;let a=i.inner.pr_name;return new Uint8Array(c.inst.exports.memory.buffer).set(a.slice(0,n),t),a.byteLength>n?37:0}return 8},fd_pwrite(e,t,r,i,a){let o=new DataView(c.inst.exports.memory.buffer),s=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let l=n.read_bytes_array(o,t,r),u=0;for(let t of l){let n=s.slice(t.buf,t.buf+t.buf_len),{ret:r,nwritten:l}=c.fds[e].fd_pwrite(n,i);if(r!=0)return o.setUint32(a,u,!0),r;if(u+=l,i+=BigInt(l),l!=n.byteLength)break}return o.setUint32(a,u,!0),0}return 8},fd_read(e,n,r,i){let a=new DataView(c.inst.exports.memory.buffer),o=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let s=t.read_bytes_array(a,n,r),l=0;for(let t of s){let{ret:n,data:r}=c.fds[e].fd_read(t.buf_len);if(n!=0)return a.setUint32(i,l,!0),n;if(o.set(r,t.buf),l+=r.length,r.length!=t.buf_len)break}return a.setUint32(i,l,!0),0}return 8},fd_readdir(e,t,n,r,i){let a=new DataView(c.inst.exports.memory.buffer),o=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let s=0;for(;;){let{ret:l,dirent:u}=c.fds[e].fd_readdir_single(r);if(l!=0)return a.setUint32(i,s,!0),l;if(u==null)break;if(n-s<u.head_length()){s=n;break}let d=new ArrayBuffer(u.head_length());if(u.write_head_bytes(new DataView(d),0),o.set(new Uint8Array(d).slice(0,Math.min(d.byteLength,n-s)),t),t+=u.head_length(),s+=u.head_length(),n-s<u.name_length()){s=n;break}u.write_name_bytes(o,t,n-s),t+=u.name_length(),s+=u.name_length(),r=u.d_next}return a.setUint32(i,s,!0),0}return 8},fd_renumber(e,t){if(c.fds[e]!=null&&c.fds[t]!=null){let n=c.fds[t].fd_close();return n==0?(c.fds[t]=c.fds[e],c.fds[e]=void 0,0):n}return 8},fd_seek(e,t,n,r){let i=new DataView(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let{ret:a,offset:o}=c.fds[e].fd_seek(t,n);return i.setBigInt64(r,o,!0),a}return 8},fd_sync(e){return c.fds[e]==null?8:c.fds[e].fd_sync()},fd_tell(e,t){let n=new DataView(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let{ret:r,offset:i}=c.fds[e].fd_tell();return n.setBigUint64(t,i,!0),r}return 8},fd_write(e,t,r,i){let a=new DataView(c.inst.exports.memory.buffer),o=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let s=n.read_bytes_array(a,t,r),l=0;for(let t of s){let n=o.slice(t.buf,t.buf+t.buf_len),{ret:r,nwritten:s}=c.fds[e].fd_write(n);if(r!=0)return a.setUint32(i,l,!0),r;if(l+=s,s!=n.byteLength)break}return a.setUint32(i,l,!0),0}return 8},path_create_directory(e,t,n){let r=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let i=new TextDecoder(`utf-8`).decode(r.slice(t,t+n));return c.fds[e].path_create_directory(i)}return 8},path_filestat_get(e,t,n,r,i){let a=new DataView(c.inst.exports.memory.buffer),o=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let s=new TextDecoder(`utf-8`).decode(o.slice(n,n+r)),{ret:l,filestat:u}=c.fds[e].path_filestat_get(t,s);return u?.write_bytes(a,i),l}return 8},path_filestat_set_times(e,t,n,r,i,a,o){let s=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let l=new TextDecoder(`utf-8`).decode(s.slice(n,n+r));return c.fds[e].path_filestat_set_times(t,l,i,a,o)}return 8},path_link(e,t,n,r,i,a,o){let s=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null&&c.fds[i]!=null){let l=new TextDecoder(`utf-8`).decode(s.slice(n,n+r)),u=new TextDecoder(`utf-8`).decode(s.slice(a,a+o)),{ret:d,inode_obj:f}=c.fds[e].path_lookup(l,t);return f==null?d:c.fds[i].path_link(u,f,!1)}return 8},path_open(e,t,n,r,i,a,o,s,u){let d=new DataView(c.inst.exports.memory.buffer),f=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let p=new TextDecoder(`utf-8`).decode(f.slice(n,n+r));l.log(p);let{ret:m,fd_obj:h}=c.fds[e].path_open(t,p,i,a,o,s);if(m!=0)return m;c.fds.push(h);let g=c.fds.length-1;return d.setUint32(u,g,!0),0}return 8},path_readlink(e,t,n,r,i,a){let o=new DataView(c.inst.exports.memory.buffer),s=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let u=new TextDecoder(`utf-8`).decode(s.slice(t,t+n));l.log(u);let{ret:d,data:f}=c.fds[e].path_readlink(u);if(f!=null){let e=new TextEncoder().encode(f);if(e.length>i)return o.setUint32(a,0,!0),8;s.set(e,r),o.setUint32(a,e.length,!0)}return d}return 8},path_remove_directory(e,t,n){let r=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let i=new TextDecoder(`utf-8`).decode(r.slice(t,t+n));return c.fds[e].path_remove_directory(i)}return 8},path_rename(e,t,n,r,i,a){let o=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null&&c.fds[r]!=null){let s=new TextDecoder(`utf-8`).decode(o.slice(t,t+n)),l=new TextDecoder(`utf-8`).decode(o.slice(i,i+a)),{ret:u,inode_obj:d}=c.fds[e].path_unlink(s);if(d==null)return u;if(u=c.fds[r].path_link(l,d,!0),u!=0&&c.fds[e].path_link(s,d,!0)!=0)throw`path_link should always return success when relinking an inode back to the original place`;return u}return 8},path_symlink(e,t,n,r,i){let a=new Uint8Array(c.inst.exports.memory.buffer);return c.fds[n]==null?8:(new TextDecoder(`utf-8`).decode(a.slice(e,e+t)),new TextDecoder(`utf-8`).decode(a.slice(r,r+i)),58)},path_unlink_file(e,t,n){let r=new Uint8Array(c.inst.exports.memory.buffer);if(c.fds[e]!=null){let i=new TextDecoder(`utf-8`).decode(r.slice(t,t+n));return c.fds[e].path_unlink_file(i)}return 8},poll_oneoff(e,t,n){if(n===0)return 28;if(n>1)return l.log(`poll_oneoff: only a single subscription is supported`),58;let r=new DataView(c.inst.exports.memory.buffer),i=a.read_bytes(r,e),s=i.eventtype,u=i.clockid,d=i.timeout;if(s!==0)return l.log(`poll_oneoff: only clock subscriptions are supported`),58;let f;if(u===1)f=()=>BigInt(Math.round(performance.now()*1e6));else if(u===0)f=()=>BigInt(new Date().getTime())*1000000n;else return 28;let p=i.flags&1?d:f()+d;for(;p>f(););return new o(i.userdata,0,s).write_bytes(r,t),0},proc_exit(e){throw new u(e)},proc_raise(e){throw`raised signal `+e},sched_yield(){},random_get(e,t){let n=new Uint8Array(c.inst.exports.memory.buffer).subarray(e,e+t);if(`crypto`in globalThis&&(typeof SharedArrayBuffer>`u`||!(c.inst.exports.memory.buffer instanceof SharedArrayBuffer)))for(let e=0;e<t;e+=65536)crypto.getRandomValues(n.subarray(e,e+65536));else for(let e=0;e<t;e++)n[e]=Math.random()*256|0},sock_recv(e,t,n){throw`sockets not supported`},sock_send(e,t,n){throw`sockets not supported`},sock_shutdown(e,t){throw`sockets not supported`},sock_accept(e,t){throw`sockets not supported`}}}};var f=class{fd_allocate(e,t){return 58}fd_close(){return 0}fd_fdstat_get(){return{ret:58,fdstat:null}}fd_fdstat_set_flags(e){return 58}fd_fdstat_set_rights(e,t){return 58}fd_filestat_get(){return{ret:58,filestat:null}}fd_filestat_set_size(e){return 58}fd_filestat_set_times(e,t,n){return 58}fd_pread(e,t){return{ret:58,data:new Uint8Array}}fd_prestat_get(){return{ret:58,prestat:null}}fd_pwrite(e,t){return{ret:58,nwritten:0}}fd_read(e){return{ret:58,data:new Uint8Array}}fd_readdir_single(e){return{ret:58,dirent:null}}fd_seek(e,t){return{ret:58,offset:0n}}fd_sync(){return 0}fd_tell(){return{ret:58,offset:0n}}fd_write(e){return{ret:58,nwritten:0}}path_create_directory(e){return 58}path_filestat_get(e,t){return{ret:58,filestat:null}}path_filestat_set_times(e,t,n,r,i){return 58}path_link(e,t,n){return 58}path_unlink(e){return{ret:58,inode_obj:null}}path_lookup(e,t){return{ret:58,inode_obj:null}}path_open(e,t,n,r,i,a){return{ret:54,fd_obj:null}}path_readlink(e){return{ret:58,data:null}}path_remove_directory(e){return 58}path_rename(e,t,n){return 58}path_unlink_file(e){return 58}},p=class e{static issue_ino(){return e.next_ino++}static root_ino(){return 0n}constructor(){this.ino=e.issue_ino()}};p.next_ino=1n;var m=class extends f{fd_allocate(e,t){if(!(this.file.size>e+t)){let n=new Uint8Array(Number(e+t));n.set(this.file.data,0),this.file.data=n}return 0}fd_fdstat_get(){return{ret:0,fdstat:new r(4,0)}}fd_filestat_set_size(e){if(this.file.size>e)this.file.data=new Uint8Array(this.file.data.buffer.slice(0,Number(e)));else{let t=new Uint8Array(Number(e));t.set(this.file.data,0),this.file.data=t}return 0}fd_read(e){let t=this.file.data.slice(Number(this.file_pos),Number(this.file_pos+BigInt(e)));return this.file_pos+=BigInt(t.length),{ret:0,data:t}}fd_pread(e,t){return{ret:0,data:this.file.data.slice(Number(t),Number(t+BigInt(e)))}}fd_seek(e,t){let n;switch(t){case 0:n=e;break;case 1:n=this.file_pos+e;break;case 2:n=BigInt(this.file.data.byteLength)+e;break;default:return{ret:28,offset:0n}}return n<0?{ret:28,offset:0n}:(this.file_pos=n,{ret:0,offset:this.file_pos})}fd_tell(){return{ret:0,offset:this.file_pos}}fd_write(e){if(this.file.readonly)return{ret:8,nwritten:0};if(this.file_pos+BigInt(e.byteLength)>this.file.size){let t=this.file.data;this.file.data=new Uint8Array(Number(this.file_pos+BigInt(e.byteLength))),this.file.data.set(t)}return this.file.data.set(e,Number(this.file_pos)),this.file_pos+=BigInt(e.byteLength),{ret:0,nwritten:e.byteLength}}fd_pwrite(e,t){if(this.file.readonly)return{ret:8,nwritten:0};if(t+BigInt(e.byteLength)>this.file.size){let n=this.file.data;this.file.data=new Uint8Array(Number(t+BigInt(e.byteLength))),this.file.data.set(n)}return this.file.data.set(e,Number(t)),{ret:0,nwritten:e.byteLength}}fd_filestat_get(){return{ret:0,filestat:this.file.stat()}}constructor(e){super(),this.file_pos=0n,this.file=e}},h=class extends p{path_open(e,t,n){if(this.readonly&&(t&BigInt(64))==BigInt(64))return{ret:63,fd_obj:null};if((e&8)==8){if(this.readonly)return{ret:63,fd_obj:null};this.data=new Uint8Array([])}let r=new m(this);return n&1&&r.fd_seek(0n,2),{ret:0,fd_obj:r}}get size(){return BigInt(this.data.byteLength)}stat(){return new i(this.ino,4,this.size)}constructor(e,t){super(),this.data=new Uint8Array(e),this.readonly=!!t?.readonly}},g=class e extends f{fd_filestat_get(){return{ret:0,filestat:new i(this.ino,2,BigInt(0))}}fd_fdstat_get(){let e=new r(2,0);return e.fs_rights_base=BigInt(64),{ret:0,fdstat:e}}fd_write(e){return this.write(e),{ret:0,nwritten:e.byteLength}}static lineBuffered(t){let n=new TextDecoder(`utf-8`,{fatal:!1}),r=``;return new e(e=>{r+=n.decode(e,{stream:!0});let i=r.split(`
`);for(let[e,n]of i.entries())e<i.length-1?t(n):r=n})}constructor(e){super(),this.ino=p.issue_ino(),this.write=e}};function _(e){function t(e){self.postMessage(e)}let n=[],r=!1,i=new Set,a=null,o=!1,s=null,c=(async()=>{try{e.init&&await e.init(),o=!0,t({type:`READY`})}catch(e){console.error(`[Worker Init Error]:`,e),s=e instanceof Error?e:Error(String(e)),t({type:`INIT_ERROR`,error:e?.message||String(e)})}})();async function l(n){let{id:r,userCode:a,testCode:o=``}=n;if(i.has(r)){i.delete(r),t({type:`RESULT`,id:r,success:!1,output:``,error:`Execution cancelled.`});return}let s={id:r,userCode:a,testCode:o,isCancelled:()=>i.has(r)};try{let n=await e.execute(a,o,s);t({type:`RESULT`,id:r,success:n.success,output:n.output,error:n.error})}catch(e){t({type:`RESULT`,id:r,success:!1,output:``,error:e?.message||String(e)})}finally{i.delete(r)}}async function u(n){let{id:r,code:o}=n;if(a&&a!==r){t({type:`LINT_RESULT`,id:r,diagnostics:[]});return}if(i.has(r)){i.delete(r),t({type:`LINT_RESULT`,id:r,diagnostics:[]});return}let s={id:r,code:o,isCancelled:()=>i.has(r)||a!==null&&a!==r};try{let n=e.lint?await e.lint(o,s):[];t({type:`LINT_RESULT`,id:r,diagnostics:Array.isArray(n)?n:[]})}catch(e){console.error(`[Worker Lint Error]:`,e),t({type:`LINT_RESULT`,id:r,diagnostics:[]})}finally{i.delete(r)}}async function d(n){try{e.reset&&await e.reset(),t({type:`RESET_DONE`,id:n.id})}catch(e){console.error(`[Worker Reset Error]:`,e),t({type:`RESET_DONE`,id:n.id})}}async function f(){if(!r){r=!0;try{if(!o&&!s&&await c,s){for(;n.length>0;){let e=n.shift();e.type===`RUN`?t({type:`RESULT`,id:e.id,success:!1,output:``,error:s.message||`Worker initialization failed.`}):e.type===`LINT`?t({type:`LINT_RESULT`,id:e.id,diagnostics:[]}):e.type===`RESET`&&t({type:`RESET_DONE`,id:e.id})}return}for(;n.length>0;){let e=n.shift();e.type===`RUN`?await l(e):e.type===`LINT`?await u(e):e.type===`RESET`&&await d(e)}}finally{r=!1}}}self.onmessage=e=>{let t=e.data;if(!(!t||!t.type)){if(t.type===`CANCEL`){i.add(t.id);return}t.type===`LINT`&&(a=t.id),n.push(t),f()}}}let v=null,y=!1,b=null,x=null;async function S(){if(!(y&&v))return b||(b=(async()=>{try{let t=await import(`https://cdn.jsdelivr.net/npm/@yowasp/clang@22.0.0-git20542-10/gen/bundle.js`);if(v=t.runClang||t.commands?.clang||t.default?.runClang,!v)throw Error(`Failed to find runClang in the loaded module`);try{let t=(await v([`clang++`,`-x`,`c++-header`,`-std=c++20`,`-fno-exceptions`,`-Xclang`,`-fno-pch-timestamp`,`harness.hpp`,`-o`,`harness.pch`],{"harness.hpp":e},{stdout:()=>{},stderr:()=>{}}))?.[`harness.pch`];t&&t instanceof Uint8Array&&(x=t)}catch(e){console.warn(`[C++ Worker] PCH precompilation skipped, using direct include fallback:`,e),x=null}x||await v([`clang++`,`--version`],{},{stdout:()=>{},stderr:()=>{}}),y=!0}catch(e){throw console.error(`[C++ Worker] Clang++ warmup failed:`,e),b=null,e}})(),b)}function C(e,t=``,n=!0){let r=/\b(?:int\s+)?main\s*\(/,i=r.test(t),a=r.test(e),o=``;return n&&(o+=`#ifndef _CODEBOOK_HARNESS_HPP_
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
  return std::string("\\"") + val + "\\"";
}

inline std::string to_string_repr(const std::string &val) {
  return std::string("\\"") + val + "\\"";
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
  std::string res = "[\\n";
  for (size_t i = 0; i < mat.size(); ++i) {
    res += "  [";
    for (size_t j = 0; j < mat[i].size(); ++j) {
      if (j > 0) res += ", ";
      res += to_string_repr(mat[i][j]);
    }
    res += (i + 1 < mat.size()) ? "],\\n" : "]\\n";
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
/* 4. Test Assertion API (\`Tests\`)                                            */
/* ========================================================================== */

struct _TestsRunner {
  static void bool_check(const std::string &msg, bool condition) {
    if (condition) {
      printf("Test passed: %s\\n", msg.c_str());
      fflush(stdout);
    } else {
      printf("Test failed: %s\\n", msg.c_str());
      fflush(stdout);
      std::exit(1);
    }
  }

  template <typename T, typename U>
  static void equal_check(const std::string &msg, const T &expected,
                          const U &actual) {
    if (_harness_detail::deep_equals(expected, actual)) {
      printf("Test passed: %s\\n", msg.c_str());
      fflush(stdout);
    } else {
      printf("Test failed: %s\\n", msg.c_str());
      printf("Expected: %s\\n", _harness_detail::to_string_repr(expected).c_str());
      printf("Actual:   %s\\n", _harness_detail::to_string_repr(actual).c_str());
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
      printf("Test passed: %s\\n", msg.c_str());
      fflush(stdout);
    } else {
      printf("Test failed: %s\\n", msg.c_str());
      printf("Expected: %s\\n", _harness_detail::to_string_repr(norm_exp).c_str());
      printf("Actual:   %s\\n", _harness_detail::to_string_repr(norm_act).c_str());
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


`),i&&a?(o+=`#define main __user_unused_main
`,o+=`#line 1 "user.cpp"
`+e+`

`,o+=`#undef main
`):o+=`#line 1 "user.cpp"
`+e+`

`,t.trim()&&(o+=`#line 1 "test.cpp"
`+t+`
`),!i&&!a&&(o+=`
int main(int argc, char** argv) {
    return 0;
}
`),o}function w(e){if(!e||!e.trim())return[];let t=[],n=/(?:(?:\.\/)?user\.cpp):(\d+):(\d+):\s*(fatal error|error|warning|note):\s*(.*)/g,r,i=null;for(;(r=n.exec(e))!==null;){let e=parseInt(r[1],10)||1,n=parseInt(r[2],10)||1,a=r[3],o=r[4].trim();if(a===`note`){i&&Math.abs((i.line||1)-e)<=1&&(i.message+=` (note: ${o})`);continue}let s={line:e,column:n,endLine:e,endColumn:n+1,message:o,severity:a===`error`||a===`fatal error`?`error`:`warning`,source:`clang++`};t.push(s),i=s}return t}function T(e){if(!e)return``;let t=e.split(`
`),n=[];for(let e of t)if(e.includes(`test.cpp:`)){let t=e.replace(/test\.cpp:\d+:\d+:\s*(fatal error|error|warning):\s*/,``);n.push(`[Function Signature Mismatch] Test harness compilation error:\n  -> ${t}`)}else n.push(e);return n.join(`
`)}_({async init(){await S()},async execute(t,n=``){await S();let r=!!x,i=C(t,n,!r),a=``,o=new TextDecoder(`utf-8`),s=[`clang++`,`-std=c++20`,`-fno-exceptions`,`-O0`,`-Wall`,`-Wno-unused-variable`,`-Wno-unused-function`],c={"main.cpp":i};r&&x&&(s.push(`-include-pch`,`harness.pch`),c[`harness.pch`]=x,c[`harness.hpp`]=e),s.push(`main.cpp`,`-o`,`main.wasm`);let l;try{l=await v(s,c,{stdout:()=>{},stderr:e=>{e&&(a+=o.decode(e,{stream:!0}))}})}catch(e){return{success:!1,output:``,error:T(a)||e?.message||String(e)}}let f=l?.[`main.wasm`];if(!f||typeof f==`string`||!(f instanceof Uint8Array))return{success:!1,output:``,error:T(a)||`Compilation failed: no WebAssembly binary was generated.`};let p=``,_=``,y=new g(e=>{p+=o.decode(e,{stream:!0})}),b=new g(e=>{_+=o.decode(e,{stream:!0})}),w=new m(new h(new Uint8Array)),E=new d([`main.wasm`],[],[w,y,b]);try{let e=await WebAssembly.instantiate(f,{wasi_snapshot_preview1:E.wasiImport}),t=e.instance||e,n=0;try{E.start(t)}catch(e){if(e instanceof u)n=e.code;else throw e}p+=o.decode(),_+=o.decode();let r=n===0;return{success:r,output:p,error:r?_||void 0:_||`Process exited with code ${n}`}}catch(e){return{success:!1,output:p,error:e?.message||String(e)}}},async lint(t){if(!t.trim())return[];try{await S();let n=!!x,r=C(t,``,!n),i=``,a=new TextDecoder(`utf-8`),o=[`clang++`,`-std=c++20`,`-fno-exceptions`,`-fsyntax-only`,`-Wall`],s={"main.cpp":r};n&&x&&(o.push(`-include-pch`,`harness.pch`),s[`harness.pch`]=x,s[`harness.hpp`]=e),o.push(`main.cpp`);try{await v(o,s,{stdout:()=>{},stderr:e=>{e&&(i+=a.decode(e,{stream:!0}))}})}catch{}return w(i)}catch(e){return console.warn(`[C++ Worker Lint Error]:`,e),[]}},async reset(){y=!1,b=null,x=null,await S()}})})();