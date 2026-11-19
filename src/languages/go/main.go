package main

import (
	"bytes"
	"fmt"
	"go/ast"
	"go/format"
	"go/parser"
	"go/scanner"
	"go/token"
	"regexp"
	"strconv"
	"strings"
	"syscall/js"

	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
)

func parseSnippet(fset *token.FileSet, filename, code string, allowDefaultPkg bool) (*ast.File, int, error) {
	file, err := parser.ParseFile(fset, filename, code, parser.ParseComments)
	if err == nil {
		return file, 0, nil
	}

	if allowDefaultPkg && strings.Contains(err.Error(), "expected 'package'") {
		wrappedCode := "package main\n" + code
		wrappedFile, wrappedErr := parser.ParseFile(fset, filename, wrappedCode, parser.ParseComments)
		if wrappedErr == nil {
			return wrappedFile, 1, nil
		}
		return nil, 1, wrappedErr
	}

	return nil, 0, err
}

func mergeGoAST(harness, userCode, testCode string) (string, error) {
	fset := token.NewFileSet()

	harnessFile, _, err := parseSnippet(fset, "harness.go", harness, false)
	if err != nil {
		return "", fmt.Errorf("harness parse error: %w", err)
	}

	userFile, _, err := parseSnippet(fset, "user.go", userCode, true)
	if err != nil {
		return "", fmt.Errorf("user code syntax error: %w", err)
	}

	var testFile *ast.File
	if strings.TrimSpace(testCode) != "" {
		testWrapped := "package main\n\nfunc main() {\n" + testCode + "\n}"
		tf, _, err := parseSnippet(fset, "test.go", testWrapped, false)
		if err != nil {
			return "", fmt.Errorf("test code syntax error: %w", err)
		}
		testFile = tf
	}

	// 1. Collect and deduplicate imports
	importMap := make(map[string]*ast.ImportSpec)
	addImports := func(f *ast.File) {
		if f == nil {
			return
		}
		for _, imp := range f.Imports {
			path := imp.Path.Value
			if _, exists := importMap[path]; !exists {
				importMap[path] = imp
			}
		}
	}
	addImports(harnessFile)
	addImports(userFile)
	if testFile != nil {
		addImports(testFile)
	}

	var importSpecs []ast.Spec
	for _, imp := range importMap {
		importSpecs = append(importSpecs, imp)
	}

	var mergedDecls []ast.Decl
	if len(importSpecs) > 0 {
		mergedDecls = append(mergedDecls, &ast.GenDecl{
			Tok:   token.IMPORT,
			Specs: importSpecs,
		})
	}

	// 2. Append declarations (excluding individual import declarations)
	appendDecls := func(f *ast.File) {
		if f == nil {
			return
		}
		for _, decl := range f.Decls {
			if gen, ok := decl.(*ast.GenDecl); ok && gen.Tok == token.IMPORT {
				continue
			}
			mergedDecls = append(mergedDecls, decl)
		}
	}

	appendDecls(harnessFile)
	appendDecls(userFile)
	if testFile != nil {
		appendDecls(testFile)
	}

	// 3. Collect comments
	var mergedComments []*ast.CommentGroup
	if harnessFile != nil {
		mergedComments = append(mergedComments, harnessFile.Comments...)
	}
	if userFile != nil {
		mergedComments = append(mergedComments, userFile.Comments...)
	}
	if testFile != nil {
		mergedComments = append(mergedComments, testFile.Comments...)
	}

	mergedFile := &ast.File{
		Name:     ast.NewIdent("main"),
		Decls:    mergedDecls,
		Comments: mergedComments,
	}

	var buf bytes.Buffer
	if err := format.Node(&buf, fset, mergedFile); err != nil {
		return "", fmt.Errorf("formatting merged AST error: %w", err)
	}

	return buf.String(), nil
}

func parseDiagnostics(err error, offsetLines int) []any {
	var diags []any
	if err == nil {
		return diags
	}

	if errList, ok := err.(scanner.ErrorList); ok {
		for _, e := range errList {
			line := e.Pos.Line - offsetLines
			if line < 1 {
				line = 1
			}
			diags = append(diags, map[string]any{
				"line":     line,
				"column":   e.Pos.Column,
				"message":  e.Msg,
				"severity": "error",
				"source":   "go",
			})
		}
		return diags
	}

	if sErr, ok := err.(scanner.Error); ok {
		line := sErr.Pos.Line - offsetLines
		if line < 1 {
			line = 1
		}
		diags = append(diags, map[string]any{
			"line":     line,
			"column":   sErr.Pos.Column,
			"message":  sErr.Msg,
			"severity": "error",
			"source":   "go",
		})
		return diags
	}

	diags = append(diags, map[string]any{
		"line":     1,
		"column":   1,
		"message":  err.Error(),
		"severity": "error",
		"source":   "go",
	})
	return diags
}

var errPosRegex = regexp.MustCompile(`(?m)(?:^|[^\w])(?:_|\w+\.go):(\d+):(\d+):\s*(.*)$`)

