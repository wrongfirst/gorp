import {
  type FlatCanonicalTestCase,
  type CanonicalData,
  type CanonicalTypeDescriptor,
  type CanonicalMethodDescriptor,
  type CanonicalSignature,
  parseCanonicalSignature,
  inferCanonicalType
} from '../canonical';

/**
 * Convert a CanonicalTypeDescriptor to its C++ type representation.
 */
function toCppType(desc: CanonicalTypeDescriptor, isParam: boolean, isMutation = false): string {
  switch (desc.kind) {
    case 'primitive':
      if (desc.type === 'int') return 'int';
      if (desc.type === 'int64') return 'long long';
      if (desc.type === 'uint32') return 'uint32_t';
      if (desc.type === 'float') return 'double';
      if (desc.type === 'bool') return 'bool';
      if (desc.type === 'string') return isParam ? 'const std::string&' : 'std::string';
      return 'int';

    case 'array': {
      const elemType = toCppType(desc.element, false);
      if (isMutation) return `std::vector<${elemType}>&`;
      if (isParam) return `const std::vector<${elemType}>&`;
      return `std::vector<${elemType}>`;
    }

    case 'tree':
    case 'tree_node':
      return 'TreeNode*';

    case 'linked_list':
    case 'linked_list_cycle':
      return 'ListNode*';

    case 'linked_list_array':
      return 'std::vector<ListNode*>&';

    case 'graph':
      return 'Node*';

    case 'interval':
      return isParam ? 'const Interval&' : 'Interval';

    case 'interval_array':
      return isParam ? 'const std::vector<Interval>&' : 'std::vector<Interval>';

    case 'byte_grid':
      return isParam ? 'std::vector<std::vector<char>>&' : 'std::vector<std::vector<char>>';

    case 'void':
      return 'void';

    default:
      return 'int';
  }
}

/**
 * Type of field stored inside struct TestCase in generated test harness.
 */
function toCppStructFieldType(desc: CanonicalTypeDescriptor): string {
  switch (desc.kind) {
    case 'tree':
      return 'std::vector<std::optional<int>>';
    case 'tree_node':
      return 'int';
    case 'linked_list':
    case 'linked_list_cycle':
      return 'std::vector<int>';
    case 'linked_list_array':
      return 'std::vector<std::vector<int>>';
    case 'graph':
      return 'std::vector<std::vector<int>>';
    case 'interval':
      return 'std::vector<int>';
    case 'interval_array':
      return 'std::vector<std::vector<int>>';
    case 'byte_grid':
      return 'std::vector<std::vector<std::string>>';
    default:
      return toCppType(desc, false);
  }
}

/**
 * Default return value expression for starter template code.
 */
function toDefaultReturnValue(desc: CanonicalTypeDescriptor): string {
  switch (desc.kind) {
    case 'primitive':
      if (desc.type === 'bool') return 'return false;';
      if (desc.type === 'int' || desc.type === 'int64' || desc.type === 'uint32' || desc.type === 'float') return 'return 0;';
      if (desc.type === 'string') return 'return "";';
      return 'return 0;';

    case 'array':
    case 'interval_array':
      return 'return {};';

    case 'tree':
    case 'tree_node':
    case 'linked_list':
    case 'linked_list_cycle':
    case 'graph':
      return 'return nullptr;';

    case 'void':
      return '';

    default:
      return 'return 0;';
  }
}

/**
 * Format a JSON value into a valid C++ literal.
 */
function formatCppLiteral(val: any, isTree = false): string {
  if (val === null || val === undefined) {
    return isTree ? 'std::nullopt' : 'nullptr';
  }
  if (typeof val === 'boolean') {
    return val ? 'true' : 'false';
  }
  if (typeof val === 'number') {
    if (val < -2147483648 || val > 4294967295) {
      return `${val}LL`;
    }
    if (val > 2147483647) {
      return `${val}ULL`;
    }
    return String(val);
  }
  if (typeof val === 'string') {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    if (isTree) {
      return `{${val.map(x => formatCppLiteral(x, true)).join(', ')}}`;
    }
    return `{${val.map(x => formatCppLiteral(x, false)).join(', ')}}`;
  }
  return JSON.stringify(val);
}

