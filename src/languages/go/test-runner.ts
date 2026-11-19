import {
  type FlatCanonicalTestCase,
  type CanonicalData,
  type CanonicalTypeDescriptor,
  type CanonicalMethodDescriptor,
  type CanonicalSignature,
  parseCanonicalSignature
} from '../canonical';

function inferScalarGoType(val: any): string {
  if (typeof val === 'boolean') return 'bool';
  if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float64';
  if (typeof val === 'string') return 'string';
  return 'interface{}';
}

function inferFieldType(key: string, cases: FlatCanonicalTestCase[], hint?: string): string {
  if (hint === 'tree') return '[]*int';
  if (hint === 'tree_node') return 'int';
  if (hint === 'linked_list' || hint === 'linked_list_cycle') return '[]int';
  if (hint === 'linked_list_array') return '[][]int';
  if (hint === 'graph') return '[][]int';
  if (hint === 'interval') return 'Interval';
  if (hint === 'interval_array') return '[]Interval';
  if (hint === 'byte_grid') return '[][]string';

  for (const c of cases) {
    const val = key === 'expected' ? c.expected : c.input?.[key];
    if (val !== undefined && val !== null) {
      if (Array.isArray(val)) {
        const hasNull = val.some((x) => x === null || x === undefined);
        if (hasNull) return '[]*int';
        if (val.length > 0) {
          if (Array.isArray(val[0])) {
            if (val[0].length > 0) {
              return `[][]${inferScalarGoType(val[0][0])}`;
            }
            return '[][]int';
          }
          return `[]${inferScalarGoType(val[0])}`;
        }
      } else {
        return inferScalarGoType(val);
      }
    }
  }
  return '[]int';
}

function formatGoLiteral(val: any, targetType: string, hint?: string): string {
  if (hint === 'tree' || targetType === '[]*int') {
    if (!Array.isArray(val) || val.length === 0) return '[]*int{}';
    const elts = val.map((x) => (x === null || x === undefined ? 'nil' : `MakeInt(${x})`));
    return `[]*int{${elts.join(', ')}}`;
  }
  if (val === null || val === undefined) return 'nil';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') {
    if (targetType === 'float64' && Number.isInteger(val)) return `${val}.0`;
    return String(val);
  }
  if (typeof val === 'string') return JSON.stringify(val);
  if (Array.isArray(val)) {
    if (targetType === '[]Interval') {
      if (val.length === 0) return '[]Interval{}';
      const ivs = val.map((iv: any) => `Interval{Start: ${iv[0]}, End: ${iv[1]}}`);
      return `[]Interval{${ivs.join(', ')}}`;
    }
    if (targetType === 'Interval') {
      return `Interval{Start: ${val[0]}, End: ${val[1]}}`;
    }
    if (targetType === '[][]interface{}') {
      if (val.length === 0) return '[][]interface{}{}';
      return `[][]interface{}{${val.map((row: any) => formatGoLiteral(row, '[]interface{}')).join(', ')}}`;
    }
    if (targetType === '[]interface{}') {
      if (val.length === 0) return '[]interface{}{}';
      return `[]interface{}{${val.map((x: any) => formatGoLiteral(x, 'interface{}')).join(', ')}}`;
    }
    if (targetType.startsWith('[][]')) {
      const innerType = targetType.slice(2);
      if (val.length === 0) return `${targetType}{}`;
      return `${targetType}{${val.map((row: any) => formatGoLiteral(row, innerType)).join(', ')}}`;
    }
    if (targetType.startsWith('[]')) {
      const elemType = targetType.slice(2);
      if (val.length === 0) return `${targetType}{}`;
      return `${targetType}{${val.map((x: any) => formatGoLiteral(x, elemType)).join(', ')}}`;
    }
    return `[]interface{}{${val.map((x: any) => formatGoLiteral(x, 'interface{}')).join(', ')}}`;
  }
  return JSON.stringify(val);
}

/**
 * Convert a CanonicalTypeDescriptor to its Go type representation.
 */
