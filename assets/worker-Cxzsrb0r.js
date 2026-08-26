(function(){var e=Object.create,t=Object.defineProperty,n=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,i=Object.getPrototypeOf,a=Object.prototype.hasOwnProperty,o=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t),e=null),t.exports),s=(e,i,o,s)=>{if(i&&typeof i==`object`||typeof i==`function`)for(var c=r(i),l=0,u=c.length,d;l<u;l++)d=c[l],!a.call(e,d)&&d!==o&&t(e,d,{get:(e=>i[e]).bind(null,d),enumerable:!(s=n(i,d))||s.enumerable});return e},c=(n,r,o)=>(o=n==null?{}:e(i(n)),s(r||!n||!n.__esModule||!a.call(n,`default`)?t(o,`default`,{value:n,enumerable:!0}):o,n)),l=o(((e,t)=>{t.exports={}})),u=Object.defineProperty,d=(e,t)=>u(e,`name`,{value:t,configurable:!0}),ee=(e=>typeof require<`u`?require:typeof Proxy<`u`?new Proxy(e,{get:(e,t)=>(typeof require<`u`?require:e)[t]}):e)(function(e){if(typeof require<`u`)return require.apply(this,arguments);throw Error(`Dynamic require of "`+e+`" is not supported`)}),te=(()=>{for(var e=new Uint8Array(128),t=0;t<64;t++)e[t<26?t+65:t<52?t+71:t<62?t-4:t*4-205]=t;return t=>{for(var n=t.length,r=new Uint8Array((n-(t[n-1]==`=`)-(t[n-2]==`=`))*3/4|0),i=0,a=0;i<n;){var o=e[t.charCodeAt(i++)],s=e[t.charCodeAt(i++)],c=e[t.charCodeAt(i++)],l=e[t.charCodeAt(i++)];r[a++]=o<<2|s>>4,r[a++]=s<<4|c>>2,r[a++]=c<<6|l}return r}})();function ne(e){return!isNaN(parseFloat(e))&&isFinite(e)}d(ne,`_isNumber`);function f(e){return e.charAt(0).toUpperCase()+e.substring(1)}d(f,`_capitalize`);function p(e){return function(){return this[e]}}d(p,`_getter`);var m=[`isConstructor`,`isEval`,`isNative`,`isToplevel`],h=[`columnNumber`,`lineNumber`],g=[`fileName`,`functionName`,`source`],_=m.concat(h,g,[`args`],[`evalOrigin`]);function v(e){if(e)for(var t=0;t<_.length;t++)e[_[t]]!==void 0&&this[`set`+f(_[t])](e[_[t]])}for(d(v,`StackFrame`),v.prototype={getArgs:d(function(){return this.args},`getArgs`),setArgs:d(function(e){if(Object.prototype.toString.call(e)!==`[object Array]`)throw TypeError(`Args must be an Array`);this.args=e},`setArgs`),getEvalOrigin:d(function(){return this.evalOrigin},`getEvalOrigin`),setEvalOrigin:d(function(e){if(e instanceof v)this.evalOrigin=e;else if(e instanceof Object)this.evalOrigin=new v(e);else throw TypeError(`Eval Origin must be an Object or StackFrame`)},`setEvalOrigin`),toString:d(function(){var e=this.getFileName()||``,t=this.getLineNumber()||``,n=this.getColumnNumber()||``,r=this.getFunctionName()||``;return this.getIsEval()?e?`[eval] (`+e+`:`+t+`:`+n+`)`:`[eval]:`+t+`:`+n:r?r+` (`+e+`:`+t+`:`+n+`)`:e+`:`+t+`:`+n},`toString`)},v.fromString=d(function(e){var t=e.indexOf(`(`),n=e.lastIndexOf(`)`),r=e.substring(0,t),i=e.substring(t+1,n).split(`,`),a=e.substring(n+1);if(a.indexOf(`@`)===0)var o=/@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(a,``),s=o[1],c=o[2],l=o[3];return new v({functionName:r,args:i||void 0,fileName:s,lineNumber:c||void 0,columnNumber:l||void 0})},`StackFrame$$fromString`),y=0;y<m.length;y++)v.prototype[`get`+f(m[y])]=p(m[y]),v.prototype[`set`+f(m[y])]=function(e){return function(t){this[e]=!!t}}(m[y]);var y;for(b=0;b<h.length;b++)v.prototype[`get`+f(h[b])]=p(h[b]),v.prototype[`set`+f(h[b])]=function(e){return function(t){if(!ne(t))throw TypeError(e+` must be a Number`);this[e]=Number(t)}}(h[b]);var b;for(x=0;x<g.length;x++)v.prototype[`get`+f(g[x])]=p(g[x]),v.prototype[`set`+f(g[x])]=function(e){return function(t){this[e]=String(t)}}(g[x]);var x,S=v;function re(){var e=/^\s*at .*(\S+:\d+|\(native\))/m,t=/^(eval@)?(\[native code])?$/;return{parse:d(function(t){if(t.stack&&t.stack.match(e))return this.parseV8OrIE(t);if(t.stack)return this.parseFFOrSafari(t);throw Error(`Cannot parse given Error object`)},`ErrorStackParser$$parse`),extractLocation:d(function(e){if(e.indexOf(`:`)===-1)return[e];var t=/(.+?)(?::(\d+))?(?::(\d+))?$/.exec(e.replace(/[()]/g,``));return[t[1],t[2]||void 0,t[3]||void 0]},`ErrorStackParser$$extractLocation`),parseV8OrIE:d(function(t){return t.stack.split(`
`).filter(function(t){return!!t.match(e)},this).map(function(e){e.indexOf(`(eval `)>-1&&(e=e.replace(/eval code/g,`eval`).replace(/(\(eval at [^()]*)|(,.*$)/g,``));var t=e.replace(/^\s+/,``).replace(/\(eval code/g,`(`).replace(/^.*?\s+/,``),n=t.match(/ (\(.+\)$)/);t=n?t.replace(n[0],``):t;var r=this.extractLocation(n?n[1]:t);return new S({functionName:n&&t||void 0,fileName:[`eval`,`<anonymous>`].indexOf(r[0])>-1?void 0:r[0],lineNumber:r[1],columnNumber:r[2],source:e})},this)},`ErrorStackParser$$parseV8OrIE`),parseFFOrSafari:d(function(e){return e.stack.split(`
`).filter(function(e){return!e.match(t)},this).map(function(e){if(e.indexOf(` > eval`)>-1&&(e=e.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g,`:$1`)),e.indexOf(`@`)===-1&&e.indexOf(`:`)===-1)return new S({functionName:e});var t=/((.*".+"[^@]*)?[^@]*)(?:@)/,n=e.match(t),r=n&&n[1]?n[1]:void 0,i=this.extractLocation(e.replace(t,``));return new S({functionName:r,fileName:i[0],lineNumber:i[1],columnNumber:i[2],source:e})},this)},`ErrorStackParser$$parseFFOrSafari`)}}d(re,`ErrorStackParser`);var ie=new re;function ae(){return typeof API<`u`&&API!==globalThis.API?API.runtimeEnv:oe({IN_BUN:typeof Bun<`u`,IN_DENO:typeof Deno<`u`,IN_NODE:typeof process==`object`&&typeof process.versions==`object`&&typeof process.versions.node==`string`&&!process.browser,IN_SAFARI:typeof navigator==`object`&&typeof navigator.userAgent==`string`&&navigator.userAgent.indexOf(`Chrome`)===-1&&navigator.userAgent.indexOf(`Safari`)>-1,IN_SHELL:typeof read==`function`&&typeof load==`function`,IN_WORKERD:typeof navigator==`object`&&navigator.userAgent?.includes(`Cloudflare-Workers`)})}d(ae,`getGlobalRuntimeEnv`);var C=ae();function oe(e){let t=e.IN_NODE&&typeof module<`u`&&module.exports&&typeof ee==`function`&&typeof __dirname==`string`,n=e.IN_NODE&&!t,r=!e.IN_NODE&&!e.IN_DENO&&!e.IN_BUN,i=r&&typeof window<`u`&&typeof window.document<`u`&&typeof document.createElement==`function`&&`sessionStorage`in window&&typeof globalThis.importScripts!=`function`,a=r&&typeof globalThis.WorkerGlobalScope<`u`&&typeof globalThis.self<`u`&&globalThis.self instanceof globalThis.WorkerGlobalScope;if(a&&se())throw Error(`Classic web workers are not supported`);let o={...e,IN_BROWSER:r,IN_BROWSER_MAIN_THREAD:i,IN_BROWSER_WEB_WORKER:a,IN_NODE_COMMONJS:t,IN_NODE_ESM:n};if(!(o.IN_BROWSER_MAIN_THREAD||o.IN_BROWSER_WEB_WORKER||o.IN_NODE||o.IN_SHELL||o.IN_WORKERD))throw Error(`Cannot determine runtime environment: ${JSON.stringify(o)}`);return o}d(oe,`calculateDerivedFlags`);function se(){try{return globalThis.importScripts(`data:text/javascript,`),!0}catch{return!1}}d(se,`isClassicWorker`);var ce,w,le,T;async function E(){if(!C.IN_NODE||(ce=(await Promise.resolve().then(()=>c(l(),1))).default,le=await Promise.resolve().then(()=>c(l(),1)),T=await Promise.resolve().then(()=>c(l(),1)),(await Promise.resolve().then(()=>c(l(),1))).default,w=await Promise.resolve().then(()=>c(l(),1)),D=w.sep,typeof ee<`u`))return;let e={fs:le,crypto:await Promise.resolve().then(()=>c(l(),1)),ws:await Promise.resolve().then(()=>c(l(),1)),child_process:await Promise.resolve().then(()=>c(l(),1))};globalThis.require=function(t){return e[t]}}d(E,`initNodeModules`);function ue(e,t){return w.resolve(t||`.`,e)}d(ue,`node_resolvePath`);function de(e,t){return t===void 0&&(t=location),new URL(e,t).toString()}d(de,`browser_resolvePath`);var fe=C.IN_NODE?ue:C.IN_SHELL?d(e=>e,`resolvePath`):de,D;C.IN_NODE||(D=`/`);function pe(e,t){return e.startsWith(`file://`)&&(e=e.slice(7)),e.includes(`://`)?{response:fetch(e)}:{binary:T.readFile(e).then(e=>new Uint8Array(e.buffer,e.byteOffset,e.byteLength))}}d(pe,`node_getBinaryResponse`);function me(e,t){if(e.startsWith(`file://`)&&(e=e.slice(7)),e.includes(`://`))throw Error(`Shell cannot fetch urls`);return{binary:Promise.resolve(new Uint8Array(readbuffer(e)))}}d(me,`shell_getBinaryResponse`);function he(e,t){let n=new URL(e,location);return{response:fetch(n,t?{integrity:t}:{})}}d(he,`browser_getBinaryResponse`);var ge=C.IN_NODE?pe:C.IN_SHELL?me:he;async function _e(e,t){let{response:n,binary:r}=ge(e,t);if(r)return r;let i=await n;if(!i.ok)throw Error(`Failed to load '${e}': request failed.`);return new Uint8Array(await i.arrayBuffer())}d(_e,`loadBinaryFile`);var ve=C.IN_NODE?ye:d(async e=>await import(e),`loadScript`);async function ye(e){return e.startsWith(`file://`)&&(e=e.slice(7)),e.includes(`://`)?await import(e):await import(ce.pathToFileURL(e).href)}d(ye,`nodeLoadScript`);async function be(e){if(C.IN_NODE){await E();let t=await T.readFile(e,{encoding:`utf8`});return JSON.parse(t)}if(C.IN_SHELL){let t=read(e);return JSON.parse(t)}return await(await fetch(e)).json()}d(be,`loadLockFile`);async function xe(){if(C.IN_NODE_COMMONJS)return __dirname;let e;try{throw Error()}catch(t){e=t}let t=ie.parse(e)[0].fileName;if(C.IN_NODE&&!t.startsWith(`file://`)&&(t=`file://${t}`),C.IN_NODE_ESM){let e=await Promise.resolve().then(()=>c(l(),1));return(await Promise.resolve().then(()=>c(l(),1))).fileURLToPath(e.dirname(t))}let n=t.lastIndexOf(D);if(n===-1)throw Error(`Could not extract indexURL path from pyodide module location. Please pass the indexURL explicitly to loadPyodide.`);return t.slice(0,n)}d(xe,`calculateDirname`);function Se(e){return e.substring(0,e.lastIndexOf(`/`)+1)||globalThis.location?.toString()||`.`}d(Se,`calculateInstallBaseUrl`);function O(e){let t=e.FS,n=e.FS.filesystems.MEMFS,r=e.PATH,i={DIR_MODE:16895,FILE_MODE:33279,mount:d(function(e){if(!e.opts.fileSystemHandle)throw Error(`opts.fileSystemHandle is required`);return n.mount.apply(null,arguments)},`mount`),syncfs:d(async(e,t,n)=>{try{let r=i.getLocalSet(e),a=await i.getRemoteSet(e),o=t?a:r,s=t?r:a;await i.reconcile(e,o,s),n(null)}catch(e){n(e)}},`syncfs`),getLocalSet:d(e=>{let n=Object.create(null);function i(e){return e!==`.`&&e!==`..`}d(i,`isRealDir`);function a(e){return t=>r.join2(e,t)}d(a,`toAbsolute`);let o=t.readdir(e.mountpoint).filter(i).map(a(e.mountpoint));for(;o.length;){let e=o.pop(),r=t.stat(e);t.isDir(r.mode)&&o.push.apply(o,t.readdir(e).filter(i).map(a(e))),n[e]={timestamp:r.mtime,mode:r.mode}}return{type:`local`,entries:n}},`getLocalSet`),getRemoteSet:d(async e=>{let t=Object.create(null),n=await Ce(e.opts.fileSystemHandle);for(let[a,o]of n)a!==`.`&&(t[r.join2(e.mountpoint,a)]={timestamp:o.kind===`file`?new Date((await o.getFile()).lastModified):new Date,mode:o.kind===`file`?i.FILE_MODE:i.DIR_MODE});return{type:`remote`,entries:t,handles:n}},`getRemoteSet`),loadLocalEntry:d(e=>{let r=t.lookupPath(e,{}).node,i=t.stat(e);if(t.isDir(i.mode))return{timestamp:i.mtime,mode:i.mode};if(t.isFile(i.mode))return r.contents=n.getFileDataAsTypedArray(r),{timestamp:i.mtime,mode:i.mode,contents:r.contents};throw Error(`node type not supported`)},`loadLocalEntry`),storeLocalEntry:d((e,n)=>{if(t.isDir(n.mode))t.mkdirTree(e,n.mode);else if(t.isFile(n.mode))t.writeFile(e,n.contents,{canOwn:!0});else throw Error(`node type not supported`);t.chmod(e,n.mode),t.utime(e,n.timestamp,n.timestamp)},`storeLocalEntry`),removeLocalEntry:d(e=>{var n=t.stat(e);t.isDir(n.mode)?t.rmdir(e):t.isFile(n.mode)&&t.unlink(e)},`removeLocalEntry`),loadRemoteEntry:d(async e=>{if(e.kind===`file`){let t=await e.getFile();return{contents:new Uint8Array(await t.arrayBuffer()),mode:i.FILE_MODE,timestamp:new Date(t.lastModified)}}if(e.kind===`directory`)return{mode:i.DIR_MODE,timestamp:new Date};throw Error(`unknown kind: `+e.kind)},`loadRemoteEntry`),storeRemoteEntry:d(async(e,n,i)=>{let a=e.get(r.dirname(n)),o=t.isFile(i.mode)?await a.getFileHandle(r.basename(n),{create:!0}):await a.getDirectoryHandle(r.basename(n),{create:!0});if(o.kind===`file`){let e=await o.createWritable();await e.write(i.contents),await e.close()}e.set(n,o)},`storeRemoteEntry`),removeRemoteEntry:d(async(e,t)=>{await e.get(r.dirname(t)).removeEntry(r.basename(t)),e.delete(t)},`removeRemoteEntry`),reconcile:d(async(e,n,a)=>{let o=0,s=[];Object.keys(n.entries).forEach(function(e){let r=n.entries[e],i=a.entries[e];(!i||t.isFile(r.mode)&&r.timestamp.getTime()>i.timestamp.getTime())&&(s.push(e),o++)}),s.sort();let c=[];if(Object.keys(a.entries).forEach(function(e){n.entries[e]||(c.push(e),o++)}),c.sort().reverse(),!o)return;let l=n.type===`remote`?n.handles:a.handles;for(let t of s){let n=r.normalize(t.replace(e.mountpoint,`/`)).substring(1);if(a.type===`local`){let e=l.get(n),r=await i.loadRemoteEntry(e);i.storeLocalEntry(t,r)}else{let e=i.loadLocalEntry(t);await i.storeRemoteEntry(l,n,e)}}for(let t of c)if(a.type===`local`)i.removeLocalEntry(t);else{let n=r.normalize(t.replace(e.mountpoint,`/`)).substring(1);await i.removeRemoteEntry(l,n)}},`reconcile`)};e.FS.filesystems.NATIVEFS_ASYNC=i}d(O,`initializeNativeFS`);var Ce=d(async e=>{let t=[];async function n(e){for await(let r of e.values())t.push(r),r.kind===`directory`&&await n(r)}d(n,`collect`),await n(e);let r=new Map;r.set(`.`,e);for(let n of t){let t=(await e.resolve(n)).join(`/`);r.set(t,n)}return r},`getFsHandles`),we=te(`AGFzbQEAAAABDANfAGAAAW9gAW8BfwMDAgECBygCE0pzdl9HZXRFcnJvcl9pbXBvcnQAAA5Kc3ZFcnJvcl9DaGVjawABChMCBwD7AQD7GwsJACAA+xr7FAAL`),Te=async function(){if(!(globalThis.navigator&&(/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform===`MacIntel`&&typeof navigator.maxTouchPoints<`u`&&navigator.maxTouchPoints>1)))try{let e=await WebAssembly.compile(we);return await WebAssembly.instantiate(e)}catch(e){if(e instanceof WebAssembly.CompileError)return;throw e}}();async function Ee(){let e=await Te;if(e)return e.exports;let t=Symbol(`error marker`);return{Jsv_GetError_import:d(()=>t,`Jsv_GetError_import`),JsvError_Check:d(e=>e===t,`JsvError_Check`)}}d(Ee,`getJsvErrorImport`);function k(e){let t={config:e,runtimeEnv:C},n={noImageDecoding:!0,noAudioDecoding:!0,noWasmDecoding:!1,preRun:Me(e),print:e.stdout,printErr:e.stderr,onExit(e){n.exitCode=e},thisProgram:e._sysExecutable,arguments:e.args,API:t,locateFile:d(t=>e.indexURL+t,`locateFile`),instantiateWasm:Ne(e.indexURL)};return n}d(k,`createSettings`);function De(e){return function(t){try{t.FS.mkdirTree(e)}catch(t){console.error(`Error occurred while making a home directory '${e}':`),console.error(t),console.error(`Using '/' for a home directory instead`),e=`/`}t.FS.chdir(e)}}d(De,`createHomeDirectory`);function Oe(e){return function(t){Object.assign(t.ENV,e)}}d(Oe,`setEnvironment`);function ke(e){return e?[async t=>{t.addRunDependency(`fsInitHook`);try{await e(t.FS,{sitePackages:t.API.sitePackages})}finally{t.removeRunDependency(`fsInitHook`)}}]:[]}d(ke,`callFsInitHook`);function Ae(e){let t=e.HEAPU32[e._Py_Version>>>2];return[t>>>24&255,t>>>16&255,t>>>8&255]}d(Ae,`computeVersionTuple`);function je(e){let t=_e(e);return async e=>{e.API.pyVersionTuple=Ae(e);let[n,r]=e.API.pyVersionTuple;e.FS.mkdirTree(`/lib`),e.API.sitePackages=`/lib/python${n}.${r}/site-packages`,e.FS.mkdirTree(e.API.sitePackages),e.FS.mkdirTree(`/lib/python${n}.${r}/lib-dynload`),e.addRunDependency(`install-stdlib`);try{let i=await t;e.FS.writeFile(`/lib/python${n}${r}.zip`,i)}catch(e){console.error(`Error occurred while installing the standard library:`),console.error(e)}finally{e.removeRunDependency(`install-stdlib`)}}}d(je,`installStdlib`);function Me(e){let t;return t=e.stdLibURL==null?e.indexURL+`python_stdlib.zip`:e.stdLibURL,[je(t),De(e.env.HOME),Oe(e.env),O,...ke(e.fsInit)]}d(Me,`getFileSystemInitializationFuncs`);function Ne(e){if(typeof WasmOffsetConverter<`u`)return;let{binary:t,response:n}=ge(e+`pyodide.asm.wasm`),r=Ee();return function(e,i){return async function(){let{Jsv_GetError_import:a,JsvError_Check:o}=await r;e.env.Jsv_GetError_import=a,e.env.JsvError_Check=o;try{let r;r=n?await WebAssembly.instantiateStreaming(n,e):await WebAssembly.instantiate(await t,e);let{instance:a,module:o}=r;i(a,o)}catch(e){console.warn(`wasm instantiation failed!`),console.warn(e)}}(),{}}}d(Ne,`getInstantiateWasmFunc`);var Pe=`314.0.5`;function A(e){return e===void 0||e.endsWith(`/`)?e:e+`/`}d(A,`withTrailingSlash`);var Fe=Pe;async function Ie(e={}){if(await E(),e.lockFileContents&&e.lockFileURL)throw Error(`Can't pass both lockFileContents and lockFileURL`);let t=e.indexURL||await xe();if(t=A(fe(t)),e.packageBaseUrl=A(e.packageBaseUrl),e.cdnUrl=A(e.packageBaseUrl??`https://cdn.jsdelivr.net/pyodide/v314.0.5/full/`),!e.lockFileContents){let n=e.lockFileURL??t+`pyodide-lock.json`;e.lockFileContents=be(n),e.packageBaseUrl??=Se(n)}e.indexURL=t,e.packageCacheDir&&=A(fe(e.packageCacheDir));let n={jsglobals:globalThis,stdin:globalThis.prompt?()=>globalThis.prompt():void 0,args:[],env:{},packages:[],packageCacheDir:e.packageBaseUrl,enableRunUntilComplete:!0,checkAPIVersion:!0,BUILD_ID:`8dcb53e7cac88a6445453450b083bbf53c201ccfc9476a9241bf29c218aef342`},r=Object.assign(n,e);return r.env.HOME??=`/home/pyodide`,r.env.PYTHONINSPECT??=`1`,r}d(Ie,`initializeConfiguration`);function Le(e){let t=k(e),n=t.API;return n.lockFilePromise=Promise.resolve(e.lockFileContents),t}d(Le,`createEmscriptenSettings`);async function Re(e){return e.createPyodideModule?e.createPyodideModule:(await ve(`${e.indexURL}pyodide.asm.mjs`)).default}d(Re,`loadWasmScript`);async function ze(e,t){if(!e._loadSnapshot)return;let n=await e._loadSnapshot,r=ArrayBuffer.isView(n)?n:new Uint8Array(n);return t.noInitialRun=!0,t.INITIAL_MEMORY=r.length,r}d(ze,`prepareSnapshot`);async function Be(e,t){let n=await e(t);if(t.exitCode!==void 0)throw new n.ExitStatus(t.exitCode);return n}d(Be,`instantiatePyodideModule`);function Ve(e,t){let n=e.API;if(t.pyproxyToStringRepr&&n.setPyProxyToStringMethod(!0),t.convertNullToNone&&n.setCompatNullToNone(!0),t.toJsLiteralMap&&n.setCompatToJsLiteralMap(!0),n.version!==`314.0.5`&&t.checkAPIVersion)throw Error(`Pyodide version does not match: '${Fe}' <==> '${n.version}'. If you updated the Pyodide version, make sure you also updated the 'indexURL' parameter passed to loadPyodide.`);e.locateFile=e=>{throw e.endsWith(`.so`)?Error(`Failed to find dynamic library "${e}"`):Error(`Unexpected call to locateFile("${e}")`)}}d(Ve,`configureAPI`);function He(e,t,n){let r=e.API,i;return t&&(i=r.restoreSnapshot(t)),r.finalizeBootstrap(i,n._snapshotDeserializer)}d(He,`bootstrapPyodide`);async function Ue(e,t){let n=e._api;return n.sys.path.insert(0,``),n._pyodide.set_excepthook(),await n.packageIndexReady,n.initializeStreams(t.stdin,t.stdout,t.stderr),e}d(Ue,`finalizeSetup`);async function We(e={}){let t=await Ie(e),n=Le(t),r=await Re(t),i=await ze(t,n),a=await Be(r,n);return Ve(a,t),await Ue(He(a,i,t),t)}d(We,`loadPyodide`);function Ge(e){function t(e){self.postMessage(e)}let n=[],r=!1,i=new Set,a=null;Promise.resolve().then(()=>e.init?.()).then(()=>{t({type:`READY`})}).catch(e=>{console.error(`[Worker Init Error]:`,e),t({type:`INIT_ERROR`,error:e?.message||String(e)})});async function o(n){let{id:r,userCode:a,testCode:o=``}=n;if(i.has(r)){i.delete(r),t({type:`RESULT`,id:r,success:!1,output:``,error:`Execution cancelled.`});return}let s={id:r,userCode:a,testCode:o,isCancelled:()=>i.has(r)};try{let n=await e.execute(a,o,s);t({type:`RESULT`,id:r,success:n.success,output:n.output,error:n.error})}catch(e){t({type:`RESULT`,id:r,success:!1,output:``,error:e?.message||String(e)})}finally{i.delete(r)}}async function s(n){let{id:r,code:o}=n;if(a&&a!==r){t({type:`LINT_RESULT`,id:r,diagnostics:[]});return}if(i.has(r)){i.delete(r),t({type:`LINT_RESULT`,id:r,diagnostics:[]});return}let s={id:r,code:o,isCancelled:()=>i.has(r)||a!==null&&a!==r};try{let n=e.lint?await e.lint(o,s):[];t({type:`LINT_RESULT`,id:r,diagnostics:Array.isArray(n)?n:[]})}catch(e){console.error(`[Worker Lint Error]:`,e),t({type:`LINT_RESULT`,id:r,diagnostics:[]})}finally{i.delete(r)}}async function c(n){try{e.reset&&await e.reset(),t({type:`RESET_DONE`,id:n.id})}catch(e){console.error(`[Worker Reset Error]:`,e),t({type:`RESET_DONE`,id:n.id})}}async function l(){if(!r){r=!0;try{for(;n.length>0;){let e=n.shift();e.type===`RUN`?await o(e):e.type===`LINT`?await s(e):e.type===`RESET`&&await c(e)}}finally{r=!1}}}self.onmessage=e=>{let t=e.data;if(!(!t||!t.type)){if(t.type===`CANCEL`){i.add(t.id);return}t.type===`LINT`&&(a=t.id),n.push(t),l()}}}var j=`from typing import Optional, Any
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
            print(f"Test failed: {msg}\\nExpected: {repr(expected)}\\nActual:   {repr(actual)}")
            raise Exception(f"Test failed: {msg}")

    @staticmethod
    def unordered_equal_check(msg: str, expected, actual):
        norm_exp = normalize_nested(expected)
        norm_act = normalize_nested(actual)
        if norm_exp == norm_act:
            print(f"Test passed: {msg}")
        else:
            print(f"Test failed: {msg}\\nExpected: {repr(expected)}\\nActual:   {repr(actual)}")
            raise Exception(f"Test failed: {msg}")


`;let M,N=0,P=null;function F(){return(P===null||P.byteLength===0)&&(P=new Uint8Array(M.memory.buffer)),P}let I=typeof TextEncoder<`u`?new TextEncoder(`utf-8`):{encode:()=>{throw Error(`TextEncoder not available`)}},Ke=typeof I.encodeInto==`function`?function(e,t){return I.encodeInto(e,t)}:function(e,t){let n=I.encode(e);return t.set(n),{read:e.length,written:n.length}};function L(e,t,n){if(n===void 0){let n=I.encode(e),r=t(n.length,1)>>>0;return F().subarray(r,r+n.length).set(n),N=n.length,r}let r=e.length,i=t(r,1)>>>0,a=F(),o=0;for(;o<r;o++){let t=e.charCodeAt(o);if(t>127)break;a[i+o]=t}if(o!==r){o!==0&&(e=e.slice(o)),i=n(i,r,r=o+e.length*3,1)>>>0;let t=F().subarray(i+o,i+r),a=Ke(e,t);o+=a.written,i=n(i,r,o,1)>>>0}return N=o,i}let R=null;function z(){return(R===null||R.buffer.detached===!0||R.buffer.detached===void 0&&R.buffer!==M.memory.buffer)&&(R=new DataView(M.memory.buffer)),R}function qe(e){let t=M.__externref_table_alloc();return M.__wbindgen_export_4.set(t,e),t}function B(e,t){try{return e.apply(this,t)}catch(e){let t=qe(e);M.__wbindgen_exn_store(t)}}let Je=typeof TextDecoder<`u`?new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0}):{decode:()=>{throw Error(`TextDecoder not available`)}};typeof TextDecoder<`u`&&Je.decode();function V(e,t){return e>>>=0,Je.decode(F().subarray(e,e+t))}function H(e){return e==null}function U(e){let t=typeof e;if(t==`number`||t==`boolean`||e==null)return`${e}`;if(t==`string`)return`"${e}"`;if(t==`symbol`){let t=e.description;return t==null?`Symbol`:`Symbol(${t})`}if(t==`function`){let t=e.name;return typeof t==`string`&&t.length>0?`Function(${t})`:`Function`}if(Array.isArray(e)){let t=e.length,n=`[`;t>0&&(n+=U(e[0]));for(let r=1;r<t;r++)n+=`, `+U(e[r]);return n+=`]`,n}let n=/\[object ([^\]]+)\]/.exec(toString.call(e)),r;if(n&&n.length>1)r=n[1];else return toString.call(e);if(r==`Object`)try{return`Object(`+JSON.stringify(e)+`)`}catch{return`Object`}return e instanceof Error?`${e.name}: ${e.message}\n${e.stack}`:r}function W(e){let t=M.__wbindgen_export_4.get(e);return M.__externref_table_dealloc(e),t}let Ye=typeof FinalizationRegistry>`u`?{register:()=>{},unregister:()=>{}}:new FinalizationRegistry(e=>M.__wbg_workspace_free(e>>>0,1));var Xe=class{__destroy_into_raw(){let e=this.__wbg_ptr;return this.__wbg_ptr=0,Ye.unregister(this),e}free(){let e=this.__destroy_into_raw();M.__wbg_workspace_free(e,0)}static version(){let e,t;try{let n=M.workspace_version();return e=n[0],t=n[1],V(n[0],n[1])}finally{M.__wbindgen_free(e,t,1)}}constructor(e){let t=M.workspace_new(e);if(t[2])throw W(t[1]);return this.__wbg_ptr=t[0]>>>0,Ye.register(this,this.__wbg_ptr,this),this}static defaultSettings(){let e=M.workspace_defaultSettings();if(e[2])throw W(e[1]);return W(e[0])}check(e){let t=L(e,M.__wbindgen_malloc,M.__wbindgen_realloc),n=N,r=M.workspace_check(this.__wbg_ptr,t,n);if(r[2])throw W(r[1]);return W(r[0])}format(e){let t,n;try{let a=L(e,M.__wbindgen_malloc,M.__wbindgen_realloc),o=N,s=M.workspace_format(this.__wbg_ptr,a,o);var r=s[0],i=s[1];if(s[3])throw r=0,i=0,W(s[2]);return t=r,n=i,V(r,i)}finally{M.__wbindgen_free(t,n,1)}}format_ir(e){let t,n;try{let a=L(e,M.__wbindgen_malloc,M.__wbindgen_realloc),o=N,s=M.workspace_format_ir(this.__wbg_ptr,a,o);var r=s[0],i=s[1];if(s[3])throw r=0,i=0,W(s[2]);return t=r,n=i,V(r,i)}finally{M.__wbindgen_free(t,n,1)}}comments(e){let t,n;try{let a=L(e,M.__wbindgen_malloc,M.__wbindgen_realloc),o=N,s=M.workspace_comments(this.__wbg_ptr,a,o);var r=s[0],i=s[1];if(s[3])throw r=0,i=0,W(s[2]);return t=r,n=i,V(r,i)}finally{M.__wbindgen_free(t,n,1)}}parse(e){let t,n;try{let a=L(e,M.__wbindgen_malloc,M.__wbindgen_realloc),o=N,s=M.workspace_parse(this.__wbg_ptr,a,o);var r=s[0],i=s[1];if(s[3])throw r=0,i=0,W(s[2]);return t=r,n=i,V(r,i)}finally{M.__wbindgen_free(t,n,1)}}tokens(e){let t,n;try{let a=L(e,M.__wbindgen_malloc,M.__wbindgen_realloc),o=N,s=M.workspace_tokens(this.__wbg_ptr,a,o);var r=s[0],i=s[1];if(s[3])throw r=0,i=0,W(s[2]);return t=r,n=i,V(r,i)}finally{M.__wbindgen_free(t,n,1)}}};async function Ze(e,t){if(typeof Response==`function`&&e instanceof Response){if(typeof WebAssembly.instantiateStreaming==`function`)try{return await WebAssembly.instantiateStreaming(e,t)}catch(t){if(e.headers.get(`Content-Type`)!=`application/wasm`)console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",t);else throw t}let n=await e.arrayBuffer();return await WebAssembly.instantiate(n,t)}{let n=await WebAssembly.instantiate(e,t);return n instanceof WebAssembly.Instance?{instance:n,module:e}:n}}function Qe(){let e={};return e.wbg={},e.wbg.__wbg_String_8f0eb39a4a4c2f66=function(e,t){let n=L(String(t),M.__wbindgen_malloc,M.__wbindgen_realloc),r=N;z().setInt32(e+4,r,!0),z().setInt32(e+0,n,!0)},e.wbg.__wbg_buffer_609cc3eee51ed158=function(e){return e.buffer},e.wbg.__wbg_call_672a4d21634d4a24=function(){return B(function(e,t){return e.call(t)},arguments)},e.wbg.__wbg_codePointAt_78181f32881e5b59=function(e,t){return e.codePointAt(t>>>0)},e.wbg.__wbg_debug_3cb59063b29f58c1=function(e){console.debug(e)},e.wbg.__wbg_done_769e5ede4b31c67b=function(e){return e.done},e.wbg.__wbg_entries_3265d4158b33e5dc=function(e){return Object.entries(e)},e.wbg.__wbg_error_524f506f44df1645=function(e){console.error(e)},e.wbg.__wbg_error_7534b8e9a36f1ab4=function(e,t){let n,r;try{n=e,r=t,console.error(V(e,t))}finally{M.__wbindgen_free(n,r,1)}},e.wbg.__wbg_fromCodePoint_f37c25c172f2e8b5=function(){return B(function(e){return String.fromCodePoint(e>>>0)},arguments)},e.wbg.__wbg_get_67b2ba62fc30de12=function(){return B(function(e,t){return Reflect.get(e,t)},arguments)},e.wbg.__wbg_get_b9b93047fe3cf45b=function(e,t){return e[t>>>0]},e.wbg.__wbg_getwithrefkey_1dc361bd10053bfe=function(e,t){return e[t]},e.wbg.__wbg_info_3daf2e093e091b66=function(e){console.info(e)},e.wbg.__wbg_instanceof_ArrayBuffer_e14585432e3737fc=function(e){let t;try{t=e instanceof ArrayBuffer}catch{t=!1}return t},e.wbg.__wbg_instanceof_Map_f3469ce2244d2430=function(e){let t;try{t=e instanceof Map}catch{t=!1}return t},e.wbg.__wbg_instanceof_Uint8Array_17156bcf118086a9=function(e){let t;try{t=e instanceof Uint8Array}catch{t=!1}return t},e.wbg.__wbg_isArray_a1eab7e0d067391b=function(e){return Array.isArray(e)},e.wbg.__wbg_isSafeInteger_343e2beeeece1bb0=function(e){return Number.isSafeInteger(e)},e.wbg.__wbg_iterator_9a24c88df860dc65=function(){return Symbol.iterator},e.wbg.__wbg_length_a446193dc22c12f8=function(e){return e.length},e.wbg.__wbg_length_d56737991078581b=function(e){return e.length},e.wbg.__wbg_length_e2d2a49132c1b256=function(e){return e.length},e.wbg.__wbg_log_c222819a41e063d3=function(e){console.log(e)},e.wbg.__wbg_new_405e22f390576ce2=function(){return{}},e.wbg.__wbg_new_5e0be73521bc8c17=function(){return new Map},e.wbg.__wbg_new_78feb108b6472713=function(){return[]},e.wbg.__wbg_new_8a6f238a6ece86ea=function(){return Error()},e.wbg.__wbg_new_a12002a7f91c75be=function(e){return new Uint8Array(e)},e.wbg.__wbg_new_c68d7209be747379=function(e,t){return Error(V(e,t))},e.wbg.__wbg_next_25feadfc0913fea9=function(e){return e.next},e.wbg.__wbg_next_6574e1a8a62d1055=function(){return B(function(e){return e.next()},arguments)},e.wbg.__wbg_set_37837023f3d740e8=function(e,t,n){e[t>>>0]=n},e.wbg.__wbg_set_3f1d0b984ed272ed=function(e,t,n){e[t]=n},e.wbg.__wbg_set_65595bdd868b3009=function(e,t,n){e.set(t,n>>>0)},e.wbg.__wbg_set_8fc6bf8a5b1071d1=function(e,t,n){return e.set(t,n)},e.wbg.__wbg_stack_0ed75d68575b0f3c=function(e,t){let n=t.stack,r=L(n,M.__wbindgen_malloc,M.__wbindgen_realloc),i=N;z().setInt32(e+4,i,!0),z().setInt32(e+0,r,!0)},e.wbg.__wbg_value_cd1ffa7b1ab794f1=function(e){return e.value},e.wbg.__wbg_warn_4ca3906c248c47c4=function(e){console.warn(e)},e.wbg.__wbindgen_as_number=function(e){return+e},e.wbg.__wbindgen_bigint_from_i64=function(e){return e},e.wbg.__wbindgen_bigint_from_u64=function(e){return BigInt.asUintN(64,e)},e.wbg.__wbindgen_bigint_get_as_i64=function(e,t){let n=t,r=typeof n==`bigint`?n:void 0;z().setBigInt64(e+8,H(r)?BigInt(0):r,!0),z().setInt32(e+0,!H(r),!0)},e.wbg.__wbindgen_boolean_get=function(e){let t=e;return typeof t==`boolean`?+!!t:2},e.wbg.__wbindgen_debug_string=function(e,t){let n=L(U(t),M.__wbindgen_malloc,M.__wbindgen_realloc),r=N;z().setInt32(e+4,r,!0),z().setInt32(e+0,n,!0)},e.wbg.__wbindgen_error_new=function(e,t){return Error(V(e,t))},e.wbg.__wbindgen_in=function(e,t){return e in t},e.wbg.__wbindgen_init_externref_table=function(){let e=M.__wbindgen_export_4,t=e.grow(4);e.set(0,void 0),e.set(t+0,void 0),e.set(t+1,null),e.set(t+2,!0),e.set(t+3,!1)},e.wbg.__wbindgen_is_bigint=function(e){return typeof e==`bigint`},e.wbg.__wbindgen_is_function=function(e){return typeof e==`function`},e.wbg.__wbindgen_is_object=function(e){let t=e;return typeof t==`object`&&!!t},e.wbg.__wbindgen_is_string=function(e){return typeof e==`string`},e.wbg.__wbindgen_is_undefined=function(e){return e===void 0},e.wbg.__wbindgen_jsval_eq=function(e,t){return e===t},e.wbg.__wbindgen_jsval_loose_eq=function(e,t){return e==t},e.wbg.__wbindgen_memory=function(){return M.memory},e.wbg.__wbindgen_number_get=function(e,t){let n=t,r=typeof n==`number`?n:void 0;z().setFloat64(e+8,H(r)?0:r,!0),z().setInt32(e+0,!H(r),!0)},e.wbg.__wbindgen_number_new=function(e){return e},e.wbg.__wbindgen_string_get=function(e,t){let n=t,r=typeof n==`string`?n:void 0;var i=H(r)?0:L(r,M.__wbindgen_malloc,M.__wbindgen_realloc),a=N;z().setInt32(e+4,a,!0),z().setInt32(e+0,i,!0)},e.wbg.__wbindgen_string_new=function(e,t){return V(e,t)},e.wbg.__wbindgen_throw=function(e,t){throw Error(V(e,t))},e}function $e(e,t){return M=e.exports,et.__wbindgen_wasm_module=t,R=null,P=null,M.__wbindgen_start(),M}async function et(e){if(M!==void 0)return M;e!==void 0&&(Object.getPrototypeOf(e)===Object.prototype?{module_or_path:e}=e:console.warn(`using deprecated parameters for the initialization function; pass a single object instead`)),e===void 0&&(e=new URL(``+new URL(`ruff_wasm_bg-CN8EUFdK.wasm`,self.location.href).href,``+self.location.href));let t=Qe();(typeof e==`string`||typeof Request==`function`&&e instanceof Request||typeof URL==`function`&&e instanceof URL)&&(e=fetch(e));let{instance:n,module:r}=await Ze(await e,t);return $e(n,r)}let tt=null,G=null;async function K(){return tt||G||(G=(async()=>{await et();let e=new Xe({"line-length":88,"indent-width":4,format:{"indent-style":`space`,"quote-style":`double`},lint:{select:[`E4`,`E7`,`E9`,`F`,`B`,`W`,`UP`],ignore:[]}});return tt=e,e})(),G)}function nt(e){return!e||e.startsWith(`E9`)||e===`SyntaxError`||e===`F821`||e===`F822`||e===`F823`?`error`:(e.startsWith(`W`)||e.startsWith(`B`),`warning`)}async function rt(e){if(!e||!e.trim())return[];try{let t=(await K()).check(e);if(!t||!Array.isArray(t))return[];let n=[];for(let e of t){let t=e.location,r=e.end_location,i=t?.row===void 0?1:t.row>0?t.row:t.row+1,a=t?.column===void 0?1:t.column>0?t.column:t.column+1,o=r?.row===void 0?i:r.row>0?r.row:r.row+1,s=r?.column===void 0?a+1:r.column>0?r.column:r.column+1,c=e.code||``,l=c?`${e.message} [${c}]`:e.message,u=nt(c);n.push({line:i,column:a,endLine:o,endColumn:s,message:l,severity:u,source:`ruff`})}return n}catch(e){return console.warn(`[Ruff Linter Error]:`,e),[]}}let q=!1,J=null,it=`
import json, re

_mypy_line_regex = re.compile(
    r'^/tmp_mypy_input\\.py:(\\d+)(?::(\\d+))?:\\s*(error|warning|note):\\s*(.*)$'
)

def _codebook_mypy_check(src: str) -> str:
    try:
        from mypy import api

        with open('/tmp_mypy_input.py', 'w', encoding='utf-8') as f:
            f.write(src)

        stdout, stderr, exit_status = api.run([
            '/tmp_mypy_input.py',
            '--ignore-missing-imports',
            '--follow-imports=silent',
            '--show-column-numbers',
            '--no-error-summary',
            '--no-color-output',
            '--no-check-untyped-defs',
            '--allow-untyped-defs',
            '--allow-incomplete-defs',
            '--allow-untyped-calls',
            '--hide-error-context',
            '--allow-redefinition',
            '--disable-error-code=var-annotated',
        ])

        diagnostics = []
        if stdout:
            for raw_line in stdout.splitlines():
                line = raw_line.strip()
                if not line or not line.startswith('/tmp_mypy_input.py:'):
                    continue

                m = _mypy_line_regex.match(line)
                if not m:
                    continue

                line_num = int(m.group(1))
                col_num = int(m.group(2)) if m.group(2) else 1
                kind = m.group(3).lower()
                message = m.group(4).strip()

                severity = 'error'
                if kind == 'warning':
                    severity = 'warning'
                elif kind == 'note':
                    severity = 'info'

                diagnostics.append({
                    "line": line_num,
                    "column": col_num,
                    "message": message,
                    "severity": severity,
                    "source": "mypy"
                })

        return json.dumps(diagnostics)
    except Exception as e:
        import sys
        print(f"[Mypy Internal Error]: {e}", file=sys.stderr)
        return "[]"

_codebook_mypy_check
`;async function at(e){if(!q)return J||(J=(async()=>{try{await e.loadPackage(`micropip`),await e.runPythonAsync(`
import micropip
await micropip.install(['typing_extensions', 'mypy_extensions', 'pathspec', 'mypy'])
`),e.runPython(it),q=!0}catch(e){throw J=null,console.error(`[Mypy Init Error]:`,e),Error(`Failed to initialize Mypy in Pyodide: ${e}`)}})(),J)}function ot(){return q}async function st(e,t,n=``){if(!t||!t.trim())return[];q||await at(e);let r=n?n.split(`
`).length:0,i=n?n.endsWith(`
`)?`${n}${t}`:`${n}\n${t}`:t;try{e.globals.get(`_codebook_mypy_check`)||e.runPython(it);let t=e.globals.get(`_codebook_mypy_check`)(i),n=JSON.parse(t);if(r===0)return n;let a=[];for(let e of n)if(e.line!==void 0){if(e.line<=r)continue;let t=e.line-r;a.push({...e,line:t,endLine:e.endLine===void 0?t:Math.max(1,e.endLine-r)})}else a.push(e);return a}catch(e){return console.warn(`[Mypy Checker Error]:`,e),[]}}let Y=null,X=null,Z=null,Q=null;async function $(){return Y||X||(X=(async()=>{let e=await We({indexURL:`https://cdn.jsdelivr.net/pyodide/v314.0.5/full/`});return e.setStdout({batched:e=>{Z&&Z(e)}}),e.setStderr({batched:e=>{Q&&Q(e)}}),Y=e,e})(),X)}Ge({async init(){let[,e]=await Promise.all([K(),$()]);e&&at(e).catch(e=>{console.warn(`[Python Worker Background Mypy Warmup]:`,e)})},async execute(e,t=``){let n=await $();if(e.trim())try{let t=(await st(n,e,j)).filter(e=>e.severity===`error`);if(t.length>0)return{success:!1,output:t.map(e=>`[Type Error] Line ${e.line||1}:${e.column||1} - ${e.message}`).join(`
`),error:`Python type check failed with ${t.length} error(s)`}}catch(e){console.warn(`[Python Worker Type Check Warning]:`,e)}let r=[],i=[];Z=e=>r.push(e),Q=e=>i.push(e);let a=t?`${j}\n\n${e}\n\n${t}`:`${j}\n\n${e}`,o=typeof n.globals?.get==`function`?n.globals.get(`dict`)():null;try{o?await n.runPythonAsync(a,{globals:o}):await n.runPythonAsync(a);let e=r.join(`
`),t=i.join(`
`);return{success:!0,output:t?e?`${e}\n${t}`:t:e,error:void 0}}catch(e){let t=r.join(`
`),n=i.join(`
`);return{success:!1,output:n?t?`${t}\n${n}`:n:t,error:e?.message||String(e)}}finally{Z=null,Q=null,o&&typeof o.destroy==`function`&&o.destroy()}},async lint(e){if(!e.trim())return[];let t=[];try{t=await rt(e)}catch(e){console.warn(`[Python Worker Ruff Lint Error]:`,e)}if(t.some(e=>e.severity===`error`&&(e.message.includes(`SyntaxError`)||e.message.includes(`[E9`))))return t;let n=[];if(Y&&ot())try{n=await st(Y,e,j)}catch(e){console.warn(`[Python Worker Mypy Lint Error]:`,e)}let r=[...t,...n];return r.sort((e,t)=>{let n=(e.line||1)-(t.line||1);return n===0?(e.column||1)-(t.column||1):n}),r}})})();