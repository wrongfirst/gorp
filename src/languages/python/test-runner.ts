import {
  type FlatCanonicalTestCase,
  type CanonicalData,
  type CanonicalTypeDescriptor,
  type CanonicalMethodDescriptor,
  type CanonicalSignature,
  parseCanonicalSignature
} from '../canonical';

function escapePyString(str: string): string {
  return JSON.stringify(str);
}

function formatPyValue(val: any): string {
  if (val === null || val === undefined) return 'None';
  if (typeof val === 'boolean') return val ? 'True' : 'False';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return escapePyString(val);
  if (Array.isArray(val)) {
    return `[${val.map(formatPyValue).join(', ')}]`;
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val).map(
      ([k, v]) => `${escapePyString(k)}: ${formatPyValue(v)}`
    );
    return `{${entries.join(', ')}}`;
  }
  return String(val);
}

/**
 * Convert a CanonicalTypeDescriptor to its Python type representation.
 */
function toPyType(desc: CanonicalTypeDescriptor): string {
  switch (desc.kind) {
    case 'primitive':
      if (desc.type === 'int' || desc.type === 'int64' || desc.type === 'uint32') return 'int';
      if (desc.type === 'float') return 'float';
      if (desc.type === 'bool') return 'bool';
      if (desc.type === 'string') return 'str';
      return 'int';

    case 'array':
      return `list[${toPyType(desc.element)}]`;

    case 'tree':
    case 'tree_node':
      return 'TreeNode | None';

    case 'linked_list':
    case 'linked_list_cycle':
      return 'ListNode | None';

    case 'linked_list_array':
      return 'list[ListNode | None]';

    case 'graph':
      return 'Node | None';

    case 'interval':
      return 'Interval';

    case 'interval_array':
      return 'list[Interval]';

    case 'byte_grid':
      return 'list[list[str]]';

    case 'void':
      return 'None';

    default:
      return 'Any';
  }
}

function toDefaultPyReturnValue(desc: CanonicalTypeDescriptor): string {
  switch (desc.kind) {
    case 'void':
      return '';
    case 'primitive':
      if (desc.type === 'bool') return 'return False';
      if (desc.type === 'int' || desc.type === 'int64' || desc.type === 'uint32') return 'return 0';
      if (desc.type === 'float') return 'return 0.0';
      if (desc.type === 'string') return 'return ""';
      return 'return 0';
    case 'array':
      return 'return []';
    case 'tree':
    case 'tree_node':
    case 'linked_list':
    case 'linked_list_cycle':
    case 'linked_list_array':
    case 'graph':
      return 'return None';
    default:
      return 'pass';
  }
}

/**
 * Generate starter template code for user editor conforming to the canonical contract.
 */
