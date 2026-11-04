Let's set up your local development environment and workspace.

## Starter Project Scaffold

To accompany this course, a unified project scaffold is provided. You can download [**`gorp.zip`**](/gorp.zip) directly, which contains the starter directory structure, `Makefile`, package skeletons, and test datasets.

```text
gorp/
├── go.mod                     # Go module definition (Go 1.22+)
├── Makefile                   # make build, make test, make bench
├── cmd/
│   └── gorp/
│       └── main.go            # CLI entry point
├── pkg/
│   ├── matcher/               # Pattern matching engines (Backtracking & Thompson NFA)
│   ├── display/               # ANSI color formatting & TTY detection
│   └── search/                # Streaming file reader & recursive directory walker
└── testdata/
    ├── sample.txt             # Text verification corpus
    ├── emails.txt             # Realistic capture group & backreference corpus
    ├── server.log             # Production log file for ANSI highlighting & -n/-v
    ├── codebase/              # Nested Go project tree for recursive -r search
    └── pathological.txt       # ReDoS test input ("aaaaaaaaaaaaaaaaaaaaaaaaaaaa!")
```

> [!TIP]
> Download and extract `gorp.zip` once. Throughout each chapter, you'll solve micro-exercises in the browser editor and assemble them into your local codebase at the end-of-stage **Assembly Capstone (⭐)** milestones.

## Local Setup Guide

In your local terminal:

```bash
# 1. Download and extract the starter scaffold
unzip gorp.zip
cd gorp

# 2. Verify compilation
make build

# 3. Run the initial binary
./bin/gorp
```

---

## Problem Statement

In the editor on the right, update the entry point program to print `hello world` to standard output.
