Let's set up your local development environment and workspace. 

## Recommended Project Structure

When developing command-line utilities locally, organizing your project layout makes compilation, testing, and distribution straightforward.

```text
gorp/
├── bin/              # Directory for compiled binaries
│   └── gorp          # Built executable binary
├── go.mod            # Go module definition
└── main.go           # CLI entry point
```

## Local Setup Guide

Follow these steps in your terminal to set up your project locally:

### 1. Create a Project Directory
```bash
mkdir gorp
cd gorp
```

### 2. Initialize the Go Module
```bash
go mod init gorp
```

### 3. Create the Binary Directory
Create a dedicated `bin/` folder where compiled binaries will be placed:
```bash
mkdir -p bin
```

### 4. Create `main.go`
Create `main.go` at the root of your project as the entry point for the CLI:
```go
package main

import "fmt"

func main() {
    fmt.Println("hello world")
}
```

### 5. Build and Run Your Binary
Compile the binary directly into the `bin/` folder:
```bash
go build -o bin/gorp main.go
```

Run your newly compiled binary:
```bash
./bin/gorp
```

Output:
```text
hello world
```

---

## Problem Statement

In the editor on the right, update the entry point program to print `hello world` to standard output.
