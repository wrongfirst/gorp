(function(){function e(){return e=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)({}).hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},e.apply(null,arguments)}var t=!1;try{t=typeof localStorage<`u`}catch{}var n=typeof process<`u`,r=t&&typeof localStorage.getItem==`function`&&localStorage.getItem(`DEBUG`)||n&&{}.DEBUG?console.log:function(e){return``},i=function(e,t){var n=e.target||t.ScriptTarget.ES5,r=e.lib||[],i=`lib.d.ts,lib.core.d.ts,lib.decorators.d.ts,lib.decorators.legacy.d.ts,lib.dom.asynciterable.d.ts,lib.dom.d.ts,lib.dom.iterable.d.ts,lib.webworker.asynciterable.d.ts,lib.webworker.d.ts,lib.webworker.importscripts.d.ts,lib.webworker.iterable.d.ts,lib.scripthost.d.ts,lib.es5.d.ts,lib.es6.d.ts,lib.es7.d.ts,lib.core.es6.d.ts,lib.core.es7.d.ts,lib.es2015.collection.d.ts,lib.es2015.core.d.ts,lib.es2015.d.ts,lib.es2015.generator.d.ts,lib.es2015.iterable.d.ts,lib.es2015.promise.d.ts,lib.es2015.proxy.d.ts,lib.es2015.reflect.d.ts,lib.es2015.symbol.d.ts,lib.es2015.symbol.wellknown.d.ts,lib.es2016.array.include.d.ts,lib.es2016.d.ts,lib.es2016.full.d.ts,lib.es2016.intl.d.ts,lib.es2017.arraybuffer.d.ts,lib.es2017.d.ts,lib.es2017.date.d.ts,lib.es2017.full.d.ts,lib.es2017.intl.d.ts,lib.es2017.object.d.ts,lib.es2017.sharedmemory.d.ts,lib.es2017.string.d.ts,lib.es2017.typedarrays.d.ts,lib.es2018.asyncgenerator.d.ts,lib.es2018.asynciterable.d.ts,lib.es2018.d.ts,lib.es2018.full.d.ts,lib.es2018.intl.d.ts,lib.es2018.promise.d.ts,lib.es2018.regexp.d.ts,lib.es2019.array.d.ts,lib.es2019.d.ts,lib.es2019.full.d.ts,lib.es2019.intl.d.ts,lib.es2019.object.d.ts,lib.es2019.string.d.ts,lib.es2019.symbol.d.ts,lib.es2020.bigint.d.ts,lib.es2020.d.ts,lib.es2020.date.d.ts,lib.es2020.full.d.ts,lib.es2020.intl.d.ts,lib.es2020.number.d.ts,lib.es2020.promise.d.ts,lib.es2020.sharedmemory.d.ts,lib.es2020.string.d.ts,lib.es2020.symbol.wellknown.d.ts,lib.es2021.d.ts,lib.es2021.full.d.ts,lib.es2021.intl.d.ts,lib.es2021.promise.d.ts,lib.es2021.string.d.ts,lib.es2021.weakref.d.ts,lib.es2022.array.d.ts,lib.es2022.d.ts,lib.es2022.error.d.ts,lib.es2022.full.d.ts,lib.es2022.intl.d.ts,lib.es2022.object.d.ts,lib.es2022.regexp.d.ts,lib.es2022.sharedmemory.d.ts,lib.es2022.string.d.ts,lib.es2023.array.d.ts,lib.es2023.collection.d.ts,lib.es2023.d.ts,lib.es2023.full.d.ts,lib.es2023.intl.d.ts,lib.es2024.arraybuffer.d.ts,lib.es2024.collection.d.ts,lib.es2024.d.ts,lib.es2024.full.d.ts,lib.es2024.object.d.ts,lib.es2024.promise.d.ts,lib.es2024.regexp.d.ts,lib.es2024.sharedmemory.d.ts,lib.es2024.string.d.ts,lib.es2025.collection.d.ts,lib.es2025.d.ts,lib.es2025.float16.d.ts,lib.es2025.full.d.ts,lib.es2025.intl.d.ts,lib.es2025.iterator.d.ts,lib.es2025.promise.d.ts,lib.es2025.regexp.d.ts,lib.esnext.array.d.ts,lib.esnext.asynciterable.d.ts,lib.esnext.bigint.d.ts,lib.esnext.collection.d.ts,lib.esnext.d.ts,lib.esnext.date.d.ts,lib.esnext.decorators.d.ts,lib.esnext.disposable.d.ts,lib.esnext.error.d.ts,lib.esnext.float16.d.ts,lib.esnext.full.d.ts,lib.esnext.intl.d.ts,lib.esnext.iterator.d.ts,lib.esnext.object.d.ts,lib.esnext.promise.d.ts,lib.esnext.regexp.d.ts,lib.esnext.sharedmemory.d.ts,lib.esnext.string.d.ts,lib.esnext.symbol.d.ts,lib.esnext.temporal.d.ts,lib.esnext.typedarrays.d.ts,lib.esnext.weakref.d.ts`.split(`,`),a=t.ScriptTarget[n],o=i.filter(function(e){return e.startsWith(`lib.`+a.toLowerCase())}),s=i.indexOf(o.pop()),c=function(e){return e&&e.length?e.reduce(function(e,t){return t>e?t:e}):void 0}(r.map(function(e){var t=i.filter(function(t){return t.startsWith(`lib.`+e.toLowerCase())});return t.length===0?0:i.indexOf(t.pop())}))||0,l=Math.max(s,c);return i.slice(0,l+1)},a=function(e,t,n,r,a,o,s){var c=o||fetch,l=new Map,u=i(e,r),d=`https://playgroundcdn.typescriptlang.org/cdn/`+t+`/typescript/lib/`;function f(e){return a?a.compressToUTF16(e):e}function p(e){return a?a.decompressFromUTF16(e):e}function m(){return Promise.all(u.map(function(e){return c(d+e).then(function(e){return e.text()})})).then(function(e){e.forEach(function(e,t){return l.set(`/`+u[t],e)})}).catch(function(){})}function h(){var e=s||localStorage;return Object.keys(e).forEach(function(n){n.startsWith(`ts-lib-`)&&!n.startsWith(`ts-lib-`+t)&&e.removeItem(n)}),Promise.all(u.map(function(n){var r=`ts-lib-`+t+`-`+n,i=e.getItem(r);return i?Promise.resolve(p(i)):c(d+n).then(function(e){return e.text()}).then(function(t){return e.setItem(r,f(t)),t}).catch(function(){})})).then(function(e){e.forEach(function(e,t){if(e){var n=`/`+u[t];l.set(n,e)}})})}return(n?h:m)().then(function(){return l})};function o(e){throw Error(`Method '`+e+`' is not implemented.`)}function s(e,t){return function(){for(var n=arguments.length,i=Array(n),a=0;a<n;a++)i[a]=arguments[a];var o=t.apply(void 0,i),s=typeof o==`string`?o.slice(0,80)+`...`:o;return r.apply(void 0,[`> `+e].concat(i)),r(`< `+s),o}}var c=function(t){return e({},t.getDefaultCompilerOptions(),{jsx:t.JsxEmit.React,strict:!0,esModuleInterop:!0,module:t.ModuleKind.ESNext,suppressOutputPathCheck:!0,skipLibCheck:!0,skipDefaultLibCheck:!0},t.versionMajorMinor&&Number(t.versionMajorMinor.split(`.`)[0])>=6?{ignoreDeprecations:`6.0`}:{moduleResolution:t.ModuleResolutionKind.NodeJs})},l=function(e){return e.replace(`/`,`/lib.`).toLowerCase()};function u(e){return{args:[],createDirectory:function(){return o(`createDirectory`)},directoryExists:s(`directoryExists`,function(t){return Array.from(e.keys()).some(function(e){return e.startsWith(t)})}),exit:function(){return o(`exit`)},fileExists:s(`fileExists`,function(t){return e.has(t)||e.has(l(t))}),getCurrentDirectory:function(){return`/`},getDirectories:function(){return[]},getExecutingFilePath:function(){return o(`getExecutingFilePath`)},readDirectory:s(`readDirectory`,function(t){return t===`/`?Array.from(e.keys()):[]}),readFile:s(`readFile`,function(t){return e.get(t)??e.get(l(t))}),resolvePath:function(e){return e},newLine:`
`,useCaseSensitiveFileNames:!0,write:function(){return o(`write`)},writeFile:function(t,n){e.set(t,n)},deleteFile:function(t){e.delete(t)}}}function d(t,n,r){var i=new Map,a=function(e){return i.set(e.fileName,e),e};return{compilerHost:e({},t,{getCanonicalFileName:function(e){return e},getDefaultLibFileName:function(){return`/`+r.getDefaultLibFileName(n)},getNewLine:function(){return t.newLine},getSourceFile:function(e,o){return i.get(e)||a(r.createSourceFile(e,t.readFile(e),o??n.target??c(r).target,!1))},useCaseSensitiveFileNames:function(){return t.useCaseSensitiveFileNames}}),updateFile:function(e){var n=i.has(e.fileName);return t.writeFile(e.fileName,e.text),i.set(e.fileName,e),n},deleteFile:function(e){var n=i.has(e.fileName);return i.delete(e.fileName),t.deleteFile(e.fileName),n}}}function f(e){function t(e){self.postMessage(e)}let n=[],r=!1,i=new Set,a=null,o=!1,s=null,c=(async()=>{try{e.init&&await e.init(),o=!0,t({type:`READY`})}catch(e){console.error(`[Worker Init Error]:`,e),s=e instanceof Error?e:Error(String(e)),t({type:`INIT_ERROR`,error:e?.message||String(e)})}})();async function l(n){let{id:r,userCode:a,testCode:o=``}=n;if(i.has(r)){i.delete(r),t({type:`RESULT`,id:r,success:!1,output:``,error:`Execution cancelled.`});return}let s={id:r,userCode:a,testCode:o,isCancelled:()=>i.has(r)};try{let n=await e.execute(a,o,s);t({type:`RESULT`,id:r,success:n.success,output:n.output,error:n.error})}catch(e){t({type:`RESULT`,id:r,success:!1,output:``,error:e?.message||String(e)})}finally{i.delete(r)}}async function u(n){let{id:r,code:o}=n;if(a&&a!==r){t({type:`LINT_RESULT`,id:r,diagnostics:[]});return}if(i.has(r)){i.delete(r),t({type:`LINT_RESULT`,id:r,diagnostics:[]});return}let s={id:r,code:o,isCancelled:()=>i.has(r)||a!==null&&a!==r};try{let n=e.lint?await e.lint(o,s):[];t({type:`LINT_RESULT`,id:r,diagnostics:Array.isArray(n)?n:[]})}catch(e){console.error(`[Worker Lint Error]:`,e),t({type:`LINT_RESULT`,id:r,diagnostics:[]})}finally{i.delete(r)}}async function d(n){try{e.reset&&await e.reset(),t({type:`RESET_DONE`,id:n.id})}catch(e){console.error(`[Worker Reset Error]:`,e),t({type:`RESET_DONE`,id:n.id})}}async function f(){if(!r){r=!0;try{if(!o&&!s&&await c,s){for(;n.length>0;){let e=n.shift();e.type===`RUN`?t({type:`RESULT`,id:e.id,success:!1,output:``,error:s.message||`Worker initialization failed.`}):e.type===`LINT`?t({type:`LINT_RESULT`,id:e.id,diagnostics:[]}):e.type===`RESET`&&t({type:`RESET_DONE`,id:e.id})}return}for(;n.length>0;){let e=n.shift();e.type===`RUN`?await l(e):e.type===`LINT`?await u(e):e.type===`RESET`&&await d(e)}}finally{r=!1}}}self.onmessage=e=>{let t=e.data;if(!(!t||!t.type)){if(t.type===`CANCEL`){i.add(t.id);return}t.type===`LINT`&&(a=t.id),n.push(t),f()}}}var p=`declare const console: {
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
      console.log(\`Test passed: \${msg}\`);
    } else {
      console.log(\`Test failed: \${msg}\`);
      throw new Error(\`Test failed: \${msg}\`);
    }
  },

  equalCheck(msg: string, expected: any, actual: any) {
    if (deepEquals(expected, actual)) {
      console.log(\`Test passed: \${msg}\`);
    } else {
      console.log(\`Test failed: \${msg}\\nExpected: \${JSON.stringify(expected)}\\nActual:   \${JSON.stringify(actual)}\`);
      throw new Error(\`Test failed: \${msg}\`);
    }
  },

  unorderedEqualCheck(msg: string, expected: any, actual: any) {
    const normExp = normalizeNested(expected);
    const normAct = normalizeNested(actual);
    if (deepEquals(normExp, normAct)) {
      console.log(\`Test passed: \${msg}\`);
    } else {
      console.log(\`Test failed: \${msg}\\nExpected: \${JSON.stringify(expected)}\\nActual:   \${JSON.stringify(actual)}\`);
      throw new Error(\`Test failed: \${msg}\`);
    }
  }
};

`;let m=`6.0.3`,h=`https://cdn.jsdelivr.net/npm/typescript@${m}/lib/typescript.min.js`,g=`https://cdn.jsdelivr.net/npm/typescript@${m}/lib/`,_=null,v=new Map;function y(e){if(typeof e==`string`)return e;if(e===void 0)return`undefined`;if(e===null)return`null`;if(typeof e==`function`)return`[Function: ${e.name||`anonymous`}]`;if(e instanceof Error)return e.stack||`${e.name}: ${e.message}`;try{let t=new WeakSet;return JSON.stringify(e,(e,n)=>{if(typeof n==`object`&&n){if(t.has(n))return`[Circular]`;t.add(n)}return n})}catch{return String(e)}}async function b(){if(self.ts!==void 0)return self.ts;let e=await fetch(h);if(!e.ok)throw Error(`Failed to fetch TypeScript compiler: HTTP ${e.status}`);let t=await e.text();if((0,eval)(t),self.ts===void 0)throw Error(`TypeScript compiler failed to initialize.`);return self.ts}function x(e,t,n){let r=d(e,t,n);return{...r.compilerHost,getSourceFile:(t,n)=>{if(typeof e.readFile(t)==`string`)try{return r.compilerHost.getSourceFile(t,n)}catch{return}}}}f({async init(){_=await b();let e={target:_.ScriptTarget.ES2022,module:_.ModuleKind.ESNext,strict:!0,noEmit:!0,skipLibCheck:!0,skipDefaultLibCheck:!0},t=new Map;v=await a(e,m,!0,_,void 0,async e=>{let t=e.substring(e.lastIndexOf(`/`)+1),n=await fetch(g+t);if(!n.ok)throw Error(`Failed to fetch library file ${t}: HTTP ${n.status}`);return{json:()=>n.json(),text:()=>n.text()}},{getItem:e=>t.get(e)??null,setItem:(e,n)=>{t.set(e,n)},removeItem:e=>{t.delete(e)}});for(let e of Array.from(v.keys()))(e.includes(`dom`)||e.includes(`scripthost`)||e.includes(`webworker`))&&v.delete(e)},async execute(e,t=``){_||=await b();let n=[],r={log:(...e)=>n.push(e.map(y).join(` `)),error:(...e)=>n.push(`[error] `+e.map(y).join(` `)),warn:(...e)=>n.push(`[warn] `+e.map(y).join(` `)),info:(...e)=>n.push(e.map(y).join(` `)),debug:(...e)=>n.push(`[debug] `+e.map(y).join(` `)),dir:e=>n.push(y(e)),table:e=>n.push(y(e))},i=p.split(`
`).length,a=e.split(`
`).length,o=`${p}\n${e}\n${t}`,s={target:_.ScriptTarget.ES2022,module:_.ModuleKind.ESNext,strict:!0,noEmit:!0,skipLibCheck:!0,skipDefaultLibCheck:!0},c=[];try{let e=new Map(v);e.set(`/index.ts`,o);let t=x(u(e),s,_),n=_.createProgram({rootNames:[`/index.ts`],options:s,host:t}),r=n.getSyntacticDiagnostics(),l=n.getSemanticDiagnostics(),d=[...r,...l].filter(e=>!e.file||e.file.fileName===`/index.ts`);for(let e of d){let t=typeof e.messageText==`string`?e.messageText:_.flattenDiagnosticMessageText(e.messageText,`
`);if(e.file&&e.start!==void 0){let{line:n,character:r}=e.file.getLineAndCharacterOfPosition(e.start);if(n<i)continue;let o=`Line ${n+1}:${r+1}`;n>=i&&n<i+a?o=`Line ${n-i+1}:${r+1}`:n>=i+a&&(o=`Test Line ${n-(i+a)+1}:${r+1}`),c.push(`[Type Error] ${o} - ${t}`)}else c.push(`[Type Error] ${t}`)}}catch(e){console.error(`[TypeScript Type Check Error]:`,e),c.push(`[Type Check Failed]: ${e?.message||String(e)}`)}let l=``;try{l=_.transpileModule(o,{compilerOptions:{target:_.ScriptTarget.ES2022,module:_.ModuleKind.CommonJS}}).outputText}catch(e){return{success:!1,output:c.join(`
`),error:`Transpilation failed: ${e?.message||String(e)}`}}try{Function(`console`,`exports`,l)(r,{});let e=[...c,...n].join(`
`),t=c.length>0;return{success:!t,output:e,error:t?`TypeScript type check failed with ${c.length} error(s)`:void 0}}catch(e){return{success:!1,output:[...c,...n].join(`
`),error:e?.message||String(e)}}},async lint(e){if(!e.trim())return[];_||=await b();try{let t=new Map(v);t.set(`/index.ts`,e),t.set(`/harness.ts`,p);let n={target:_.ScriptTarget.ES2022,module:_.ModuleKind.ESNext,strict:!0,noEmit:!0,skipLibCheck:!0,skipDefaultLibCheck:!0},r=x(u(t),n,_),i=_.createProgram({rootNames:[`/index.ts`,`/harness.ts`],options:n,host:r}),a=i.getSyntacticDiagnostics(),o=i.getSemanticDiagnostics(),s=[...a,...o].filter(e=>!e.file||e.file.fileName===`/index.ts`),c=[];for(let e of s){let t=typeof e.messageText==`string`?e.messageText:_.flattenDiagnosticMessageText(e.messageText,`
`),n=e.start===void 0?0:e.start,r=e.start===void 0?1:e.start+(e.length||1),i=e.category===_.DiagnosticCategory.Warning?`warning`:`error`;c.push({from:n,to:r,severity:i,message:t,source:`typescript`})}return c}catch(e){return console.warn(`[TypeScript Worker Lint Error]:`,e),[]}}})})();