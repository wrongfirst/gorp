import {
  type FlatCanonicalTestCase,
  type CanonicalData,
  type CanonicalTypeDescriptor,
  parseCanonicalSignature
} from '../canonical';

function formatOcamlLiteral(val: any, hint?: string): string {
  if (hint === 'tree' && Array.isArray(val)) {
    const elts = val.map((x) => (x === null || x === undefined ? 'None' : `Some ${x}`));
    return `[${elts.join('; ')}]`;
  }
  if (hint === 'interval' && Array.isArray(val)) {
    return `(${val[0]}, ${val[1]})`;
  }
  if (hint === 'interval_array' && Array.isArray(val)) {
    const ivs = val.map((iv: any) => `(${iv[0]}, ${iv[1]})`);
    return `[${ivs.join('; ')}]`;
  }
  if (hint === 'byte_grid' && Array.isArray(val)) {
    const rows = val.map((row: any) => {
      const chars = row.map((s: string) => `'${s.charAt(0)}'`);
      return `[${chars.join('; ')}]`;
    });
    return `[${rows.join('; ')}]`;
  }

  if (val === null || val === undefined) return 'None';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return JSON.stringify(val);
  if (Array.isArray(val)) {
    return `[${val.map((x) => formatOcamlLiteral(x)).join('; ')}]`;
  }
  return JSON.stringify(val);
}

function toOcamlType(desc: CanonicalTypeDescriptor): string {
  switch (desc.kind) {
    case 'primitive':
      if (desc.type === 'int' || desc.type === 'int64' || desc.type === 'uint32') return 'int';
      if (desc.type === 'float') return 'float';
      if (desc.type === 'bool') return 'bool';
      if (desc.type === 'string') return 'string';
      return 'int';

    case 'array':
      return `${toOcamlType(desc.element)} list`;

    case 'tree':
    case 'tree_node':
      return 'tree_node option';

    case 'linked_list':
    case 'linked_list_cycle':
      return 'list_node option';

    case 'linked_list_array':
      return 'list_node option list';

    case 'graph':
      return 'node option';

    case 'interval':
      return 'int * int';

    case 'interval_array':
      return '(int * int) list';

    case 'byte_grid':
      return 'char list list';

    case 'void':
      return 'unit';

    default:
      return 'int';
  }
}

function toDefaultOcamlReturnValue(desc: CanonicalTypeDescriptor): string {
  switch (desc.kind) {
    case 'void':
      return '()';
    case 'primitive':
      if (desc.type === 'bool') return 'false';
      if (desc.type === 'int' || desc.type === 'int64' || desc.type === 'uint32') return '0';
      if (desc.type === 'float') return '0.0';
      if (desc.type === 'string') return '""';
      return '0';
    case 'array':
      return '[]';
    case 'tree':
    case 'tree_node':
    case 'linked_list':
    case 'linked_list_cycle':
    case 'linked_list_array':
    case 'graph':
      return 'None';
    case 'interval':
      return '(0, 0)';
    default:
      return '0';
  }
}

/**
 * Generate starter template code for user editor conforming to the canonical contract.
 */
export function buildTemplateCode(meta: CanonicalData): string {
  const sig = parseCanonicalSignature(meta);

  if (sig.mode === 'operations' || sig.mode === 'compose') {
    throw new Error(`OCaml test runner does not support ${sig.mode} mode.`);
  }

  const paramList = sig.parameters.length > 0
    ? sig.parameters.map(p => `(${p.name} : ${toOcamlType(p.type)})`).join(' ')
    : '()';
  const retType = toOcamlType(sig.returnType);
  const retVal = toDefaultOcamlReturnValue(sig.returnType);

  return `let ${sig.name} ${paramList} : ${retType} =
  (* Your code here *)
  ${retVal}
`;
}

