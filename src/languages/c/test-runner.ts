import {
  type FlatCanonicalTestCase,
  type CanonicalData,
  type CanonicalTypeDescriptor,
  parseCanonicalSignature
} from '../canonical';

function inferCType(val: any, hint?: string): string {
  if (hint === 'tree') return 'int*';
  if (hint === 'tree_node') return 'int';
  if (hint === 'linked_list' || hint === 'linked_list_cycle') return 'int*';
  if (hint === 'linked_list_array') return 'int**';
  if (hint === 'graph') return 'int**';
  if (hint === 'interval') return 'Interval';
  if (hint === 'interval_array') return 'Interval*';

  if (typeof val === 'boolean') return 'bool';
  if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'double';
  if (typeof val === 'string') return 'const char*';
  if (Array.isArray(val)) {
    if (val.length === 0) return 'int*';
    if (typeof val[0] === 'string') return 'const char**';
    if (Array.isArray(val[0])) return 'int**';
    return 'int*';
  }
  return 'const char*';
}

function formatCLiteral(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return JSON.stringify(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return 'NULL';
    if (Array.isArray(val[0])) {
      const rows = val.map((r: any) => `(int[]){${r.join(', ')}}`);
      return `(int*[]){${rows.join(', ')}}`;
    }
    return `(int[]){${val.join(', ')}}`;
  }
  return JSON.stringify(val);
}

function getCAssertion(expected: any, comparison = 'exact', resExpr = 'res', hasExpLen = false): string {
  const expLenExpr = hasExpLen ? 'testCases[i].expected_len' : '0';
  if (comparison === 'unordered' || comparison === 'unordered_nested') {
    if (Array.isArray(expected) && expected.length > 0 && typeof expected[0] === 'string') {
      return `Tests.unordered_equal_check_str(msg, (char***)testCases[i].expected, NULL, ${expLenExpr}, (char***)${resExpr}, NULL, ${expLenExpr});`;
    }
    return `Tests.unordered_equal_check(msg, (int**)testCases[i].expected, NULL, ${expLenExpr}, (int**)${resExpr}, NULL, ${expLenExpr});`;
  }

  if (typeof expected === 'string') {
    return `Tests.equal_check_str(msg, testCases[i].expected, ${resExpr});`;
  }
  if (typeof expected === 'number') {
    return Number.isInteger(expected)
      ? `Tests.equal_check_int(msg, testCases[i].expected, ${resExpr});`
      : `Tests.equal_check_double(msg, testCases[i].expected, ${resExpr});`;
  }
  if (typeof expected === 'boolean') {
    return `Tests.bool_check(msg, ${resExpr} == testCases[i].expected);`;
  }
  if (Array.isArray(expected)) {
    if (expected.length > 0 && typeof expected[0] === 'number') {
      return `Tests.equal_check_int_arr(msg, testCases[i].expected, ${expLenExpr}, ${resExpr}, out_len);`;
    }
  }
  return `Tests.equal_check_str(msg, testCases[i].expected, ${resExpr});`;
}

function toCType(desc: CanonicalTypeDescriptor): string {
  switch (desc.kind) {
    case 'primitive':
      if (desc.type === 'int') return 'int';
      if (desc.type === 'int64') return 'long long';
      if (desc.type === 'uint32') return 'unsigned int';
      if (desc.type === 'float') return 'double';
      if (desc.type === 'bool') return 'bool';
      if (desc.type === 'string') return 'const char*';
      return 'int';

    case 'array':
      return `${toCType(desc.element)}*`;

    case 'tree':
    case 'tree_node':
      return 'TreeNode*';

    case 'linked_list':
    case 'linked_list_cycle':
      return 'ListNode*';

    case 'linked_list_array':
      return 'ListNode**';

    case 'graph':
      return 'Node*';

    case 'interval':
      return 'Interval';

    case 'interval_array':
      return 'Interval*';

    case 'void':
      return 'void';

    default:
      return 'int';
  }
}