/**
 * Generate starter template code for user editor conforming to the canonical contract.
 */
export function buildTemplateCode(meta: CanonicalData): string {
  const sig = parseCanonicalSignature(meta);

  const includes = new Set<string>();

  function collectIncludes(desc: CanonicalTypeDescriptor) {
    if (desc.kind === 'primitive' && desc.type === 'string') includes.add('#include <string>');
    if (desc.kind === 'array') includes.add('#include <vector>');
    if (desc.kind === 'linked_list_array') includes.add('#include <vector>');
    if (desc.kind === 'interval_array') includes.add('#include <vector>');
    if (desc.kind === 'byte_grid') {
      includes.add('#include <vector>');
      includes.add('#include <string>');
    }
    if (desc.kind === 'array') collectIncludes(desc.element);
  }

  for (const p of sig.parameters) collectIncludes(p.type);
  collectIncludes(sig.returnType);
  for (const m of sig.methods) {
    for (const p of m.parameters) collectIncludes(p.type);
    collectIncludes(m.returnType);
  }

  const includeBlock = includes.size > 0 ? Array.from(includes).sort().join('\n') + '\n\n' : '';

  if (sig.mode === 'operations') {
    const ctorParams = sig.parameters
      .map(p => `${toCppType(p.type, true)} ${p.name}`)
      .join(', ');

    const methodsCode = sig.methods
      .map(m => {
        const params = m.parameters.map(p => `${toCppType(p.type, true)} ${p.name}`).join(', ');
        const retType = toCppType(m.returnType, false);
        const retStmt = toDefaultReturnValue(m.returnType);
        const body = retStmt ? `        // Your code here\n        ${retStmt}` : '        // Your code here';
        return `    ${retType} ${m.name}(${params}) {\n${body}\n    }`;
      })
      .join('\n\n');

    return `${includeBlock}class ${sig.name} {
public:
    ${sig.name}(${ctorParams}) {
        // Your code here
    }

${methodsCode}
};
`;
  }

  if (sig.mode === 'compose') {
    const innerFn = sig.innerFunction || {
      name: sig.compose?.[1] || 'encode',
      parameters: sig.parameters,
      returnType: { kind: 'primitive', type: 'string' as const }
    };
    const outerFn = sig.outerFunction || {
      name: sig.compose?.[0] || 'decode',
      parameters: [
        {
          name: (sig.compose?.[0] || 'decode') === 'decode' ? 's' : 'data',
          type: { kind: 'primitive', type: 'string' as const },
          isMutationTarget: false
        }
      ],
      returnType: sig.returnType
    };

    const formatMethod = (m: CanonicalMethodDescriptor, indent: string) => {
      const paramList = m.parameters
        .map(p => `${toCppType(p.type, true, p.isMutationTarget)} ${p.name}`)
        .join(', ');
      const retType = toCppType(m.returnType, false);
      const retStmt = toDefaultReturnValue(m.returnType);
      const body = retStmt ? `${indent}    // Your code here\n${indent}    ${retStmt}` : `${indent}    // Your code here`;
      return `${indent}${retType} ${m.name}(${paramList}) {\n${body}\n${indent}}`;
    };

    if (sig.receiver) {
      const innerCode = formatMethod(innerFn, '    ');
      const outerCode = formatMethod(outerFn, '    ');
      return `${includeBlock}class ${sig.receiver} {
public:
${innerCode}

${outerCode}
};
`;
    }

    const innerCode = formatMethod(innerFn, '');
    const outerCode = formatMethod(outerFn, '');
    return `${includeBlock}${innerCode}\n\n${outerCode}\n`;
  }

  // Standard function
  const paramList = sig.parameters
    .map(p => `${toCppType(p.type, true, p.isMutationTarget)} ${p.name}`)
    .join(', ');
  const retType = toCppType(sig.returnType, false);
  const retStmt = toDefaultReturnValue(sig.returnType);
  const body = retStmt ? `    // Your code here\n    ${retStmt}` : '    // Your code here';

  return `${includeBlock}${retType} ${sig.name}(${paramList}) {
${body}
}
`;
}

