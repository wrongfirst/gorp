declare const console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
  debug(...args: any[]): void;
  dir(arg: any): void;
  table(arg: any): void;
};

class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

class Node {
  val: number;
  neighbors: Node[];
  constructor(val = 0, neighbors: Node[] = []) {
    this.val = val;
    this.neighbors = neighbors;
  }
}

class Interval {
  start: number;
  end: number;
  constructor(start = 0, end = 0) {
    this.start = start;
    this.end = end;
  }
}

function listToLinkedList(arr: number[]): ListNode | null {
  if (!arr || arr.length === 0) return null;
  const head = new ListNode(arr[0]);
  let curr = head;
  for (let i = 1; i < arr.length; i++) {
    curr.next = new ListNode(arr[i]);
    curr = curr.next;
  }
  return head;
}

function linkedListToList(head: ListNode | null): number[] {
  const res: number[] = [];
  let curr = head;
  const seen = new Set<ListNode>();
  while (curr !== null) {
    if (seen.has(curr)) break;
    seen.add(curr);
    res.push(curr.val);
    curr = curr.next;
  }
  return res;
}

function makeCycle(arr: number[], pos: number): ListNode | null {
  const head = listToLinkedList(arr);
  if (pos === -1 || !head) return head;
  let tail: ListNode | null = head;
  let target: ListNode | null = null;
  let idx = 0;
  while (tail !== null) {
    if (idx === pos) target = tail;
    if (tail.next === null) break;
    tail = tail.next;
    idx++;
  }
  if (tail && target) {
    tail.next = target;
  }
  return head;
}

function listToTree(arr: (number | null)[]): TreeNode | null {
  if (!arr || arr.length === 0 || arr[0] === null) return null;
  const root = new TreeNode(arr[0]);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (queue.length > 0 && i < arr.length) {
    const node = queue.shift()!;
    if (i < arr.length && arr[i] !== null) {
      node.left = new TreeNode(arr[i]!);
      queue.push(node.left);
    }
    i++;
    if (i < arr.length && arr[i] !== null) {
      node.right = new TreeNode(arr[i]!);
      queue.push(node.right);
    }
    i++;
  }
  return root;
}

function treeToList(root: TreeNode | null): (number | null)[] {
  if (!root) return [];
  const res: (number | null)[] = [];
  const queue: (TreeNode | null)[] = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node) {
      res.push(node.val);
      queue.push(node.left);
      queue.push(node.right);
    } else {
      res.push(null);
    }
  }
  while (res.length > 0 && res[res.length - 1] === null) {
    res.pop();
  }
  return res;
}

function intsToTree(...vals: number[]): TreeNode | null {
  if (vals.length === 0) return null;
  return listToTree(vals);
}

function treeToInts(root: TreeNode | null): number[] {
  return treeToList(root).filter((v): v is number => v !== null);
}

function buildGraph(adj: number[][]): Node | null {
  if (!adj || adj.length === 0) return null;
  const nodes: Node[] = adj.map((_, i) => new Node(i + 1));
  for (let i = 0; i < adj.length; i++) {
    for (const nei of adj[i]) {
      nodes[i].neighbors.push(nodes[nei - 1]);
    }
  }
  return nodes[0];
}

function graphToAdj(node: Node | null): number[][] {
  if (!node) return [];
  const visited = new Map<number, Node>();
  function dfs(n: Node) {
    if (visited.has(n.val)) return;
    visited.set(n.val, n);
    for (const nei of n.neighbors) {
      dfs(nei);
    }
  }
  dfs(node);
  const adj: number[][] = [];
  for (let i = 1; i <= visited.size; i++) {
    if (visited.has(i)) {
      adj.push(visited.get(i)!.neighbors.map(nei => nei.val));
    } else {
      adj.push([]);
    }
  }
  return adj;
}

function normalizeNested(groups: any): any {
  if (!Array.isArray(groups)) return groups;
  const normalized = groups.map(g => normalizeNested(g));
  return normalized.sort((a, b) => {
    const sa = JSON.stringify(a);
    const sb = JSON.stringify(b);
    return sa.localeCompare(sb);
  });
}

function sortStrings(arr: string[]): string[] {
  return [...arr].sort();
}

function sortInts(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}

function deepEquals(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) return false;
    }
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || !deepEquals(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

const Tests = {
  boolCheck(msg: string, b: boolean) {
    if (b) {
      console.log(`Test passed: ${msg}`);
    } else {
      console.log(`Test failed: ${msg}`);
      throw new Error(`Test failed: ${msg}`);
    }
  },

  equalCheck(msg: string, expected: any, actual: any) {
    if (deepEquals(expected, actual)) {
      console.log(`Test passed: ${msg}`);
    } else {
      console.log(`Test failed: ${msg}\nExpected: ${JSON.stringify(expected)}\nActual:   ${JSON.stringify(actual)}`);
      throw new Error(`Test failed: ${msg}`);
    }
  },

  unorderedEqualCheck(msg: string, expected: any, actual: any) {
    const normExp = normalizeNested(expected);
    const normAct = normalizeNested(actual);
    if (deepEquals(normExp, normAct)) {
      console.log(`Test passed: ${msg}`);
    } else {
      console.log(`Test failed: ${msg}\nExpected: ${JSON.stringify(expected)}\nActual:   ${JSON.stringify(actual)}`);
      throw new Error(`Test failed: ${msg}`);
    }
  }
};