function toDefaultCReturnValue(desc: CanonicalTypeDescriptor): string {
  switch (desc.kind) {
    case 'void':
      return '';
    case 'primitive':
      if (desc.type === 'bool') return 'return false;';
      if (desc.type === 'int' || desc.type === 'int64' || desc.type === 'uint32') return 'return 0;';
      if (desc.type === 'float') return 'return 0.0;';
      if (desc.type === 'string') return 'return "";';
      return 'return 0;';
    case 'array':
    case 'tree':
    case 'tree_node':
    case 'linked_list':
    case 'linked_list_cycle':
    case 'linked_list_array':
    case 'graph':
      return 'return NULL;';
    default:
      return 'return 0;';
  }
}

/**
 * Generate starter template code for user editor conforming to the canonical contract.
 */
export function buildTemplateCode(meta: CanonicalData): string {
  const sig = parseCanonicalSignature(meta);

  if (sig.mode === 'operations' || sig.mode === 'compose') {
    throw new Error(`C test runner does not support ${sig.mode} mode.`);
  }

  const paramList = sig.parameters.length > 0
    ? sig.parameters.map(p => `${toCType(p.type)} ${p.name}`).join(', ')
    : 'void';
  const retType = toCType(sig.returnType);
  const retStmt = toDefaultCReturnValue(sig.returnType);
  const body = retStmt ? `    // Your code here\n    ${retStmt}` : '    // Your code here';

  return `${retType} ${sig.name}(${paramList}) {\n${body}\n}\n`;
}