export function buildTemplateCode(meta: CanonicalData): string {
  const sig = parseCanonicalSignature(meta);

  if (sig.mode === 'operations') {
    const ctorParams = sig.parameters.length > 0
      ? ', ' + sig.parameters.map(p => `${p.name}: ${toPyType(p.type)}`).join(', ')
      : '';

    const methodsCode = (sig.methods || [])
      .map(m => {
        const paramList = m.parameters.length > 0
          ? ', ' + m.parameters.map(p => `${p.name}: ${toPyType(p.type)}`).join(', ')
          : '';
        const retType = toPyType(m.returnType);
        const retStmt = toDefaultPyReturnValue(m.returnType);
        const body = retStmt ? `        ${retStmt}` : '        pass';
        return `    def ${m.name}(self${paramList}) -> ${retType}:\n${body}`;
      })
      .join('\n\n');

    return `class ${sig.name}:
    def __init__(self${ctorParams}) -> None:
        pass

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

    const formatPyMethod = (m: CanonicalMethodDescriptor, isMethod = false) => {
      const params = m.parameters.map(p => `${p.name}: ${toPyType(p.type)}`).join(', ');
      const fullParams = isMethod ? (params ? `self, ${params}` : 'self') : params;
      const retType = toPyType(m.returnType);
      const retStmt = toDefaultPyReturnValue(m.returnType);
      const indent = isMethod ? '    ' : '';
      const body = retStmt ? `${indent}    ${retStmt}` : `${indent}    pass`;
      return `${indent}def ${m.name}(${fullParams}) -> ${retType}:\n${body}`;
    };

    if (sig.receiver) {
      return `class ${sig.receiver}:
${formatPyMethod(innerFn, true)}

${formatPyMethod(outerFn, true)}
`;
    }

    return `${formatPyMethod(innerFn)}\n\n${formatPyMethod(outerFn)}\n`;
  }

  // Standard function
  const paramList = sig.parameters
    .map(p => `${p.name}: ${toPyType(p.type)}`)
    .join(', ');
  const retType = toPyType(sig.returnType);
  const retStmt = toDefaultPyReturnValue(sig.returnType);
  const body = retStmt ? `    ${retStmt}` : '    pass';

  return `def ${sig.name}(${paramList}) -> ${retType}:\n${body}\n`;
}

export function buildTestCode(cases: FlatCanonicalTestCase[], meta: CanonicalData): string {
  if (!cases.length) return '';

  const sig = parseCanonicalSignature(meta);

  if (sig.mode === 'operations') {
    return buildOperationsTestCode(cases);
  }

  if (sig.mode === 'compose') {
    return buildComposeTestCode(cases, sig);
  }

  const comparison = meta?.comparison || cases[0]?.comparison || 'exact';
  const returns = meta?.returns || cases[0]?.returns || 'standard';
  const inputsMeta = meta?.inputs || cases[0]?.inputs || {};
  const mutation = meta?.mutation || cases[0]?.mutation;

  const property = cases[0].property;
  const inputKeys = Object.keys(cases[0].input || {});
  const hasInputs = inputKeys.length > 0;
  const argVars = inputKeys.length === 1 ? ['arg1'] : inputKeys.map((_, i) => `arg${i + 1}`);
  const destructureArgs = hasInputs ? `${argVars.join(', ')}, expected, desc` : 'expected, desc';

  const testCaseTuples = cases.map((c) => {
    const inputVals = inputKeys.map((k) => formatPyValue(c.input[k]));
    const expVal = formatPyValue(c.expected);
    const desc = escapePyString(c.description);
    return `    (${[...inputVals, expVal, desc].join(', ')}),`;
  });

  const argFmt = hasInputs
    ? (inputKeys.length === 1 ? `{${argVars[0]}}` : argVars.map((v) => `{${v}}`).join(', '))
    : '';

  const cycleKey = inputKeys.find((k) => inputsMeta[k] === 'linked_list_cycle');
  const posKey = cycleKey
    ? (inputKeys.find((k) => k === 'pos' || k === `${cycleKey}_pos` || k === `${cycleKey}Pos`) ||
       (inputKeys.length === 2 ? inputKeys.find((k) => k !== cycleKey) : undefined))
    : undefined;
  const posIdx = posKey ? inputKeys.indexOf(posKey) : -1;

  // Input transforms
  const inputTransforms: string[] = [];
  const callArgVars: string[] = [];
  for (let i = 0; i < inputKeys.length; i++) {
    const key = inputKeys[i];
    const v = argVars[i];
    const type = inputsMeta[key];
    if (type === 'linked_list_cycle') {
      const posVar = posIdx !== -1 ? argVars[posIdx] : '-1';
      inputTransforms.push(`${v}_in = make_cycle(${v}, ${posVar})`);
      callArgVars.push(`${v}_in`);
    } else if (key === posKey && cycleKey) {
      continue;
    } else if (type === 'tree') {
      inputTransforms.push(`${v}_in = list_to_tree(${v})`);
      callArgVars.push(`${v}_in`);
    } else if (type === 'tree_node') {
      inputTransforms.push(`${v}_in = TreeNode(${v}) if isinstance(${v}, int) else ${v}`);
      callArgVars.push(`${v}_in`);
    } else if (type === 'linked_list') {
      inputTransforms.push(`${v}_in = list_to_linked_list(${v})`);
      callArgVars.push(`${v}_in`);
    } else if (type === 'linked_list_array') {
      inputTransforms.push(`${v}_in = [list_to_linked_list(x) for x in ${v}]`);
      callArgVars.push(`${v}_in`);
    } else if (type === 'graph') {
      inputTransforms.push(`${v}_in = build_graph(${v})`);
      callArgVars.push(`${v}_in`);
    } else if (type === 'interval') {
      inputTransforms.push(`${v}_in = Interval(${v}[0], ${v}[1]) if isinstance(${v}, (list, tuple)) else ${v}`);
      callArgVars.push(`${v}_in`);
    } else if (type === 'interval_array') {
      inputTransforms.push(`${v}_in = [Interval(x[0], x[1]) for x in ${v}]`);
      callArgVars.push(`${v}_in`);
    } else if (type === 'byte_grid') {
      inputTransforms.push(`${v}_in = [list(row) for row in ${v}]`);
      callArgVars.push(`${v}_in`);
    } else {
      inputTransforms.push(`${v}_in = ${v}`);
      callArgVars.push(`${v}_in`);
    }
  }

  const callArgs = callArgVars.join(', ');

  // In-place mutation
  if (mutation?.target) {
    const targetIdx = inputKeys.indexOf(mutation.target);
    const targetVar = targetIdx !== -1 ? `${argVars[targetIdx]}_in` : `${argVars[0]}_in`;
    const postTransform =
      returns === 'linked_list' ? `linked_list_to_list(${targetVar})` : targetVar;
    return `import copy

if '${property}' not in globals():
    raise Exception("${property} function is not defined")

test_cases = [
${testCaseTuples.join('\n')}
]

for ${destructureArgs} in test_cases:
${inputTransforms.map((t) => '    ' + t).join('\n')}
    ${property}(${callArgs})
    res = ${postTransform}
    Tests.equal_check(desc, expected, res)
`;
  }

  // Result transformation
  let resTransform = 'res';
  if (returns === 'tree') {
    resTransform = 'tree_to_list(res)';
  } else if (returns === 'tree_node') {
    resTransform = 'res.val if res else None';
  } else if (returns === 'linked_list') {
    resTransform = 'linked_list_to_list(res)';
  } else if (returns === 'graph') {
    resTransform = 'graph_to_adj(res)';
  }

  // Assertion check
  let assertion = `Tests.equal_check(desc, expected, ${resTransform})`;
  if (comparison === 'unordered') {
    assertion = `Tests.equal_check(desc, sorted(expected), sorted(${resTransform}))`;
  } else if (comparison === 'unordered_nested') {
    assertion = `Tests.unordered_equal_check(desc, expected, ${resTransform})`;
  }

  return `if '${property}' not in globals():
    raise Exception("${property} function is not defined")

test_cases = [
${testCaseTuples.join('\n')}
]

for ${destructureArgs} in test_cases:
${inputTransforms.length > 0 ? inputTransforms.map((t) => '    ' + t).join('\n') + '\n' : ''}    res = ${property}(${callArgs})
    ${assertion}
`;
}

function buildOperationsTestCode(cases: FlatCanonicalTestCase[]): string {
  const caseRows = cases.map((c) => {
    const ops = c.input.operations || [];
    const args = c.input.arguments || [];
    const exp = c.expected || [];
    const desc = escapePyString(c.description);
    return `    (${formatPyValue(ops)}, ${formatPyValue(args)}, ${formatPyValue(exp)}, ${desc}),`;
  });

  return `test_cases = [
${caseRows.join('\n')}
]

for operations, arguments, expected, desc in test_cases:
    obj = None
    res = []
    for op, arg in zip(operations, arguments):
        if obj is None:
            cls = globals().get(op)
            if not cls:
                raise Exception(f"{op} class is not defined")
            obj = cls(*arg)
            res.append(None)
        else:
            method = getattr(obj, op)
            r = method(*arg)
            res.append(r)
    Tests.equal_check(desc, expected, res)
`;
}

function buildComposeTestCode(cases: FlatCanonicalTestCase[], sig: CanonicalSignature): string {
  const [outerFn, innerFn] = sig.compose || ['decode', 'encode'];
  const receiver = sig.receiver;
  const returns = sig.returnType.kind;
  const inputsMeta = sig.parameters.reduce((acc, p) => {
    acc[p.name] = p.type.kind;
    return acc;
  }, {} as Record<string, string>);

  const inputKeys = Object.keys(cases[0].input || {});
  const hasInputs = inputKeys.length > 0;
  const argVars = inputKeys.length === 1 ? ['arg1'] : inputKeys.map((_, i) => `arg${i + 1}`);
  const destructureArgs = hasInputs ? `${argVars.join(', ')}, expected, desc` : 'expected, desc';

  const testCaseTuples = cases.map((c) => {
    const inputVals = inputKeys.map((k) => formatPyValue(c.input[k]));
    const expVal = formatPyValue(c.expected);
    const desc = escapePyString(c.description);
    return `    (${[...inputVals, expVal, desc].join(', ')}),`;
  });

  const argFmt = hasInputs
    ? (inputKeys.length === 1 ? `{${argVars[0]}}` : argVars.map((v) => `{${v}}`).join(', '))
    : '';

  const inputTransforms = inputKeys.map((key, i) => {
    const v = argVars[i];
    const type = inputsMeta[key];
    if (type === 'tree') return `${v}_in = list_to_tree(${v})`;
    if (type === 'tree_node') return `${v}_in = TreeNode(${v}) if isinstance(${v}, int) else ${v}`;
    if (type === 'linked_list') return `${v}_in = list_to_linked_list(${v})`;
    if (type === 'byte_grid') return `${v}_in = [list(row) for row in ${v}]`;
    return `${v}_in = ${v}`;
  });

  const callArgs = inputKeys.map((_, i) => `${argVars[i]}_in`).join(', ');

  let resTransform = 'res';
  if (returns === 'tree') {
    resTransform = 'tree_to_list(res)';
  } else if (returns === 'linked_list') {
    resTransform = 'linked_list_to_list(res)';
  }

  const receiverCheck = receiver
    ? `cls = globals().get("${receiver}")\ninst = cls() if cls else None`
    : `inst = None`;

  const invocation = receiver
    ? `if inst:
        encoded = getattr(inst, "${innerFn}")(${callArgs})
        res = getattr(inst, "${outerFn}")(encoded)
    else:
        res = ${outerFn}(${innerFn}(${callArgs}))`
    : `res = ${outerFn}(${innerFn}(${callArgs}))`;

  return `test_cases = [
${testCaseTuples.join('\n')}
]

${receiverCheck}

for ${destructureArgs} in test_cases:
${inputTransforms.length > 0 ? inputTransforms.map((t) => '    ' + t).join('\n') + '\n' : ''}    ${invocation}
    Tests.equal_check(desc, expected, ${resTransform})
`;
}
