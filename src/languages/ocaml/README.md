# Build the Toplevel

The following are instructions to ONLY build the Toplevel. It is assumed you already have `opam` installed:

Initialize a local switch (this creates a `_opam` folder hidden in the root)

```bash
opam switch create . 5.2.0
```
Activate the Environment

```bash
eval $(opam env)
```

Install dependencies:

```bash
opam install . --deps-only
```

Now, build the Toplevel

```bash
dune build
```
and copy/compress the built file:

```bash
gzip -c -9 _build/default/toplevel.bc.js > ./toplevel.bc.js.gz
```

NOTE: If you run into eval `Unbound module` errors, it could be you've not run
`eval $(opam env)`