export function buildTestCode(cases: FlatCanonicalTestCase[], meta: CanonicalData): string {
  if (!cases.length) return '';

  const sig = parseCanonicalSignature(meta);

  if (sig.mode === 'operations' || sig.mode === 'compose') {
    throw new Error(`C test runner does not support ${sig.mode} mode.`);
  }

  const comparison = meta?.comparison || cases[0]?.comparison || 'exact';
  const returns = meta?.returns || cases[0]?.returns || 'standard';
  const inputsMeta = meta?.inputs || cases[0]?.inputs || {};
  const mutation = meta?.mutation || cases[0]?.mutation;

  const property = sig.name;
  const inputKeys = sig.parameters.map(p => p.name);
  const hasInputs = inputKeys.length > 0;

  const retType = inferCType(cases[0].expected, returns === 'tree' ? 'tree' : undefined);

  const structFields: string[] = [];
  const keyHasLen: Record<string, boolean> = {};

  for (const k of inputKeys) {
    const cType = inferCType(cases[0].input[k], inputsMeta[k]);
    structFields.push(`        ${cType} ${k};`);
    const isPtr = cType.endsWith('*') || Array.isArray(cases[0].input?.[k]);
    if (isPtr) {
      structFields.push(`        size_t ${k}_len;`);
      keyHasLen[k] = true;
    }
  }

  const expHasLen = retType.endsWith('*') || Array.isArray(cases[0].expected);
  structFields.push(`        ${retType} expected;`);
  if (expHasLen) {
    structFields.push(`        size_t expected_len;`);
  }
  structFields.push(`        const char* desc;`);

  const testCaseEntries = cases.map((c) => {
    const fields: string[] = [];
    for (const k of inputKeys) {
      fields.push(formatCLiteral(c.input[k]));
      if (keyHasLen[k]) {
        const len = Array.isArray(c.input[k]) ? c.input[k].length : 0;
        fields.push(String(len));
      }
    }
    fields.push(formatCLiteral(c.expected));
    if (expHasLen) {
      const len = Array.isArray(c.expected) ? c.expected.length : 0;
      fields.push(String(len));
    }
    fields.push(JSON.stringify(c.description));
    return `        {${fields.join(', ')}},`;
  });

  const cycleKey = inputKeys.find((k) => inputsMeta[k] === 'linked_list_cycle');
  const posKey = cycleKey
    ? (inputKeys.find((k) => k === 'pos' || k === `${cycleKey}_pos` || k === `${cycleKey}Pos`) ||
       (inputKeys.length === 2 ? inputKeys.find((k) => k !== cycleKey) : undefined))
    : undefined;

  const callArgExprs: string[] = [];
  for (const k of inputKeys) {
    if (k === posKey && cycleKey) continue;
    const type = inputsMeta[k];
    if (type === 'linked_list_cycle') {
      const pKey = posKey || 'pos';
      callArgExprs.push(`make_cycle(testCases[i].${k}, testCases[i].${k}_len, testCases[i].${pKey})`);
    } else if (type === 'linked_list') {
      callArgExprs.push(`list_to_linked_list(testCases[i].${k}, testCases[i].${k}_len)`);
    } else if (type === 'tree') {
      callArgExprs.push(`ints_to_tree(testCases[i].${k}, testCases[i].${k}_len)`);
    } else if (type === 'graph') {
      callArgExprs.push(`build_graph(testCases[i].${k}, NULL, testCases[i].${k}_len)`);
    } else {
      callArgExprs.push(`testCases[i].${k}`);
    }
  }

  const callArgs = callArgExprs.join(', ');

  const msgFormat = `const char* msg = testCases[i].desc;`;

  let resTransform = 'res';
  let outLenDecl = '';
  if (returns === 'tree') {
    resTransform = 'tree_to_ints(res, &out_len)';
    outLenDecl = '        int out_len = 0;\n';
  } else if (returns === 'tree_node') {
    resTransform = 'res ? res->val : -1';
  } else if (returns === 'linked_list') {
    resTransform = 'linked_list_to_list(res, &out_len)';
    outLenDecl = '        int out_len = 0;\n';
  } else if (returns === 'graph') {
    resTransform = 'graph_to_adj(res, &out_row_size, &out_col_sizes)';
    outLenDecl = '        int out_row_size = 0;\n        int* out_col_sizes = NULL;\n';
  }

  const assertion = getCAssertion(cases[0].expected, comparison, resTransform, expHasLen);

  // In-place mutation
  if (mutation?.target) {
    const targetIdx = inputKeys.indexOf(mutation.target);
    const targetKey = targetIdx !== -1 ? inputKeys[targetIdx] : inputKeys[0];
    const targetType = inferCType(cases[0].input[targetKey], inputsMeta[targetKey]);
    const postTransform =
      returns === 'linked_list' ? 'linked_list_to_list(targetVar, &out_len)' : 'targetVar';
    return `#include <stdio.h>
#include <stdbool.h>

void ${property}(${targetType});

int main() {
    struct TestCase {
${structFields.join('\n')}
    } testCases[] = {
${testCaseEntries.join('\n')}
    };

    int numTests = sizeof(testCases) / sizeof(testCases[0]);
    for (int i = 0; i < numTests; i++) {
${outLenDecl}        ${targetType} targetVar = testCases[i].${targetKey};
        ${property}(targetVar);
        ${msgFormat}
        ${getCAssertion(cases[0].expected, comparison, postTransform, expHasLen)}
    }

    return 0;
}
`;
  }

  return `#include <stdio.h>
#include <stdbool.h>

${retType} ${property}(${hasInputs ? inputKeys.map((k) => `${inferCType(cases[0].input[k], inputsMeta[k])} ${k}`).join(', ') : 'void'});

int main() {
    struct TestCase {
${structFields.join('\n')}
    } testCases[] = {
${testCaseEntries.join('\n')}
    };

    int numTests = sizeof(testCases) / sizeof(testCases[0]);
    for (int i = 0; i < numTests; i++) {
${outLenDecl}        ${retType} res = ${property}(${callArgs});
        ${msgFormat}
        ${assertion}
    }

    return 0;
}
`;
}