export function buildTestCode(cases: FlatCanonicalTestCase[], meta: CanonicalData): string {
  if (!cases.length) return '';

  const sig = parseCanonicalSignature(meta);

  if (sig.mode === 'operations' || sig.mode === 'compose') {
    throw new Error(`OCaml test runner does not support ${sig.mode} mode.`);
  }

  const comparison = meta?.comparison || cases[0]?.comparison || 'exact';
  const returns = meta?.returns || cases[0]?.returns || 'standard';
  const inputsMeta = meta?.inputs || cases[0]?.inputs || {};
  const mutation = meta?.mutation || cases[0]?.mutation;

  const property = sig.name;
  const inputKeys = sig.parameters.map(p => p.name);
  const hasInputs = inputKeys.length > 0;

  const cycleKey = inputKeys.find((k) => inputsMeta[k] === 'linked_list_cycle');
  const posKey = cycleKey
    ? (inputKeys.find((k) => k === 'pos' || k === `${cycleKey}_pos` || k === `${cycleKey}Pos`) ||
       (inputKeys.length === 2 ? inputKeys.find((k) => k !== cycleKey) : undefined))
    : undefined;

  const argNames = hasInputs
    ? inputKeys.map((_, i) => `arg${i + 1}`).join(', ')
    : '()';

  const testCaseEntries = cases.map((c) => {
    const inputs = inputKeys.map((k) => formatOcamlLiteral(c.input[k], inputsMeta[k]));
    const exp = formatOcamlLiteral(c.expected, returns === 'tree' ? 'tree' : undefined);
    const desc = JSON.stringify(c.description);
    return `    (${[...inputs, exp, desc].join(', ')});`;
  });

  const callArgExprs: string[] = [];
  for (let i = 0; i < inputKeys.length; i++) {
    const k = inputKeys[i];
    const v = `arg${i + 1}`;
    if (k === posKey && cycleKey) continue;
    const type = inputsMeta[k];
    if (type === 'linked_list_cycle') {
      const posIdx = posKey ? inputKeys.indexOf(posKey) : -1;
      const posVar = posIdx !== -1 ? `arg${posIdx + 1}` : '(-1)';
      callArgExprs.push(`(make_cycle ${v} ${posVar})`);
    } else if (type === 'tree') {
      callArgExprs.push(`(list_to_tree ${v})`);
    } else if (type === 'tree_node') {
      callArgExprs.push(`(create_tree_node ${v})`);
    } else if (type === 'linked_list') {
      callArgExprs.push(`(list_to_linked_list ${v})`);
    } else if (type === 'linked_list_array') {
      callArgExprs.push(`(List.map list_to_linked_list ${v})`);
    } else if (type === 'graph') {
      callArgExprs.push(`(build_graph ${v})`);
    } else {
      callArgExprs.push(v);
    }
  }

  const callArgs = callArgExprs.length > 0 ? callArgExprs.join(' ') : '()';

  let resTransform = 'res';
  if (returns === 'tree') resTransform = 'tree_to_list res';
  else if (returns === 'tree_node') resTransform = '(match res with None -> -1 | Some n -> n.val_)';
  else if (returns === 'linked_list') resTransform = 'linked_list_to_list res';
  else if (returns === 'graph') resTransform = 'graph_to_adj res';

  let assertion = 'Tests.equal_check msg expected res';
  if (comparison === 'unordered' || comparison === 'unordered_nested') {
    assertion = `Tests.unordered_equal_check msg expected ${resTransform}`;
  } else if (typeof cases[0].expected === 'string') {
    assertion = `Tests.string_check (fun s -> "\\"" ^ s ^ "\\"") msg expected ${resTransform}`;
  } else {
    assertion = `Tests.equal_check msg expected ${resTransform}`;
  }

  const msgExpr = 'desc';

  const iterPattern = hasInputs ? `(${argNames}, expected, desc)` : `(expected, desc)`;

  // In-place mutation
  if (mutation?.target) {
    const targetIdx = inputKeys.indexOf(mutation.target);
    const targetVar = targetIdx !== -1 ? `arg${targetIdx + 1}` : 'arg1';
    const isLinkedList = inputsMeta[mutation.target] === 'linked_list';
    const postTransform = isLinkedList ? `linked_list_to_list ${targetVar}` : targetVar;
    return `let () =
  let test_cases = [
${testCaseEntries.join('\n')}
  ] in
  List.iter (fun ${iterPattern} ->
    let ${targetVar}_in = ${isLinkedList ? `list_to_linked_list ${targetVar}` : targetVar} in
    ${property} ${targetVar}_in;
    let res = ${postTransform} in
    let msg = ${msgExpr} in
    ${assertion}
  ) test_cases
`;
  }

  return `let () =
  let test_cases = [
${testCaseEntries.join('\n')}
  ] in
  List.iter (fun ${iterPattern} ->
    let res = ${property} ${callArgs} in
    let msg = ${msgExpr} in
    ${assertion}
  ) test_cases
`;
}