/**
 * Generate test harness code calling the canonical function/class.
 */
export function buildTestCode(cases: FlatCanonicalTestCase[], meta: CanonicalData): string {
  if (!cases.length) return '';

  const sig = parseCanonicalSignature(meta);

  if (sig.mode === 'operations') {
    return buildOperationsTestCode(cases, sig);
  }

  if (sig.mode === 'compose') {
    return buildComposeTestCode(cases, sig);
  }

  const comparison = meta?.comparison || cases[0]?.comparison || 'exact';
  const returns = meta?.returns || cases[0]?.returns || 'standard';
  const inputsMeta = meta?.inputs || cases[0]?.inputs || {};
  const mutation = meta?.mutation || cases[0]?.mutation;

  const property = sig.name;
  const inputKeys = sig.parameters.map(p => p.name);

  const expectedTypeDesc = mutation?.target
    ? inferCanonicalType(cases[0].expected)
    : (returns === 'tree_node' ? { kind: 'primitive', type: 'int' } as const : sig.returnType);

  const structFields = [
    ...sig.parameters.map(p => `        ${toCppStructFieldType(p.type)} ${p.name};`),
    `        ${toCppStructFieldType(expectedTypeDesc)} expected;`,
    `        std::string desc;`
  ];

  const testCaseEntries = cases.map((c) => {
    const inputs = sig.parameters.map((p) => formatCppLiteral(c.input[p.name], p.type.kind === 'tree'));
    const exp = formatCppLiteral(c.expected, sig.returnType.kind === 'tree');
    const desc = JSON.stringify(c.description);
    return `        {${[...inputs, exp, desc].join(', ')}},`;
  });

  const cycleKey = inputKeys.find((k) => inputsMeta[k] === 'linked_list_cycle');
  const posKey = cycleKey
    ? (inputKeys.find((k) => k === 'pos' || k === `${cycleKey}_pos` || k === `${cycleKey}Pos`) ||
       (inputKeys.length === 2 ? inputKeys.find((k) => k !== cycleKey) : undefined))
    : undefined;

  const prepStatements: string[] = [];
  const callArgExprs: string[] = [];

  for (const p of sig.parameters) {
    const k = p.name;
    if (k === posKey && cycleKey) continue;
    const type = inputsMeta[k];

    if (type === 'linked_list_cycle') {
      const pKey = posKey || 'pos';
      callArgExprs.push(`make_cycle(tc.${k}, tc.${pKey})`);
    } else if (type === 'tree') {
      callArgExprs.push(`list_to_tree(tc.${k})`);
    } else if (type === 'tree_node') {
      callArgExprs.push(`new TreeNode(tc.${k})`);
    } else if (type === 'linked_list') {
      callArgExprs.push(`list_to_linked_list(tc.${k})`);
    } else if (type === 'linked_list_array') {
      const varName = `${k}ListVal`;
      prepStatements.push(
        `        auto ${varName} = [&]() { std::vector<ListNode*> v; for (const auto& l : tc.${k}) v.push_back(list_to_linked_list(l)); return v; }();`
      );
      callArgExprs.push(varName);
    } else if (type === 'interval') {
      callArgExprs.push(`Interval(tc.${k}[0], tc.${k}[1])`);
    } else if (type === 'interval_array') {
      const varName = `${k}IntervalsVal`;
      prepStatements.push(
        `        auto ${varName} = [&]() { std::vector<Interval> v; for (const auto& i : tc.${k}) v.push_back(Interval(i[0], i[1])); return v; }();`
      );
      callArgExprs.push(varName);
    } else if (type === 'graph') {
      callArgExprs.push(`build_graph(tc.${k})`);
    } else if (type === 'byte_grid') {
      const varName = `${k}CharGrid`;
      prepStatements.push(
        `        auto ${varName} = [&]() { std::vector<std::vector<char>> g; for (const auto& row : tc.${k}) { std::vector<char> r; for (const auto& s : row) r.push_back(s.empty() ? ' ' : s[0]); g.push_back(r); } return g; }();`
      );
      callArgExprs.push(varName);
    } else {
      callArgExprs.push(`tc.${k}`);
    }
  }

  const callArgs = callArgExprs.join(', ');
  const msgExpr = 'tc.desc';

  // In-place mutation handling
  if (mutation?.target) {
    const targetKey = mutation.target;
    const isLinkedList = inputsMeta[targetKey] === 'linked_list';
    const isByteGrid = inputsMeta[targetKey] === 'byte_grid';

    let targetInit = `        auto targetVar = tc.${targetKey};`;
    let postTransform = `targetVar`;

    if (isLinkedList) {
      targetInit = `        auto targetVar = list_to_linked_list(tc.${targetKey});`;
      postTransform = `linked_list_to_list(targetVar)`;
    } else if (isByteGrid) {
      targetInit = `        auto targetVar = [&]() { std::vector<std::vector<char>> g; for (const auto& row : tc.${targetKey}) { std::vector<char> r; for (const auto& s : row) r.push_back(s.empty() ? ' ' : s[0]); g.push_back(r); } return g; }();`;
      postTransform = `targetVar`;
    }

    // Secondary parameter prep statements (exclude targetKey since it is initialized in targetInit)
    const secondaryPrep = prepStatements
      .filter(stmt => !stmt.includes(`${targetKey}CharGrid`) && !stmt.includes(`${targetKey}ListVal`) && !stmt.includes(`${targetKey}IntervalsVal`))
      .join('\n');
    const prepBlock = secondaryPrep ? secondaryPrep + '\n' : '';

    const mutationArgs = sig.parameters
      .map((p, idx) => (p.name === targetKey ? 'targetVar' : callArgExprs[idx]))
      .join(', ');

    return `#include <iostream>
#include <string>
#include <vector>
#include <optional>

int main() {
    struct TestCase {
${structFields.join('\n')}
    };

    std::vector<TestCase> testCases = {
${testCaseEntries.join('\n')}
    };

    // In mutation mode, tc is accessed by const reference while the mutation target is copied into targetVar
    for (const auto& tc : testCases) {
${prepBlock}${targetInit}
        ${property}(${mutationArgs});
        std::string msg = ${msgExpr};
        Tests.equal_check(msg, tc.expected, ${postTransform});
    }

    return 0;
}
`;
  }

  let resTransform = 'res';
  if (returns === 'tree') resTransform = 'tree_to_list(res)';
  else if (returns === 'tree_node') resTransform = 'res ? res->val : -1';
  else if (returns === 'linked_list') resTransform = 'linked_list_to_list(res)';
  else if (returns === 'graph') resTransform = 'graph_to_adj(res)';

  let assertion = `Tests.equal_check(msg, tc.expected, ${resTransform});`;
  if (comparison === 'unordered' || comparison === 'unordered_nested') {
    assertion = `Tests.unordered_equal_check(msg, tc.expected, ${resTransform});`;
  }

  const prepBlock = prepStatements.length > 0 ? prepStatements.join('\n') + '\n' : '';

  return `#include <iostream>
#include <string>
#include <vector>
#include <optional>

int main() {
    struct TestCase {
${structFields.join('\n')}
    };

    std::vector<TestCase> testCases = {
${testCaseEntries.join('\n')}
    };

    for (auto& tc : testCases) {
${prepBlock}        auto res = ${property}(${callArgs});
        std::string msg = ${msgExpr};
        ${assertion}
    }

    return 0;
}
`;
}

