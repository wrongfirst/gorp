(function(){var e=`type list_node = {
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
        let idx = ref 0 in
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
      Printf.printf "Test passed: %s\\n" msg
    else begin
      Printf.printf "Test failed: %s\\n" msg;
      failwith "Test failed"
    end

  let string_check to_str msg expected actual =
    if expected = actual then
      Printf.printf "Test passed: %s\\n" msg
    else begin
      Printf.printf "Test failed: %s\\nExpected: %s\\nActual:   %s\\n" msg (to_str expected) (to_str actual);
      failwith "Test failed"
    end

  let equal_check msg expected actual =
    if expected = actual then
      Printf.printf "Test passed: %s\\n" msg
    else begin
      Printf.printf "Test failed: %s\\n" msg;
      failwith "Test failed"
    end

  let unordered_equal_check msg expected actual =
    let norm_exp = normalize_nested expected in
    let norm_act = normalize_nested actual in
    equal_check msg norm_exp norm_act
end

`,t=``+new URL(`toplevel.bc-Def5EU6H.js`,self.location.href).href;function n(e){function t(e){self.postMessage(e)}let n=[],r=!1,i=new Set,a=null,o=!1,s=null,c=(async()=>{try{e.init&&await e.init(),o=!0,t({type:`READY`})}catch(e){console.error(`[Worker Init Error]:`,e),s=e instanceof Error?e:Error(String(e)),t({type:`INIT_ERROR`,error:e?.message||String(e)})}})();async function l(n){let{id:r,userCode:a,testCode:o=``}=n;if(i.has(r)){i.delete(r),t({type:`RESULT`,id:r,success:!1,output:``,error:`Execution cancelled.`});return}let s={id:r,userCode:a,testCode:o,isCancelled:()=>i.has(r)};try{let n=await e.execute(a,o,s);t({type:`RESULT`,id:r,success:n.success,output:n.output,error:n.error})}catch(e){t({type:`RESULT`,id:r,success:!1,output:``,error:e?.message||String(e)})}finally{i.delete(r)}}async function u(n){let{id:r,code:o}=n;if(a&&a!==r){t({type:`LINT_RESULT`,id:r,diagnostics:[]});return}if(i.has(r)){i.delete(r),t({type:`LINT_RESULT`,id:r,diagnostics:[]});return}let s={id:r,code:o,isCancelled:()=>i.has(r)||a!==null&&a!==r};try{let n=e.lint?await e.lint(o,s):[];t({type:`LINT_RESULT`,id:r,diagnostics:Array.isArray(n)?n:[]})}catch(e){console.error(`[Worker Lint Error]:`,e),t({type:`LINT_RESULT`,id:r,diagnostics:[]})}finally{i.delete(r)}}async function d(n){try{e.reset&&await e.reset(),t({type:`RESET_DONE`,id:n.id})}catch(e){console.error(`[Worker Reset Error]:`,e),t({type:`RESET_DONE`,id:n.id})}}async function f(){if(!r){r=!0;try{if(!o&&!s&&await c,s){for(;n.length>0;){let e=n.shift();e.type===`RUN`?t({type:`RESULT`,id:e.id,success:!1,output:``,error:s.message||`Worker initialization failed.`}):e.type===`LINT`?t({type:`LINT_RESULT`,id:e.id,diagnostics:[]}):e.type===`RESET`&&t({type:`RESET_DONE`,id:e.id})}return}for(;n.length>0;){let e=n.shift();e.type===`RUN`?await l(e):e.type===`LINT`?await u(e):e.type===`RESET`&&await d(e)}}finally{r=!1}}}self.onmessage=e=>{let t=e.data;if(!(!t||!t.type)){if(t.type===`CANCEL`){i.add(t.id);return}t.type===`LINT`&&(a=t.id),n.push(t),f()}}}function r(){let e=self.ocaml;if(e&&typeof e.run==`function`)return e;let t=globalThis.ocaml;if(t&&typeof t.run==`function`)return t}function i(e,t){if(!e||!e.trim())return[];let n=[],r=/(?:File "[^"]*", |Line |line )?line (\d+), characters (\d+)-(\d+):[\s\S]*?(Error|Warning[^\n:]*):\s*([\s\S]*?)(?=(?:File "[^"]*", |Line |line \d+, characters)|$)/gi,i;for(;(i=r.exec(e))!==null;){let e=parseInt(i[1],10)||1,r=parseInt(i[2],10)||0,a=parseInt(i[3],10)||r+1,o=i[4].toLowerCase(),s=i[5].trim().replace(/\s+/g,` `),c=e;t>0&&c>t?c-=t:t>0&&c<=t&&(c=1);let l=o.startsWith(`warning`)?`warning`:`error`;n.push({line:c,column:r+1,endLine:c,endColumn:a+1,severity:l,message:s,source:`ocaml`})}return n.length===0&&(e.toLowerCase().includes(`error`)||e.toLowerCase().includes(`syntax`)||e.toLowerCase().includes(`failure`))&&n.push({line:1,column:1,severity:`error`,message:e.trim().replace(/\s+/g,` `),source:`ocaml`}),n}function a(e){return e?e.replace(/^module Tests : sig[\s\S]*?end\n?/m,``).replace(/^module Tests :[\s\S]*?end\n?/m,``).trimStart():``}n({async init(){let e=await fetch(t);if(!e.ok)throw Error(`HTTP ${e.status} fetching toplevel.bc.js`);let n=await e.text();if((0,eval)(n),!r())throw Error(`OCaml compiler runtime (ocaml.run) was not found after script execution`)},execute(t,n=``){let o=r();if(!o||!o.run)return{success:!1,output:``,error:`OCaml compiler not initialized in worker`};let s=e.split(`
`).length,c=`${e}\n${t}\n${n};;`;try{let e=o.run(c),t=a(e.out||``),n=(e.err||``).trim(),r=i(n,s);return r.some(e=>e.severity===`error`)||!e.success&&n.length>0&&!r.every(e=>e.severity===`warning`)?{success:!1,output:t,error:n||`OCaml execution failed`}:{success:!0,output:n?t?`${t}\n${n}`:n:t,error:void 0}}catch(e){return{success:!1,output:``,error:e?.message||String(e)}}},lint(t){if(!t.trim())return[];let n=r();if(!n||!n.run)return[];let a=e.split(`
`).length,o=`${e}\n${t}\n;;`;try{let e=n.run(o);return!e.err||!e.err.trim()?[]:i(e.err,a)}catch(e){return console.warn(`[OCaml Worker Lint Error]:`,e),[]}},reset(){let e=r();if(e&&typeof e.reset==`function`)try{e.reset()}catch(e){console.warn(`[OCaml Reset Warning]:`,e)}}})})();