function toGoType(desc: CanonicalTypeDescriptor): string {
  switch (desc.kind) {
    case 'primitive':
      if (desc.type === 'int') return 'int';
      if (desc.type === 'int64') return 'int64';
      if (desc.type === 'uint32') return 'uint32';
      if (desc.type === 'float') return 'float64';
      if (desc.type === 'bool') return 'bool';
      if (desc.type === 'string') return 'string';
      return 'int';

    case 'array':
      return `[]${toGoType(desc.element)}`;

    case 'tree':
    case 'tree_node':
      return '*TreeNode';

    case 'linked_list':
    case 'linked_list_cycle':
      return '*ListNode';

    case 'linked_list_array':
      return '[]*ListNode';

    case 'graph':
      return '*Node';

    case 'interval':
      return 'Interval';

    case 'interval_array':
      return '[]Interval';

    case 'byte_grid':
      return '[][]byte';

    case 'void':
      return '';

    default:
      return 'interface{}';
  }
}

function toDefaultGoReturnValue(desc: CanonicalTypeDescriptor): string {
  switch (desc.kind) {
    case 'void':
      return '';
    case 'primitive':
      if (desc.type === 'bool') return 'return false';
      if (desc.type === 'int' || desc.type === 'int64' || desc.type === 'uint32') return 'return 0';
      if (desc.type === 'float') return 'return 0.0';
      if (desc.type === 'string') return 'return ""';
      return 'return 0';
    case 'interval':
      return 'return Interval{}';
    default:
      return 'return nil';
  }
}

/**
 * Generate starter template code for user editor conforming to the canonical contract.
 */