function buildOperationsTestCode(cases: FlatCanonicalTestCase[], sig: CanonicalSignature): string {
  const caseBlocks = cases.map((c) => {
    const ops: string[] = c.input.operations || [];
    const args: any[][] = c.input.arguments || [];
    const exp: any[] = c.expected || [];

    const steps: string[] = [];
    steps.push(`        // ${c.description}`);
    const ctorArgs = (args[0] || []).map(a => formatCppLiteral(a, false)).join(', ');
    const clsName = ops[0];

    // FIX: Avoid most-vexing-parse when ctorArgs is empty
    if (ctorArgs.trim()) {
      steps.push(`        ${clsName} obj(${ctorArgs});`);
    } else {
      steps.push(`        ${clsName} obj;`);
    }

    for (let i = 1; i < ops.length; i++) {
      const op = ops[i];
      const methodArgs = (args[i] || []).map(a => formatCppLiteral(a, false)).join(', ');
      const expectedVal = exp[i];

      if (expectedVal === null || expectedVal === undefined) {
        steps.push(`        obj.${op}(${methodArgs});`);
      } else {
        const expLit = formatCppLiteral(expectedVal, false);
        const msg = JSON.stringify(c.description);
        steps.push(
          `        Tests.equal_check(${msg}, ${expLit}, obj.${op}(${methodArgs}));`
        );
      }
    }

    return `    {\n${steps.join('\n')}\n    }`;
  });

  return `#include <iostream>
#include <string>
#include <vector>

int main() {
${caseBlocks.join('\n\n')}
    return 0;
}
`;
}