func parseEvalDiagnostics(errStr string) []any {
	var diags []any
	matches := errPosRegex.FindAllStringSubmatch(errStr, -1)
	for _, m := range matches {
		line, _ := strconv.Atoi(m[1])
		col, _ := strconv.Atoi(m[2])
		msg := strings.TrimSpace(m[3])
		if line < 1 {
			line = 1
		}
		if col < 1 {
			col = 1
		}
		diags = append(diags, map[string]any{
			"line":     line,
			"column":   col,
			"message":  msg,
			"severity": "error",
			"source":   "go",
		})
	}
	if len(diags) == 0 && strings.TrimSpace(errStr) != "" {
		diags = append(diags, map[string]any{
			"line":     1,
			"column":   1,
			"message":  strings.TrimSpace(errStr),
			"severity": "error",
			"source":   "go",
		})
	}
	return diags
}

func main() {
	c := make(chan struct{}, 0)

	js.Global().Set("yaegiRun", js.FuncOf(func(this js.Value, args []js.Value) (res any) {
		defer func() {
			if r := recover(); r != nil {
				res = map[string]any{
					"success": false,
					"output":  "",
					"error":   fmt.Sprintf("runtime panic: %v", r),
				}
			}
		}()

		if len(args) < 2 {
			return map[string]any{
				"success": false,
				"output":  "",
				"error":   "expected harness and userCode arguments",
			}
		}

		harness := args[0].String()
		userCode := args[1].String()
		testCode := ""
		if len(args) >= 3 {
			testCode = args[2].String()
		}

		combinedSource, err := mergeGoAST(harness, userCode, testCode)
		if err != nil {
			return map[string]any{
				"success": false,
				"output":  "",
				"error":   err.Error(),
			}
		}

		var stdoutBuf, stderrBuf bytes.Buffer
		i := interp.New(interp.Options{
			Stdout: &stdoutBuf,
			Stderr: &stderrBuf,
		})
		if err := i.Use(stdlib.Symbols); err != nil {
			return map[string]any{
				"success": false,
				"output":  "",
				"error":   fmt.Sprintf("failed to load stdlib: %v", err),
			}
		}

		_, err = i.Eval(combinedSource)
		outStr := stdoutBuf.String()
		errStr := stderrBuf.String()

		if err != nil {
			fullErr := err.Error()
			if errStr != "" && !strings.Contains(fullErr, errStr) {
				fullErr = fullErr + "\n" + errStr
			}
			return map[string]any{
				"success": false,
				"output":  outStr,
				"error":   fullErr,
			}
		}

		return map[string]any{
			"success": true,
			"output":  outStr,
			"error":   errStr,
		}
	}))

	js.Global().Set("yaegiLint", js.FuncOf(func(this js.Value, args []js.Value) (res any) {
		defer func() {
			if r := recover(); r != nil {
				res = []any{map[string]any{
					"line":     1,
					"column":   1,
					"message":  fmt.Sprintf("runtime panic: %v", r),
					"severity": "error",
					"source":   "go",
				}}
			}
		}()

		if len(args) < 2 {
			return []any{}
		}

		harness := args[0].String()
		userCode := args[1].String()

		if strings.TrimSpace(userCode) == "" {
			return []any{}
		}

		fset := token.NewFileSet()
		_, offsetLines, parseErr := parseSnippet(fset, "user.go", userCode, true)
		if parseErr != nil {
			return parseDiagnostics(parseErr, offsetLines)
		}

		combinedSource, mergeErr := mergeGoAST(harness, userCode, "")
		if mergeErr != nil {
			return []any{map[string]any{
				"line":     1,
				"column":   1,
				"message":  mergeErr.Error(),
				"severity": "error",
				"source":   "go",
			}}
		}

		var stdoutBuf, stderrBuf bytes.Buffer
		i := interp.New(interp.Options{
			Stdout: &stdoutBuf,
			Stderr: &stderrBuf,
		})
		_ = i.Use(stdlib.Symbols)

		_, evalErr := i.Eval(combinedSource)
		if evalErr != nil {
			return parseEvalDiagnostics(evalErr.Error())
		}

		return []any{}
	}))

	js.Global().Set("yaegiEval", js.FuncOf(func(this js.Value, args []js.Value) (res any) {
		defer func() {
			if r := recover(); r != nil {
				res = map[string]any{
					"success": false,
					"output":  "",
					"error":   fmt.Sprintf("runtime panic: %v", r),
				}
			}
		}()

		if len(args) == 0 {
			return map[string]any{
				"success": false,
				"output":  "",
				"error":   "no code provided",
			}
		}

		code := args[0].String()

		var stdoutBuf, stderrBuf bytes.Buffer
		i := interp.New(interp.Options{
			Stdout: &stdoutBuf,
			Stderr: &stderrBuf,
		})
		if err := i.Use(stdlib.Symbols); err != nil {
			return map[string]any{
				"success": false,
				"output":  "",
				"error":   fmt.Sprintf("failed to load stdlib: %v", err),
			}
		}

		_, err := i.Eval(code)
		outStr := stdoutBuf.String()
		errStr := stderrBuf.String()

		if err != nil {
			fullErr := err.Error()
			if errStr != "" && !strings.Contains(fullErr, errStr) {
				fullErr = fullErr + "\n" + errStr
			}
			return map[string]any{
				"success": false,
				"output":  outStr,
				"error":   fullErr,
			}
		}

		return map[string]any{
			"success": true,
			"output":  outStr,
			"error":   errStr,
		}
	}))

	js.Global().Set("initYaegi", js.FuncOf(func(this js.Value, args []js.Value) any {
		return true
	}))

	<-c
}