export function buildTemplateCode(meta: CanonicalData): string {
  const sig = parseCanonicalSignature(meta);

  if (sig.mode === 'operations') {
    const ctorParams = sig.parameters
      .map(p => `${p.name} ${toGoType(p.type)}`)
      .join(', ');

    const methodsCode = (sig.methods || [])
      .map(m => {
        const capitalized = m.name.charAt(0).toUpperCase() + m.name.slice(1);
        const paramList = m.parameters
          .map(p => `${p.name} ${toGoType(p.type)}`)
          .join(', ');
        const retType = toGoType(m.returnType);
        const retTypeStr = retType ? ` ${retType}` : '';
        const retStmt = toDefaultGoReturnValue(m.returnType);
        const body = retStmt ? `\t// Your code here\n\t${retStmt}` : '\t// Your code here';
        return `func (this *${sig.name}) ${capitalized}(${paramList})${retTypeStr} {\n${body}\n}`;
      })
      .join('\n\n');

    return `type ${sig.name} struct {
\t
}

func Constructor(${ctorParams}) ${sig.name} {
\treturn ${sig.name}{}
}

${methodsCode}
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

    const formatGoMethod = (m: CanonicalMethodDescriptor, receiverName?: string) => {
      const methodName = m.name.charAt(0).toUpperCase() + m.name.slice(1);
      const paramList = m.parameters
        .map(p => `${p.name} ${toGoType(p.type)}`)
        .join(', ');
      const retType = toGoType(m.returnType);
      const retTypeStr = retType ? ` ${retType}` : '';
      const retStmt = toDefaultGoReturnValue(m.returnType);
      const body = retStmt ? `\t// Your code here\n\t${retStmt}` : '\t// Your code here';
      const receiverPrefix = receiverName ? `(this *${receiverName}) ` : '';
      return `func ${receiverPrefix}${methodName}(${paramList})${retTypeStr} {\n${body}\n}`;
    };

    if (sig.receiver) {
      return `type ${sig.receiver} struct {
\t
}

func Constructor() ${sig.receiver} {
\treturn ${sig.receiver}{}
}

${formatGoMethod(innerFn, sig.receiver)}

${formatGoMethod(outerFn, sig.receiver)}
`;
    }

    return `${formatGoMethod(innerFn)}\n\n${formatGoMethod(outerFn)}\n`;
  }

  // Standard function
  const paramList = sig.parameters
    .map(p => `${p.name} ${toGoType(p.type)}`)
    .join(', ');
  const retType = toGoType(sig.returnType);
  const retTypeStr = retType ? ` ${retType}` : '';
  const retStmt = toDefaultGoReturnValue(sig.returnType);
  const body = retStmt ? `\t// Your code here\n\t${retStmt}` : '\t// Your code here';

  return `func ${sig.name}(${paramList})${retTypeStr} {\n${body}\n}\n`;
}

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

  const goFnName = sig.name;
  const inputKeys = sig.parameters.map(p => p.name);
  const hasInputs = inputKeys.length > 0;

  const fieldTypes: Record<string, string> = {};
  for (const k of inputKeys) {
    fieldTypes[k] = inferFieldType(k, cases, inputsMeta[k]);
  }
  const expType = inferFieldType('expected', cases, returns === 'tree' ? 'tree' : undefined);

  const structFields = [
    ...inputKeys.map((k) => `\t${k} ${fieldTypes[k]}`),
    `\texpected ${expType}`,
    `\tdesc string`
  ];

  const testCaseEntries = cases.map((c) => {
    const inputFields = inputKeys.map((k) => formatGoLiteral(c.input[k], fieldTypes[k], inputsMeta[k]));
    const expField = formatGoLiteral(c.expected, expType, returns === 'tree' ? 'tree' : undefined);
    const descField = JSON.stringify(c.description);
    return `\t{${[...inputFields, expField, descField].join(', ')}},`;
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
      callArgExprs.push(`MakeCycle(tc.${k}, tc.${pKey})`);
    } else if (type === 'tree') {
      callArgExprs.push(`ListToTree(tc.${k})`);
    } else if (type === 'tree_node') {
      callArgExprs.push(`&TreeNode{Val: tc.${k}}`);
    } else if (type === 'linked_list') {
      callArgExprs.push(`ListToLinkedList(tc.${k})`);
    } else if (type === 'linked_list_array') {
      callArgExprs.push(
        `func() []*ListNode { res := make([]*ListNode, len(tc.${k})); for i, l := range tc.${k} { res[i] = ListToLinkedList(l) }; return res }()`
      );
    } else if (type === 'graph') {
      callArgExprs.push(`BuildGraph(tc.${k})`);
    } else if (type === 'byte_grid') {
      callArgExprs.push(
        `func() [][]byte { b := make([][]byte, len(tc.${k})); for i, r := range tc.${k} { b[i] = make([]byte, len(r)); for j, s := range r { if len(s) > 0 { b[i][j] = s[0] } } }; return b }()`
      );
    } else {
      callArgExprs.push(`tc.${k}`);
    }
  }

  const callArgs = callArgExprs.join(', ');

  const msgFormat = 'tc.desc';

  // In-place mutation
  if (mutation?.target) {
    const targetIdx = inputKeys.indexOf(mutation.target);
    const targetKey = targetIdx !== -1 ? inputKeys[targetIdx] : inputKeys[0];
    const isLinkedList =
      inputsMeta[targetKey] === 'linked_list' ||
      inputsMeta[targetKey] === 'linked_list_cycle' ||
      returns === 'linked_list';

    if (isLinkedList) {
      return `testCases := []struct {
${structFields.join('\n')}
}{
${testCaseEntries.join('\n')}
}

for _, tc := range testCases {
\thead := ListToLinkedList(tc.${targetKey})
\t${goFnName}(head)
\tTests.EqualCheck(${msgFormat}, tc.expected, LinkedListToList(head))
}
`;
    }

    return `testCases := []struct {
${structFields.join('\n')}
}{
${testCaseEntries.join('\n')}
}

for _, tc := range testCases {
\ttargetVar := append(${fieldTypes[targetKey]}{}, tc.${targetKey}...)
\t${goFnName}(targetVar)
\tTests.EqualCheck(${msgFormat}, tc.expected, targetVar)
}
`;
  }

  // Result transformation
  let resTransform = 'res';
  if (returns === 'tree') {
    resTransform = 'TreeToList(res)';
  } else if (returns === 'tree_node') {
    resTransform = 'func() interface{} { if res == nil { return nil }; return res.Val }()';
  } else if (returns === 'linked_list') {
    resTransform = 'LinkedListToList(res)';
  } else if (returns === 'graph') {
    resTransform = 'GraphToAdj(res)';
  }

  // Assertion check
  let assertion = `Tests.EqualCheck(${msgFormat}, tc.expected, ${resTransform})`;
  if (comparison === 'unordered' || comparison === 'unordered_nested') {
    assertion = `Tests.UnorderedEqualCheck(${msgFormat}, tc.expected, ${resTransform})`;
  }

  return `testCases := []struct {
${structFields.join('\n')}
}{
${testCaseEntries.join('\n')}
}

for _, tc := range testCases {
\tres := ${goFnName}(${callArgs})
\t${assertion}
}
`;
}

