---
language: ocaml
badge: ml
aliases: [ocaml, ml]
---

## Binary Search on Sorted Array [left, right)
```ocaml
let binary_search arr target =
  let rec loop left right =
    if left >= right then left
    else
      let mid = left + (right - left) / 2 in
      if arr.(mid) >= target then
        loop left mid
      else
        loop (mid + 1) right
  in
  loop 0 (Array.length arr)
```
Performs tail-call optimized binary search over array ranges without call-stack exhaustion or integer overflow.

## Two Pointers on Array
```ocaml
let two_sum sorted_arr target =
  let rec loop left right =
    if left >= right then None
    else
      let sum = sorted_arr.(left) + sorted_arr.(right) in
      if sum = target then Some (left, right)
      else if sum < target then loop (left + 1) right
      else loop left (right - 1)
  in
  loop 0 (Array.length sorted_arr - 1)
```
Traverses sequential structures with two coordinating indices in $O(N)$ time and $O(1)$ auxiliary space.

## Sliding Window (Variable-Size Subarray)
```ocaml
let min_sub_array_len target nums =
  let n = Array.length nums in
  let min_len = ref (n + 1) in
  let left = ref 0 in
  let sum = ref 0 in
  for right = 0 to n - 1 do
    sum := !sum + nums.(right);
    while !sum >= target do
      min_len := min !min_len (right - !left + 1);
      sum := !sum - nums.(!left);
      incr left
    done
  done;
  if !min_len > n then 0 else !min_len
```
Maintains a dynamic subarray window with two pointers to find optimal contiguous ranges in $O(N)$ time.

## Monotonic Stack (Next Greater Element)
```ocaml
let next_greater_elements arr =
  let n = Array.length arr in
  let res = Array.make n (-1) in
  let st = Stack.create () in
  for i = 0 to n - 1 do
    while not (Stack.is_empty st) && arr.(Stack.top st) < arr.(i) do
      let prev_idx = Stack.pop st in
      res.(prev_idx) <- arr.(i)
    done;
    Stack.push i st
  done;
  res
```
Maintains indices in a monotonic stack to resolve the next greater element for each item in $O(N)$ total time.

## Graph BFS & Shortest Path
```ocaml
let bfs adj_tbl start_node target =
  let visited = Hashtbl.create 16 in
  Hashtbl.replace visited start_node true;

  let q = Queue.create () in
  Queue.add (start_node, 0) q;

  let rec loop () =
    if Queue.is_empty q then None
    else
      let (u, dist) = Queue.take q in
      if u = target then Some dist
      else begin
        List.iter (fun v ->
          if not (Hashtbl.mem visited v) then begin
            Hashtbl.replace visited v true;
            Queue.add (v, dist + 1) q
          end
        ) (Hashtbl.find_opt adj_tbl u |> Option.value ~default:[]);
        loop ()
      end
  in
  loop ()
```
Traverses unweighted graphs level-by-level using `Hashtbl.replace` and a FIFO queue to calculate shortest hop distances in $O(V + E)$ time.

## Graph DFS & Backtracking (Subsets)
```ocaml
let subsets list =
  let rec backtrack acc curr = function
    | [] -> curr :: acc
    | x :: xs ->
        let acc_without = backtrack acc curr xs in
        backtrack acc_without (x :: curr) xs
  in
  backtrack [] [] (List.rev list)
```
Generates all $2^N$ combinatorial subsets recursively using immutable accumulator consing without mutable state rollback.

## Disjoint Set Union (DSU / Union-Find)
```ocaml
type dsu = {
  parent : int array;
  rank : int array;
}

let create_dsu n =
  { parent = Array.init n Fun.id; rank = Array.make n 0 }

let rec find dsu i =
  if dsu.parent.(i) = i then i
  else begin
    dsu.parent.(i) <- find dsu dsu.parent.(i); (* Path compression *)
    dsu.parent.(i)
  end

let union dsu i j =
  let root_i = find dsu i in
  let root_j = find dsu j in
  if root_i <> root_j then
    if dsu.rank.(root_i) < dsu.rank.(root_j) then
      dsu.parent.(root_i) <- root_j
    else if dsu.rank.(root_i) > dsu.rank.(root_j) then
      dsu.parent.(root_j) <- root_i
    else begin
      dsu.parent.(root_j) <- root_i;
      dsu.rank.(root_i) <- dsu.rank.(root_i) + 1
    end
```
Tracks disjoint sets with near $O(1)$ amortized time per operation via path compression and union by rank.

## Dijkstra's Shortest Path
```ocaml
module NodeDist = struct
  type t = int * int (* (dist, node) *)
  let compare (d1, u1) (d2, u2) =
    match compare d1 d2 with
    | 0 -> compare u1 u2
    | c -> c
end
module PQ = Set.Make(NodeDist)

let dijkstra n adj start =
  let dist = Array.make n max_int in
  dist.(start) <- 0;
  let pq = ref (PQ.singleton (0, start)) in
  while not (PQ.is_empty !pq) do
    let (d, u) = PQ.min_elt !pq in
    pq := PQ.remove (d, u) !pq;
    if d = dist.(u) then
      List.iter (fun (v, weight) ->
        if dist.(u) + weight < dist.(v) then begin
          dist.(v) <- dist.(u) + weight;
          pq := PQ.add (dist.(v), v) !pq
        end
      ) adj.(u)
  done;
  dist
```
Finds single-source shortest paths on non-negative weighted graphs in $O(E \log V)$ time using a functional balanced search tree as a priority queue.

## 2D Grid Directions & Boundary Traversal
```ocaml
let rows = 5 in
let cols = 10 in
let visited = Array.make_matrix rows cols false in
let dirs = [(0, 1); (1, 0); (0, -1); (-1, 0)] in (* Right, Down, Left, Up *)

let in_bounds r c =
  r >= 0 && r < rows && c >= 0 && c < cols in

List.iter (fun (dr, dc) ->
  let nr = r + dr in
  let nc = c + dc in
  if in_bounds nr nc && not visited.(nr).(nc) then
    visited.(nr).(nc) <- true
) dirs
```
Navigates orthogonal 2D matrix coordinates cleanly with delta direction tuples and boundary validation.

## Dynamic Programming Memoization (Hashtbl)
```ocaml
let fib_memo n =
  let memo = Hashtbl.create 16 in
  let rec dp i =
    if i <= 1 then i
    else
      match Hashtbl.find_opt memo i with
      | Some res -> res
      | None ->
          let res = dp (i - 1) + dp (i - 2) in
          Hashtbl.replace memo i res;
          res
  in
  dp n
```
Caches recursive dynamic programming state transitions using a hash table to eliminate redundant subproblem calls.

## Tail-Recursive Reversal & Accumulator Idiom
```ocaml
(* Prepending (x :: acc) inside tail-recursive helper prevents call-stack overflow: *)
let reverse list =
  let rec aux acc = function
    | [] -> acc
    | x :: xs -> aux (x :: acc) xs
  in
  aux [] list
```
Avoids call-stack overflow on large datasets by using an accumulator and avoiding non-tail-recursive list append (`@`).