function buildComposeTestCode(cases: FlatCanonicalTestCase[], sig: CanonicalSignature): string {
  const [outerFn, innerFn] = sig.compose || ['decode', 'encode'];
  const returns = sig.returnType.kind;

  const structFields = [
    ...sig.parameters.map((p) => `        ${toCppStructFieldType(p.type)} ${p.name};`),
    `        ${toCppStructFieldType(sig.returnType)} expected;`,
    `        std::string desc;`
  ];

  const testCaseEntries = cases.map((c) => {
    const inputs = sig.parameters.map((p) => formatCppLiteral(c.input[p.name], p.type.kind === 'tree'));
    const exp = formatCppLiteral(c.expected, sig.returnType.kind === 'tree');
    const desc = JSON.stringify(c.description);
    return `        {${[...inputs, exp, desc].join(', ')}},`;
  });

  const callArgs = sig.parameters.map((p) => {
    if (p.type.kind === 'tree') return `list_to_tree(tc.${p.name})`;
    if (p.type.kind === 'linked_list') return `list_to_linked_list(tc.${p.name})`;
    return `tc.${p.name}`;
  }).join(', ');

  let resTransform = 'res';
  if (returns === 'tree') resTransform = 'tree_to_list(res)';
  else if (returns === 'linked_list') resTransform = 'linked_list_to_list(res)';

  const msgExpr = 'tc.desc';

  const invocation = sig.receiver
    ? `        ${sig.receiver} inst;\n        auto res = inst.${outerFn}(inst.${innerFn}(${callArgs}));`
    : `        auto res = ${outerFn}(${innerFn}(${callArgs}));`;

  return `#include <iostream>
#include <string>
#include <vector>
#include <optional>

int main() {
    struct TestCase {
${structFields.join('\n')}
    };

    std::vector<TestCase> testCases = {
${testCaseEntries.join('\n')}
    };

    for (const auto& tc : testCases) {
${invocation}
        std::string msg = ${msgExpr};
        Tests.equal_check(msg, tc.expected, ${resTransform});
    }

    return 0;
}
`;
}
