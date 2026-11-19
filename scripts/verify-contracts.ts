#!/usr/bin/env node
/**
 * Static Contract & Compiler Verification Script
 * 
 * Validates:
 * 1. canonical-data.json schema validity across all exercises
 * 2. Signature and property parity between canonical-data.json, template.<ext>, and solution.<ext>
 * 3. Receiver class existence when canonical-data specifies "receiver"
 * 4. Test harness code generation across all enabled languages
 * 5. Structural and anti-pattern linting on generated test harnesses
 * 6. Live compiler/interpreter syntax-only verification of BOTH:
 *    - template.<ext> + testCode (ensures starter code compiles cleanly out of the box)
 *    - solution.<ext> + testCode (ensures reference solution compiles cleanly with tests)
 * 
 * Supports C++, C, Go, and Python compilers/linters.
 * 
 * Usage:
 *   npx tsx scripts/verify-contracts.ts [--exercise=<id>] [--lang=<id>]
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import {
  ROOT_DIR,
  EXERCISES_DIR,
  LANGUAGES_DIR,
  parseCliArgs,
  discoverLanguageModules,
  type LanguageModule
} from './lib/shared';

interface Violation {
  exerciseId: string;
  languageId?: string;
  type: 'SCHEMA' | 'SIGNATURE' | 'LINT' | 'GENERATOR' | 'TEMPLATE_COMPILER' | 'SOLUTION_COMPILER';
  message: string;
  file?: string;
}

const schemaPath = path.join(LANGUAGES_DIR, 'canonical-schema.json');
const canonicalSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

const VALID_INPUT_TYPES = new Set<string>(canonicalSchema.definitions.CanonicalInputType.enum);
const VALID_RETURN_TYPES = new Set<string>(canonicalSchema.definitions.CanonicalReturnType.enum);
const VALID_COMPARISON_TYPES = new Set<string>(canonicalSchema.definitions.ComparisonType.enum);
const VALID_MODES = new Set<string>(canonicalSchema.properties.mode.enum);

function validateCanonicalJson(exId: string, data: any, filePath: string): Violation[] {
  const violations: Violation[] = [];

  if (!data || typeof data !== 'object') {
    return [{ exerciseId: exId, type: 'SCHEMA', message: 'Root JSON is not an object', file: filePath }];
  }

  // 1. Validate top-level required properties
  if (data.exercise !== exId) {
    violations.push({
      exerciseId: exId,
      type: 'SCHEMA',
      message: `Property "exercise" (${JSON.stringify(data.exercise)}) does not match directory name "${exId}"`,
      file: filePath
    });
  }

  // 2. Validate mode
  if (data.mode && !VALID_MODES.has(data.mode)) {
    violations.push({
      exerciseId: exId,
      type: 'SCHEMA',
      message: `Invalid mode "${data.mode}". Must be one of: ${Array.from(VALID_MODES).join(', ')}`,
      file: filePath
    });
  }

  // 3. Validate returns
  if (data.returns && !VALID_RETURN_TYPES.has(data.returns)) {
    violations.push({
      exerciseId: exId,
      type: 'SCHEMA',
      message: `Invalid returns "${data.returns}". Must be one of: ${Array.from(VALID_RETURN_TYPES).join(', ')}`,
      file: filePath
    });
  }

  // 4. Validate comparison
  if (data.comparison && !VALID_COMPARISON_TYPES.has(data.comparison)) {
    violations.push({
      exerciseId: exId,
      type: 'SCHEMA',
      message: `Invalid comparison "${data.comparison}". Must be one of: ${Array.from(VALID_COMPARISON_TYPES).join(', ')}`,
      file: filePath
    });
  }

  // 5. Validate compose
  if (data.compose !== undefined) {
    if (!Array.isArray(data.compose) || data.compose.length !== 2 || typeof data.compose[0] !== 'string' || typeof data.compose[1] !== 'string') {
      violations.push({
        exerciseId: exId,
        type: 'SCHEMA',
        message: 'Field "compose" must be an array of exactly two function names [outer, inner]',
        file: filePath
      });
    }
  }

  // 6. Validate inputs
  if (data.inputs && typeof data.inputs === 'object') {
    for (const [k, v] of Object.entries(data.inputs)) {
      if (!VALID_INPUT_TYPES.has(v as string)) {
        violations.push({
          exerciseId: exId,
          type: 'SCHEMA',
          message: `Invalid input type "${v}" for parameter "${k}". Must be one of: ${Array.from(VALID_INPUT_TYPES).join(', ')}`,
          file: filePath
        });
      }
    }
  }

  // 7. Validate mutation
  if (data.mutation) {
    if (!data.mutation.target || typeof data.mutation.target !== 'string') {
      violations.push({
        exerciseId: exId,
        type: 'SCHEMA',
        message: 'Mutation definition must contain a string "target"',
        file: filePath
      });
    }
  }

  // 8. Validate cases array
  if (!Array.isArray(data.cases) || data.cases.length === 0) {
    violations.push({
      exerciseId: exId,
      type: 'SCHEMA',
      message: 'Field "cases" must be a non-empty array',
      file: filePath
    });
    return violations;
  }

  // 9. Recursively validate cases against CanonicalCase schema definitions
  function validateCase(c: any, pathStr: string) {
    if (!c || typeof c !== 'object') {
      violations.push({
        exerciseId: exId,
        type: 'SCHEMA',
        message: `Case at ${pathStr} is not an object`,
        file: filePath
      });
      return;
    }

    // Case Group
    if ('cases' in c) {
      if (typeof c.description !== 'string' || !c.description.trim()) {
        violations.push({
          exerciseId: exId,
          type: 'SCHEMA',
          message: `Case group at ${pathStr} missing required string "description"`,
          file: filePath
        });
      }
      if (!Array.isArray(c.cases) || c.cases.length === 0) {
        violations.push({
          exerciseId: exId,
          type: 'SCHEMA',
          message: `Case group at ${pathStr} must contain a non-empty "cases" array`,
          file: filePath
        });
      } else {
        c.cases.forEach((subCase: any, idx: number) => {
          validateCase(subCase, `${pathStr}.cases[${idx}]`);
        });
      }
      return;
    }

    // Leaf Test Case
    if (typeof c.description !== 'string' || !c.description.trim()) {
      violations.push({
        exerciseId: exId,
        type: 'SCHEMA',
        message: `Test case at ${pathStr} missing required string "description"`,
        file: filePath
      });
    }

    if (!c.input || typeof c.input !== 'object' || Array.isArray(c.input)) {
      violations.push({
        exerciseId: exId,
        type: 'SCHEMA',
        message: `Test case at ${pathStr} missing required object "input"`,
        file: filePath
      });
    }

    if (!('expected' in c)) {
      violations.push({
        exerciseId: exId,
        type: 'SCHEMA',
        message: `Test case at ${pathStr} missing required field "expected"`,
        file: filePath
      });
    }

    if (c.returns && !VALID_RETURN_TYPES.has(c.returns)) {
      violations.push({
        exerciseId: exId,
        type: 'SCHEMA',
        message: `Test case at ${pathStr} has invalid returns "${c.returns}"`,
        file: filePath
      });
    }

    if (c.comparison && !VALID_COMPARISON_TYPES.has(c.comparison)) {
      violations.push({
        exerciseId: exId,
        type: 'SCHEMA',
        message: `Test case at ${pathStr} has invalid comparison "${c.comparison}"`,
        file: filePath
      });
    }

    if (c.inputs && typeof c.inputs === 'object') {
      for (const [k, v] of Object.entries(c.inputs)) {
        if (!VALID_INPUT_TYPES.has(v as string)) {
          violations.push({
            exerciseId: exId,
            type: 'SCHEMA',
            message: `Test case at ${pathStr} has invalid input type "${v}" for parameter "${k}"`,
            file: filePath
          });
        }
      }
    }
  }

  data.cases.forEach((c: any, idx: number) => {
    validateCase(c, `cases[${idx}]`);
  });

  return violations;
}



function lintGeneratedTestCode(langId: string, testCode: string, exId: string): Violation[] {
  const violations: Violation[] = [];

  if (!testCode || !testCode.trim()) {
    violations.push({
      exerciseId: exId,
      languageId: langId,
      type: 'GENERATOR',
      message: 'Generated testCode is empty'
    });
    return violations;
  }

  if (langId === 'cpp') {
    // 1. Struct field with type void (e.g. void expected;)
    const voidFieldRegex = /\bvoid\s+[a-zA-Z0-9_]+\s*;/;
    if (voidFieldRegex.test(testCode)) {
      violations.push({
        exerciseId: exId,
        languageId: langId,
        type: 'LINT',
        message: 'Illegal struct field with type "void" in TestCase definition. Use proper expected type instead.'
      });
    }

    // 2. Check for std::to_string on vector or container identifiers
    const toStringVectorRegex = /std::to_string\s*\(\s*tc\.(?:nums|matrix|intervals|board|strs|words|edges|grid|head|root|lists)\b/g;
    if (toStringVectorRegex.test(testCode)) {
      violations.push({
        exerciseId: exId,
        languageId: langId,
        type: 'LINT',
        message: 'Illegal call to std::to_string() with vector/container. Use tc.desc or dedicated helper instead.'
      });
    }

    // 3. Check for literal null in arrays/expressions (e.g. {1, 2, null, 4})
    const rawNullRegex = /(?:[{,]\s*null\b|\bnull\s*[,}])/;
    if (rawNullRegex.test(testCode)) {
      violations.push({
        exerciseId: exId,
        languageId: langId,
        type: 'LINT',
        message: 'Undeclared identifier "null" found in C++ test code. Use std::nullopt or nullptr.'
      });
    }

    // 4. Check for C++ Most Vexing Parse in class instantiations: e.g. "PrefixTree obj();"
    const vexingParseRegex = /\b[A-Za-z0-9_]+\s+[a-zA-Z0-9_]+\s*\(\s*\)\s*;/;
    if (vexingParseRegex.test(testCode)) {
      violations.push({
        exerciseId: exId,
        languageId: langId,
        type: 'LINT',
        message: 'Most vexing parse detected: class instantiation with empty parentheses "Class obj();". Use "Class obj;" or "Class obj{};".'
      });
    }

    // 5. Check for string literal addition: e.g. "foo" + "bar"
    const strConcatRegex = /"[^"]*"\s*\+\s*"[^"]*"/;
    if (strConcatRegex.test(testCode)) {
      violations.push({
        exerciseId: exId,
        languageId: langId,
        type: 'LINT',
        message: 'Invalid operand to binary expression: string literal addition ("a" + "b").'
      });
    }

    // 6. Redundant/conflicting forward declaration of user function before main()
    const forwardDeclRegex = /\n(?:bool|int|void|std::string|std::vector<[^>]+>|TreeNode\*|ListNode\*)\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*;\s*\n\s*int\s+main/m;
    if (forwardDeclRegex.test(testCode)) {
      violations.push({
        exerciseId: exId,
        languageId: langId,
        type: 'LINT',
        message: 'Redundant forward declaration emitted in testCode. User code is prepended by worker, so forward declarations cause ambiguous overload errors.'
      });
    }
  }

  return violations;
}

function verifySignatureInCode(
  code: string,
  targetName: string,
  receiver: string | undefined,
  methods: { name: string }[] | undefined,
  langId: string,
  exId: string,
  fileName: string
): Violation[] {
  const violations: Violation[] = [];
  if (!code.trim()) return violations;

  let patternFound = false;

  if (langId === 'python') {
    patternFound = new RegExp(`\\b(?:def|class)\\s+${targetName}\\b`).test(code);
  } else if (langId === 'go') {
    const capitalized = targetName.charAt(0).toUpperCase() + targetName.slice(1);
    patternFound = new RegExp(`\\b(?:func|type)\\s+(?:\\([^)]*\\)\\s*)?(?:${targetName}|${capitalized})\\b`).test(code) ||
      new RegExp(`\\btype\\s+${targetName}\\b`, 'i').test(code);
  } else if (langId === 'cpp' || langId === 'c') {
    patternFound = new RegExp(`\\b(?:class|struct)?\\s*${targetName}\\s*(?:\\(|\\{)`).test(code) ||
      new RegExp(`\\b${targetName}\\s*\\(`).test(code);
  } else if (langId === 'typescript') {
    patternFound = new RegExp(`\\b(?:function|class|const|let)\\s+${targetName}\\b`).test(code);
  } else {
    patternFound = code.includes(targetName);
  }

  if (!patternFound) {
    violations.push({
      exerciseId: exId,
      languageId: langId,
      type: 'SIGNATURE',
      message: `Missing expected symbol "${targetName}" in ${fileName}`,
      file: fileName
    });
  }

  // If canonical-data specifies a receiver class (e.g. Solution, Codec), verify it exists
  if (receiver) {
    let receiverFound = false;
    if (langId === 'cpp' || langId === 'c') {
      receiverFound = new RegExp(`\\b(?:class|struct)\\s+${receiver}\\b`).test(code);
    } else if (langId === 'go') {
      receiverFound = new RegExp(`\\btype\\s+${receiver}\\s+struct\\b`).test(code);
    } else if (langId === 'python') {
      receiverFound = new RegExp(`\\bclass\\s+${receiver}\\b`).test(code);
    } else if (langId === 'typescript') {
      receiverFound = new RegExp(`\\bclass\\s+${receiver}\\b`).test(code);
    } else {
      receiverFound = code.includes(receiver);
    }

    if (!receiverFound) {
      violations.push({
        exerciseId: exId,
        languageId: langId,
        type: 'SIGNATURE',
        message: `Missing required receiver class "${receiver}" specified by canonical-data in ${fileName}`,
        file: fileName
      });
    }
  }

  // Verify that methods of a receiver class or composite function exist in code
  if (methods && methods.length > 0) {
    for (const method of methods) {
      let methodFound = false;
      if (langId === 'python') {
        methodFound = new RegExp(`\\bdef\\s+${method.name}\\b`).test(code);
      } else if (langId === 'go') {
        const capitalized = method.name.charAt(0).toUpperCase() + method.name.slice(1);
        methodFound = new RegExp(`\\bfunc\\s+(?:\\([^)]*\\)\\s*)?(?:${method.name}|${capitalized})\\b`).test(code);
      } else if (langId === 'cpp' || langId === 'c' || langId === 'typescript') {
        methodFound = new RegExp(`\\b${method.name}\\s*\\(`).test(code);
      } else {
        methodFound = code.includes(method.name);
      }

      if (!methodFound) {
        violations.push({
          exerciseId: exId,
          languageId: langId,
          type: 'SIGNATURE',
          message: `Missing required method "${method.name}" on receiver "${receiver || targetName}" in ${fileName}`,
          file: fileName
        });
      }
    }
  }

  return violations;
}

function verifyWithCompiler(
  langId: string,
  harnessCode: string | undefined,
  userCode: string,
  testCode: string,
  exId: string,
  targetType: 'TEMPLATE_COMPILER' | 'SOLUTION_COMPILER'
): Violation[] {
  const violations: Violation[] = [];

  if (langId === 'cpp') {
    const fullSource = (harnessCode ? harnessCode + '\n' : '') + userCode + '\n' + testCode;
    try {
      execSync('clang++ -fsyntax-only -std=c++20 -x c++ -', {
        input: fullSource,
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (err: any) {
      const stderr = err?.stderr?.toString() || err?.message || 'C++ compilation failed';
      const errors = stderr
        .split('\n')
        .filter((l: string) => l.includes('error:'))
        .slice(0, 2)
        .map((l: string) => l.replace(/<stdin>:\d+:\d+:\s*/, '').trim())
        .join(' | ');

      violations.push({
        exerciseId: exId,
        languageId: langId,
        type: targetType,
        message: errors || stderr.trim().split('\n')[0]
      });
    }
  } else if (langId === 'c') {
    const fullSource = (harnessCode ? harnessCode + '\n' : '') + userCode + '\n' + testCode;
    try {
      execSync('clang -fsyntax-only -std=c17 -x c -', {
        input: fullSource,
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (err: any) {
      const stderr = err?.stderr?.toString() || err?.message || 'C compilation failed';
      const errors = stderr
        .split('\n')
        .filter((l: string) => l.includes('error:'))
        .slice(0, 2)
        .map((l: string) => l.replace(/<stdin>:\d+:\d+:\s*/, '').trim())
        .join(' | ');

      violations.push({
        exerciseId: exId,
        languageId: langId,
        type: targetType,
        message: errors || stderr.trim().split('\n')[0]
      });
    }
  } else if (langId === 'python') {
    const fullSource = (harnessCode ? harnessCode + '\n' : '') + userCode + '\n' + testCode;
    try {
      execSync('python3 -c "import sys; compile(sys.stdin.read(), \\"<test>\\", \\"exec\\")"', {
        input: fullSource,
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (err: any) {
      const stderr = err?.stderr?.toString() || err?.message || 'Python syntax error';
      violations.push({
        exerciseId: exId,
        languageId: langId,
        type: targetType,
        message: stderr.trim().split('\n').pop() || 'Syntax error'
      });
    }
  } else if (langId === 'go') {
    let fullSource = userCode;
    if (!/^\s*package\s+[a-zA-Z0-9_]+/m.test(fullSource)) {
      fullSource = 'package main\n\n' + fullSource;
    }
    if (testCode && testCode.trim()) {
      fullSource += '\n\nfunc main() {\n' + testCode + '\n}\n';
    }
    try {
      execSync('gofmt -e', {
        input: fullSource,
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (err: any) {
      const stderr = err?.stderr?.toString() || err?.message || 'Go syntax error';
      const errors = stderr
        .split('\n')
        .filter((l: string) => l.includes(':'))
        .slice(0, 2)
        .map((l: string) => l.replace(/<standard input>:\d+:\d+:\s*/, '').trim())
        .join(' | ');

      violations.push({
        exerciseId: exId,
        languageId: langId,
        type: targetType,
        message: errors || stderr.trim().split('\n')[0]
      });
    }
  }

  return violations;
}

async function main() {
  const args = parseCliArgs();
  const { flattenCases, parseCanonicalSignature } = await import(`file://${path.join(LANGUAGES_DIR, 'canonical.ts')}`);

  if (args.exercise) {
    const targetCanonical = path.join(EXERCISES_DIR, args.exercise, 'canonical-data.json');
    if (!fs.existsSync(targetCanonical)) {
      console.error(`\x1b[31m[ERROR] Exercise '${args.exercise}' not found or missing canonical-data.json at: ${targetCanonical}\x1b[0m\n`);
      process.exit(1);
    }
  }

  const runners = await discoverLanguageModules(args.lang);
  if (runners.length === 0) {
    console.error(`\x1b[31m[ERROR] No active language runners found${args.lang ? ` matching '${args.lang}'` : ''}.\x1b[0m\n`);
    process.exit(1);
  }

  const exerciseDirs = fs.readdirSync(EXERCISES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(EXERCISES_DIR, d.name, 'canonical-data.json')))
    .map(d => d.name)
    .filter(name => !args.exercise || name === args.exercise);

  if (exerciseDirs.length === 0) {
    console.error(`\x1b[31m[ERROR] No exercises found with canonical-data.json.\x1b[0m\n`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(` DSA Contract & Compiler Verification`);
  console.log(` Checking ${exerciseDirs.length} exercise(s) across ${runners.length} language runner(s)`);
  console.log(`======================================================\n`);

  const allViolations: Violation[] = [];
  let totalTestsGenerated = 0;
  let totalTemplatesChecked = 0;
  let totalSolutionsChecked = 0;
  let totalCompilationsChecked = 0;

  for (const exId of exerciseDirs) {
    const exDir = path.join(EXERCISES_DIR, exId);
    const canonicalPath = path.join(exDir, 'canonical-data.json');

    let canonicalData: any;
    try {
      canonicalData = JSON.parse(fs.readFileSync(canonicalPath, 'utf-8'));
    } catch (err: any) {
      allViolations.push({
        exerciseId: exId,
        type: 'SCHEMA',
        message: `Failed to parse canonical-data.json: ${err?.message}`,
        file: canonicalPath
      });
      continue;
    }

    // 1. Validate canonical schema
    const schemaViolations = validateCanonicalJson(exId, canonicalData, canonicalPath);
    allViolations.push(...schemaViolations);

    const sig = parseCanonicalSignature(canonicalData);
    const targetSymbol = sig.name;
    const receiver = canonicalData.receiver;
    const flatCases = flattenCases(canonicalData.cases);

    // 2. Check templates, solutions, runner generation, and compilation per language
    for (const runner of runners) {
      const langDir = path.join(exDir, runner.id);
      const templatePath = path.join(langDir, `template${runner.extension}`);
      const solutionPath = path.join(langDir, `solution${runner.extension}`);

      let templateCode: string | undefined;
      if (fs.existsSync(templatePath)) {
        totalTemplatesChecked++;
        templateCode = fs.readFileSync(templatePath, 'utf-8');
        const tmplViolations = verifySignatureInCode(templateCode, targetSymbol, receiver, sig.methods, runner.id, exId, templatePath);
        allViolations.push(...tmplViolations);
      }

      let solutionCode: string | undefined;
      if (fs.existsSync(solutionPath)) {
        totalSolutionsChecked++;
        solutionCode = fs.readFileSync(solutionPath, 'utf-8');
        const solViolations = verifySignatureInCode(solutionCode, targetSymbol, receiver, sig.methods, runner.id, exId, solutionPath);
        allViolations.push(...solViolations);
      }

      // Generate testCode and lint it
      let testCode: string | undefined;
      if (!runner.buildTestCode) {
        allViolations.push({
          exerciseId: exId,
          languageId: runner.id,
          type: 'GENERATOR',
          message: `runner for '${runner.id}' does not export buildTestCode()`
        });
        continue;
      }
      try {
        testCode = runner.buildTestCode(flatCases, canonicalData);
        totalTestsGenerated++;
        const lintViolations = lintGeneratedTestCode(runner.id, testCode, exId);
        allViolations.push(...lintViolations);
      } catch (genErr: any) {
        allViolations.push({
          exerciseId: exId,
          languageId: runner.id,
          type: 'GENERATOR',
          message: `buildTestCode exception: ${genErr?.message || genErr}`
        });
      }

      // 3. Live Compiler Verification on TEMPLATE (starter code)
      if (templateCode && testCode) {
        totalCompilationsChecked++;
        const tmplCompViolations = verifyWithCompiler(runner.id, runner.harnessCode, templateCode, testCode, exId, 'TEMPLATE_COMPILER');
        allViolations.push(...tmplCompViolations);
      }

      // 4. Live Compiler Verification on SOLUTION (reference code)
      if (solutionCode && testCode) {
        totalCompilationsChecked++;
        const solCompViolations = verifyWithCompiler(runner.id, runner.harnessCode, solutionCode, testCode, exId, 'SOLUTION_COMPILER');
        allViolations.push(...solCompViolations);
      }
    }
  }

  // Report results
  console.log(`[Summary]`);
  console.log(`  - Exercises evaluated:      ${exerciseDirs.length}`);
  console.log(`  - Templates checked:        ${totalTemplatesChecked}`);
  console.log(`  - Solutions checked:        ${totalSolutionsChecked}`);
  console.log(`  - Test harnesses generated: ${totalTestsGenerated}`);
  console.log(`  - Compiler syntax checks:   ${totalCompilationsChecked}`);
  console.log();

  if (allViolations.length === 0) {
    console.log(`\x1b[32m✔ All contracts and compiler checks valid! Zero violations found.\x1b[0m\n`);
    process.exit(0);
  }

  console.log(`\x1b[31m✖ Found ${allViolations.length} contract/compiler violation(s):\x1b[0m\n`);

  // Group by exercise
  const grouped = new Map<string, Violation[]>();
  for (const v of allViolations) {
    const list = grouped.get(v.exerciseId) || [];
    list.push(v);
    grouped.set(v.exerciseId, list);
  }

  for (const [exId, list] of grouped) {
    console.log(`\x1b[1m[${exId}]\x1b[0m`);
    for (const v of list) {
      const tag = `[${v.type}]` + (v.languageId ? ` (${v.languageId})` : '');
      console.log(`  \x1b[31m${tag}\x1b[0m ${v.message}`);
    }
    console.log();
  }

  process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error during contract verification:', err);
  process.exit(1);
});
