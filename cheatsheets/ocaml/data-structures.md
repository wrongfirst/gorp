---
language: ocaml
badge: ml
aliases: [ocaml, ml]
---

## Immutable List Operations (map, filter, fold)
```ocaml
let list = [1; 2; 3; 4]

let doubled = List.map (fun x -> x * 2) list
let evens = List.filter (fun x -> x mod 2 = 0) list
let sum = List.fold_left ( + ) 0 list (* Always prefer fold_left over non-tail-recursive fold_right *)
```
Transforms singly-linked immutable lists using higher-order functions from the standard library.

## List Utilities & Generation
```ocaml
let range = List.init 5 Fun.id
let indexed = List.mapi (fun idx x -> (idx, x * 10)) [1; 2; 3]
let (evens, odds) = List.partition (fun x -> x mod 2 = 0) [1; 2; 3; 4; 5]
let pairs = List.combine ["a"; "b"] [1; 2]
```
Constructs, partitions, and indexes lists using standard higher-order utility functions.

## Functional Queue (Okasaki Two-List Queue)
```ocaml
type 'a queue = 'a list * 'a list (* (front, back) *)

let empty = ([], [])

let enqueue x (front, back) = (front, x :: back)

let dequeue = function
  | ([], []) -> None
  | (x :: front, back) -> Some (x, (front, back))
  | ([], back) ->
      (match List.rev back with
       | x :: front -> Some (x, (front, []))
       | [] -> None)
```
Maintains an immutable purely functional FIFO queue with amortized $O(1)$ operations via two linked lists.

## Imperative Queue & Stack
```ocaml
let q = Queue.create ()
Queue.add 42 q
let front = Queue.take q

let st = Stack.create ()
Stack.push 10 st
let top = Stack.pop st
```
Standard mutable queue and stack collections optimized for imperative BFS and depth-first traversals.

## Set and Map Functors (IntSet, IntMap)
```ocaml
module IntSet = Set.Make(Int)
module IntMap = Map.Make(Int)

let s = IntSet.(empty |> add 10 |> add 20)
let has_ten = IntSet.mem 10 s

let m = IntMap.(empty |> add 1 "apple" |> add 2 "banana")
let fruit = IntMap.find_opt 1 m
```
Generates purely functional balanced red-black trees with $O(\log N)$ lookups and insertions using OCaml functors.

## Custom Types with Set and Map Functors
```ocaml
module Point = struct
  type t = int * int
  let compare (x1, y1) (x2, y2) =
    match compare x1 x2 with
    | 0 -> compare y1 y2
    | c -> c
end

module PointSet = Set.Make(Point)
let pts = PointSet.(empty |> add (1, 2) |> add (3, 4))
let has_pt = PointSet.mem (1, 2) pts
```
Instantiates associative collections for custom records or tuples by supplying a comparison module matching `OrderedType`.

## Mutable Hash Table (Hashtbl)
```ocaml
let table = Hashtbl.create 16

(* Hashtbl.replace overwrites existing keys; Hashtbl.add stacks bindings: *)
Hashtbl.replace table "apple" 10
Hashtbl.replace table "banana" 20

let val_opt = Hashtbl.find_opt table "apple"
let exists = Hashtbl.mem table "apple"
Hashtbl.remove table "apple"
```
Average $O(1)$ mutable associative hash table supporting lookups, replacements, and presence testing.

## 2D Matrix Allocation
```ocaml
let rows = 4
let cols = 5

let matrix = Array.make_matrix rows cols 0

matrix.(0).(1) <- 42
let val_at = matrix.(0).(1)
```
Allocates a mutable 2D contiguous array safely with specified dimensions and initial values.

## Binary Tree ADT
```ocaml
type 'a tree =
  | Leaf
  | Node of 'a tree * 'a * 'a tree

let rec max_depth = function
  | Leaf -> 0
  | Node (l, _, r) -> 1 + max (max_depth l) (max_depth r)

(* Tail-recursive in-order traversal using an accumulator to avoid quadratic list appends: *)
let inorder tree =
  let rec aux acc = function
    | Leaf -> acc
    | Node (l, v, r) -> aux (v :: aux acc r) l
  in
  aux [] tree
```
Defines algebraic tree structures with linear-time $O(N)$ accumulator traversals and recursive depth calculations.

## Buffer & String Operations
```ocaml
(* Efficient string building (Buffer avoids O(N^2) string concatenation copies): *)
let buf = Buffer.create 16
Buffer.add_string buf "hello"
Buffer.add_char buf ' '
Buffer.add_string buf "world"
let str = Buffer.contents buf

let tokens = String.split_on_char ',' "a,b,c"
let joined = String.concat "-" tokens
let sub = String.sub "abcdef" 1 3 (* (offset, length) *)
```
Constructs strings efficiently using mutable `Buffer` and performs splitting, joining, and slicing via the `String` module.

## Lazy Sequences (Seq)
```ocaml
let naturals = Seq.ints 0

let first_five_evens =
  naturals
  |> Seq.filter (fun x -> x mod 2 = 0)
  |> Seq.take 5
  |> List.of_seq
```
Evaluates sequences on demand to represent potentially infinite series or avoid intermediate collections.

## Trie (Prefix Tree)
```ocaml
type trie = {
  mutable is_end : bool;
  children : (char, trie) Hashtbl.t;
}

let create_node () = { is_end = false; children = Hashtbl.create 4 }

let insert root word =
  let curr = ref root in
  String.iter (fun ch ->
    let next =
      match Hashtbl.find_opt !curr.children ch with
      | Some node -> node
      | None ->
          let node = create_node () in
          Hashtbl.replace !curr.children ch node;
          node
    in
    curr := next
  ) word;
  !curr.is_end <- true

let search root word =
  let curr = ref (Some root) in
  String.iter (fun ch ->
    curr := match !curr with
      | Some node -> Hashtbl.find_opt node.children ch
      | None -> None
  ) word;
  match !curr with Some node -> node.is_end | None -> false
```
Maintains a tree of character prefixes supporting $O(L)$ time string insertion and existence verification for word length $L$.