function buildOperationsTestCode(cases: FlatCanonicalTestCase[], sig: CanonicalSignature): string {
  const caseBlocks = cases.map((c) => {
    const ops: string[] = c.input.operations || [];
    const args: any[][] = c.input.arguments || [];
    const exp: any[] = c.expected || [];
    const desc = JSON.stringify(c.description);

    const steps: string[] = [];
    steps.push(`\t// ${c.description}`);
    const ctorArgs = (args[0] || [])
      .map((a: any) => formatGoLiteral(a, typeof a === 'number' && !Number.isInteger(a) ? 'float64' : 'auto'))
      .join(', ');
    steps.push(`\tobj := Constructor(${ctorArgs})`);

    for (let i = 1; i < ops.length; i++) {
      const op = ops[i];
      const methodName = op.charAt(0).toUpperCase() + op.slice(1);
      const methodArgs = (args[i] || [])
        .map((a: any) => formatGoLiteral(a, typeof a === 'number' && !Number.isInteger(a) ? 'float64' : 'auto'))
        .join(', ');
      const expectedVal = exp[i];

      if (expectedVal === null || expectedVal === undefined) {
        steps.push(`\tobj.${methodName}(${methodArgs})`);
      } else {
        const expLit = formatGoLiteral(
          expectedVal,
          typeof expectedVal === 'number' ? 'float64' : 'auto'
        );
        const msg = JSON.stringify(c.description);
        steps.push(
          `\tTests.EqualCheck(${msg}, ${expLit}, obj.${methodName}(${methodArgs}))`
        );
      }
    }

    return `{\n${steps.join('\n')}\n}`;
  });

  return caseBlocks.join('\n\n') + '\n';
}

function buildComposeTestCode(cases: FlatCanonicalTestCase[], sig: CanonicalSignature): string {
  const [outerFn, innerFn] = sig.compose || ['decode', 'encode'];
  const receiver = sig.receiver;
  const returns = sig.returnType.kind;
  const inputsMeta = sig.parameters.reduce((acc, p) => {
    acc[p.name] = p.type.kind;
    return acc;
  }, {} as Record<string, string>);

  const inputKeys = sig.parameters.map(p => p.name);
  const fieldTypes: Record<string, string> = {};
  for (const k of inputKeys) {
    fieldTypes[k] = inferFieldType(k, cases, inputsMeta[k]);
  }
  const expType = inferFieldType('expected', cases, returns === 'tree' ? 'tree' : undefined);

  const structFields = [
    ...inputKeys.map((k) => `\t${k} ${fieldTypes[k]}`),
    `\texpected ${expType}`,
    `\tdesc string`
  ];

  const testCaseEntries = cases.map((c) => {
    const inputFields = inputKeys.map((k) => formatGoLiteral(c.input[k], fieldTypes[k], inputsMeta[k]));
    const expField = formatGoLiteral(c.expected, expType, returns === 'tree' ? 'tree' : undefined);
    const descField = JSON.stringify(c.description);
    return `\t{${[...inputFields, expField, descField].join(', ')}},`;
  });

  const callArgExprs = inputKeys.map((k) => {
    const type = inputsMeta[k];
    if (type === 'tree') return `ListToTree(tc.${k})`;
    if (type === 'linked_list') return `ListToLinkedList(tc.${k})`;
    return `tc.${k}`;
  });

  const callArgs = callArgExprs.join(', ');

  let resTransform = 'res';
  if (returns === 'tree') {
    resTransform = 'TreeToList(res)';
  } else if (returns === 'linked_list') {
    resTransform = 'LinkedListToList(res)';
  }

  const msgFormat = 'tc.desc';

  let instInit = '';
  let invocation = '';

  if (receiver) {
    instInit = `\tinst := &${receiver}{}\n`;
    const outerMethod = outerFn.charAt(0).toUpperCase() + outerFn.slice(1);
    const innerMethod = innerFn.charAt(0).toUpperCase() + innerFn.slice(1);
    invocation = `res := inst.${outerMethod}(inst.${innerMethod}(${callArgs}))`;
  } else {
    const outerMethod = outerFn.charAt(0).toUpperCase() + outerFn.slice(1);
    const innerMethod = innerFn.charAt(0).toUpperCase() + innerFn.slice(1);
    invocation = `res := ${outerMethod}(${innerMethod}(${callArgs}))`;
  }

  return `testCases := []struct {
${structFields.join('\n')}
}{
${testCaseEntries.join('\n')}
}

for _, tc := range testCases {
${instInit}\t${invocation}
\tTests.EqualCheck(${msgFormat}, tc.expected, ${resTransform})
}
`;
}
