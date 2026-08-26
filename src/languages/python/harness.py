from typing import Optional, Any
import collections
from collections import defaultdict, deque, Counter
import heapq
import math

class ListNode:
    def __init__(self, val: int = 0, next: Optional['ListNode'] = None):
        self.val = val
        self.next = next

    def __repr__(self):
        return f"ListNode({self.val})"

class TreeNode:
    def __init__(self, val: int = 0, left: Optional['TreeNode'] = None, right: Optional['TreeNode'] = None):
        self.val = val
        self.left = left
        self.right = right

    def __repr__(self):
        return f"TreeNode({self.val})"

class Node:
    def __init__(
        self,
        val: int = 0,
        neighbors: Optional[list['Node']] = None,
        next: Optional['Node'] = None,
        random: Optional['Node'] = None,
        prev: Optional['Node'] = None,
    ):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []
        self.next = next
        self.random = random
        self.prev = prev

    def __repr__(self):
        return f"Node({self.val})"

class Interval:
    def __init__(self, start: int = 0, end: int = 0):
        self.start = start
        self.end = end

    def __repr__(self):
        return f"Interval({self.start}, {self.end})"


def list_to_linked_list(arr: list[int]) -> Optional[ListNode]:
    if not arr:
        return None
    head = ListNode(arr[0])
    curr = head
    for v in arr[1:]:
        curr.next = ListNode(v)
        curr = curr.next
    return head

def linked_list_to_list(head: Optional[ListNode]) -> list[int]:
    res = []
    curr = head
    seen = set()
    while curr:
        if id(curr) in seen:
            break
        seen.add(id(curr))
        res.append(curr.val)
        curr = curr.next
    return res

def list_to_tree(arr: list[Optional[int]]) -> Optional[TreeNode]:
    if not arr or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    queue = collections.deque([root])
    i = 1
    while queue and i < len(arr):
        node = queue.popleft()
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            queue.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            queue.append(node.right)
        i += 1
    return root

def tree_to_list(root: Optional[TreeNode]) -> list[Optional[int]]:
    if not root:
        return []
    res: list[Optional[int]] = []
    queue = collections.deque([root])
    while queue:
        node = queue.popleft()
        if node:
            res.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            res.append(None)
    while res and res[-1] is None:
        res.pop()
    return res

def make_cycle(arr: list[int], pos: int) -> Optional[ListNode]:
    head = list_to_linked_list(arr)
    if pos == -1 or not head:
        return head
    tail = head
    target = None
    idx = 0
    while tail:
        if idx == pos:
            target = tail
        if not tail.next:
            break
        tail = tail.next
        idx += 1
    if tail and target:
        tail.next = target
    return head

def ints_to_tree(*vals: int) -> Optional[TreeNode]:
    if not vals:
        return None
    return list_to_tree(list(vals))

def tree_to_ints(root: Optional[TreeNode]) -> list[int]:
    raw = tree_to_list(root)
    return [v for v in raw if v is not None]

def build_graph(adj: list[list[int]]) -> Optional[Node]:
    if not adj:
        return None
    nodes = [Node(i + 1) for i in range(len(adj))]
    for i, neighbors in enumerate(adj):
        for nei in neighbors:
            nodes[i].neighbors.append(nodes[nei - 1])
    return nodes[0]

def graph_to_adj(node: Optional[Node]) -> list[list[int]]:
    if not node:
        return []
    visited: dict[int, Node] = {}
    def dfs(n: Node):
        if n.val in visited:
            return
        visited[n.val] = n
        for nei in (n.neighbors or []):
            dfs(nei)
    dfs(node)
    adj: list[list[int]] = []
    for i in range(1, len(visited) + 1):
        if i in visited:
            adj.append([nei.val for nei in (visited[i].neighbors or [])])
        else:
            adj.append([])
    return adj

def normalize_nested(groups: Any) -> Any:
    if not isinstance(groups, list):
        return groups
    normalized = [normalize_nested(g) for g in groups]
    try:
        return sorted(normalized)
    except TypeError:
        return sorted(normalized, key=lambda x: repr(x))

def sort_strings(arr: list[str]) -> list[str]:
    return sorted(arr)

def sort_ints(arr: list[int]) -> list[int]:
    return sorted(arr)

class Tests:
    @staticmethod
    def bool_check(msg: str, b: bool):
        if b:
            print(f"Test passed: {msg}")
        else:
            print(f"Test failed: {msg}")
            raise Exception(f"Test failed: {msg}")

    @staticmethod
    def equal_check(msg: str, expected, actual):
        if expected == actual:
            print(f"Test passed: {msg}")
        else:
            print(f"Test failed: {msg}\nExpected: {repr(expected)}\nActual:   {repr(actual)}")
            raise Exception(f"Test failed: {msg}")

    @staticmethod
    def unordered_equal_check(msg: str, expected, actual):
        norm_exp = normalize_nested(expected)
        norm_act = normalize_nested(actual)
        if norm_exp == norm_act:
            print(f"Test passed: {msg}")
        else:
            print(f"Test failed: {msg}\nExpected: {repr(expected)}\nActual:   {repr(actual)}")
            raise Exception(f"Test failed: {msg}")


