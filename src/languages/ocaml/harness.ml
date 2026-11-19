type list_node = {
  mutable val_ : int;
  mutable next : list_node option;
}

let create_list_node v = { val_ = v; next = None }

let list_to_linked_list (arr : int list) : list_node option =
  match arr with
  | [] -> None
  | hd :: tl ->
      let head = { val_ = hd; next = None } in
      let curr = ref head in
      List.iter (fun x ->
        let n = { val_ = x; next = None } in
        !curr.next <- Some n;
        curr := n
      ) tl;
      Some head

let linked_list_to_list (head : list_node option) : int list =
  let res = ref [] in
  let curr = ref head in
  let count = ref 0 in
  while !curr <> None && !count < 10000 do
    match !curr with
    | None -> ()
    | Some node ->
        res := node.val_ :: !res;
        curr := node.next;
        incr count
  done;
  List.rev !res

let make_cycle (arr : int list) (pos : int) : list_node option =
  let head = list_to_linked_list arr in
  if pos = -1 then head
  else
    match head with
    | None -> None
    | Some h ->
        let target = ref None in
        let tail = ref h in
        let rec loop node i =
          if i = pos then target := Some node;
          match node.next with
          | None -> tail := node
          | Some next_node -> loop next_node (i + 1)
        in
        loop h 0;
        !tail.next <- !target;
        Some h

type tree_node = {
  mutable val_ : int;
  mutable left : tree_node option;
  mutable right : tree_node option;
}

let create_tree_node v = { val_ = v; left = None; right = None }

let list_to_tree (arr : int option list) : tree_node option =
  match arr with
  | [] | None :: _ -> None
  | Some root_val :: rest ->
      let root = { val_ = root_val; left = None; right = None } in
      let q = Queue.create () in
      Queue.push root q;
      let items = ref rest in
      while not (Queue.is_empty q) && !items <> [] do
        let node = Queue.pop q in
        (match !items with
        | [] -> ()
        | l_val :: tl ->
            items := tl;
            (match l_val with
            | None -> ()
            | Some v ->
                let left_node = { val_ = v; left = None; right = None } in
                node.left <- Some left_node;
                Queue.push left_node q));
        (match !items with
        | [] -> ()
        | r_val :: tl ->
            items := tl;
            (match r_val with
            | None -> ()
            | Some v ->
                let right_node = { val_ = v; left = None; right = None } in
                node.right <- Some right_node;
                Queue.push right_node q))
      done;
      Some root

let tree_to_list (root : tree_node option) : int option list =
  match root with
  | None -> []
  | Some r ->
      let q = Queue.create () in
      Queue.push (Some r) q;
      let res = ref [] in
      while not (Queue.is_empty q) do
        let item = Queue.pop q in
        match item with
        | None -> res := None :: !res
        | Some node ->
            res := Some node.val_ :: !res;
            Queue.push node.left q;
            Queue.push node.right q
      done;
      let l = List.rev !res in
      let rec trim_trailing_nones acc = function
        | None :: rest -> trim_trailing_nones acc rest
        | l -> List.rev l
      in
      trim_trailing_nones [] (List.rev l)

let ints_to_tree (arr : int list) : tree_node option =
  list_to_tree (List.map (fun v -> Some v) arr)

let tree_to_ints (root : tree_node option) : int list =
  let raw = tree_to_list root in
  let rec extract = function
    | [] -> []
    | Some v :: rest -> v :: extract rest
    | None :: rest -> extract rest
  in
  extract raw

type graph_node = {
  mutable val_ : int;
  mutable neighbors : graph_node list;
}

let create_graph_node v = { val_ = v; neighbors = [] }

let build_graph (adj : int list list) : graph_node option =
  match adj with
  | [] -> None
  | _ ->
      let n = List.length adj in
      let nodes = Array.init n (fun i -> { val_ = i + 1; neighbors = [] }) in
      let adj_arr = Array.of_list adj in
      Array.iteri (fun i neighbors ->
        nodes.(i).neighbors <- List.map (fun nei -> nodes.(nei - 1)) neighbors
      ) adj_arr;
      Some nodes.(0)

let graph_to_adj (node : graph_node option) : int list list =
  match node with
  | None -> []
  | Some root ->
      let visited = Hashtbl.create 16 in
      let rec dfs n =
        if not (Hashtbl.mem visited n.val_) then begin
          Hashtbl.add visited n.val_ n;
          List.iter dfs n.neighbors
        end
      in
      dfs root;
      let n = Hashtbl.length visited in
      let res = ref [] in
      for i = 1 to n do
        if Hashtbl.mem visited i then
          let gn = Hashtbl.find visited i in
          res := (List.map (fun (nei : graph_node) -> nei.val_) gn.neighbors) :: !res
        else
          res := [] :: !res
      done;
      List.rev !res

type interval = {
  start : int;
  end_ : int;
}

let normalize_nested (groups : 'a list list) : 'a list list =
  List.sort compare (List.map (List.sort compare) groups)

let sort_strings (words : string list) : string list =
  List.sort String.compare words

let sort_ints (arr : int list) : int list =
  List.sort compare arr

module Tests = struct
  let bool_check msg b =
    if b then
      Printf.printf "Test passed: %s\n" msg
    else begin
      Printf.printf "Test failed: %s\n" msg;
      failwith "Test failed"
    end

  let string_check to_str msg expected actual =
    if expected = actual then
      Printf.printf "Test passed: %s\n" msg
    else begin
      Printf.printf "Test failed: %s\nExpected: %s\nActual:   %s\n" msg (to_str expected) (to_str actual);
      failwith "Test failed"
    end

  let equal_check msg expected actual =
    if expected = actual then
      Printf.printf "Test passed: %s\n" msg
    else begin
      Printf.printf "Test failed: %s\n" msg;
      failwith "Test failed"
    end

  let unordered_equal_check msg expected actual =
    let norm_exp = normalize_nested expected in
    let norm_act = normalize_nested actual in
    equal_check msg norm_exp norm_act
end

