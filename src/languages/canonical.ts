export type CanonicalInputType =
  | 'standard'
  | 'tree'
  | 'tree_node'
  | 'linked_list'
  | 'linked_list_array'
  | 'linked_list_cycle'
  | 'graph'
  | 'interval'
  | 'interval_array'
  | 'byte_grid';

export type CanonicalReturnType =
  | 'standard'
  | 'tree'
  | 'tree_node'
  | 'linked_list'
  | 'graph'
  | 'void';

export type CanonicalMode =
  | 'function'
  | 'operations'
  | 'compose';

/**
 * Root JSON structure of a canonical-data.json file
 */
export interface CanonicalData {
  exercise: string;
  property?: string;
  comments?: string[];
  comparison?: 'exact' | 'unordered' | 'unordered_nested';
  returns?: CanonicalReturnType;
  inputs?: Record<string, CanonicalInputType>;
  mutation?: { target: string };
  mode?: CanonicalMode;
  compose?: [string, string];
  receiver?: string;
  cases: CanonicalCase[];
}

/**
 * A canonical case item is either a leaf test case or a group containing nested cases.
 */
export type CanonicalCase = CanonicalTestCase | CanonicalCaseGroup;

/**
 * A group of test cases with a descriptive grouping label.
 */
export interface CanonicalCaseGroup {
  description: string;
  cases: CanonicalCase[];
}

/**
 * Leaf test case representing a single test invocation.
 */
export interface CanonicalTestCase {
  uuid?: string;
  description: string;
  property?: string;
  input: Record<string, any>;
  expected: any;
  comments?: string[];
  comparison?: 'exact' | 'unordered' | 'unordered_nested';
  returns?: CanonicalReturnType;
  inputs?: Record<string, CanonicalInputType>;
  mutation?: { target: string };
}

/**
 * Flattened test case preserving optional parent group description context.
 */
export interface FlatCanonicalTestCase extends CanonicalTestCase {
  property: string;
  groupDescription?: string;
}

/**
 * Type guard to distinguish leaf CanonicalTestCase from CanonicalCaseGroup.
 */
export function isTestCase(c: CanonicalCase): c is CanonicalTestCase {
  return !('cases' in c) && 'input' in c;
}

/**
 * Recursively flattens nested case groups into a flat array of test cases.
 */
export function flattenCases(
  cases: CanonicalCase[],
  groupDesc?: string
): FlatCanonicalTestCase[] {
  const result: FlatCanonicalTestCase[] = [];

  for (const c of cases) {
    if (isTestCase(c)) {
      result.push({
        ...c,
        property: c.property || '',
        ...(groupDesc ? { groupDescription: groupDesc } : {})
      });
    } else if (Array.isArray(c.cases)) {
      const nestedGroup = groupDesc
        ? `${groupDesc} - ${c.description}`
        : c.description;
      result.push(...flattenCases(c.cases, nestedGroup));
    }
  }

  return result;
}

/**
 * Universal structured type descriptor for canonical parameters and return values.
 */
export type CanonicalTypeDescriptor =
  | { kind: 'primitive'; type: 'int' | 'int64' | 'uint32' | 'float' | 'bool' | 'string' }
  | { kind: 'array'; element: CanonicalTypeDescriptor }
  | { kind: 'tree' }
  | { kind: 'tree_node' }
  | { kind: 'linked_list' }
  | { kind: 'linked_list_array' }
  | { kind: 'linked_list_cycle' }
  | { kind: 'graph' }
  | { kind: 'interval' }
  | { kind: 'interval_array' }
  | { kind: 'byte_grid' }
  | { kind: 'void' }
  | { kind: 'unknown' };

export interface CanonicalParamDescriptor {
  name: string;
  type: CanonicalTypeDescriptor;
  isMutationTarget: boolean;
}

export interface CanonicalMethodDescriptor {
  name: string;
  parameters: CanonicalParamDescriptor[];
  returnType: CanonicalTypeDescriptor;
}

export interface CanonicalSignature {
  exercise: string;
  mode: CanonicalMode;
  name: string; // Function name or class name
  receiver?: string;
  compose?: [string, string];
  innerFunction?: CanonicalMethodDescriptor;
  outerFunction?: CanonicalMethodDescriptor;
  mutationTarget?: string;
  parameters: CanonicalParamDescriptor[];
  returnType: CanonicalTypeDescriptor;
  methods: CanonicalMethodDescriptor[]; // For operations mode
}

/**
 * Infer a structured CanonicalTypeDescriptor from sample data and optional semantic hint.
 */
export function inferCanonicalType(
  val: any,
  hint?: CanonicalInputType | CanonicalReturnType,
  allCases?: FlatCanonicalTestCase[],
  key?: string
): CanonicalTypeDescriptor {
  if (hint === 'tree') return { kind: 'tree' };
  if (hint === 'tree_node') return { kind: 'tree_node' };
  if (hint === 'linked_list') return { kind: 'linked_list' };
  if (hint === 'linked_list_array') return { kind: 'linked_list_array' };
  if (hint === 'linked_list_cycle') return { kind: 'linked_list_cycle' };
  if (hint === 'graph') return { kind: 'graph' };
  if (hint === 'interval') return { kind: 'interval' };
  if (hint === 'interval_array') return { kind: 'interval_array' };
  if (hint === 'byte_grid') return { kind: 'byte_grid' };
  if (hint === 'void') return { kind: 'void' };
  // 'standard' hint explicitly falls through to data-based type inference

  if (val === null || val === undefined) {
    if (allCases && key) {
      for (const c of allCases) {
        const sample = key === 'expected' ? c.expected : c.input?.[key];
        if (sample !== null && sample !== undefined) {
          return inferCanonicalType(sample, hint === 'standard' ? undefined : hint, allCases, key);
        }
      }
    }
    return { kind: 'unknown' };
  }

  if (typeof val === 'boolean') {
    return { kind: 'primitive', type: 'bool' };
  }

  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      if (val < -2147483648 || val > 4294967295) {
        return { kind: 'primitive', type: 'int64' };
      }
      if (val > 2147483647) {
        return { kind: 'primitive', type: 'uint32' };
      }
      return { kind: 'primitive', type: 'int' };
    }
    return { kind: 'primitive', type: 'float' };
  }

  if (typeof val === 'string') {
    return { kind: 'primitive', type: 'string' };
  }

  if (Array.isArray(val)) {
    if (val.length === 0) {
      // Look across all other cases to find an example with elements
      if (allCases && key) {
        for (const c of allCases) {
          const sample = key === 'expected' ? c.expected : c.input?.[key];
          if (Array.isArray(sample) && sample.length > 0) {
            return { kind: 'array', element: inferCanonicalType(sample[0], undefined, allCases, key) };
          }
        }
      }
      return { kind: 'array', element: { kind: 'primitive', type: 'int' } };
    }
    return { kind: 'array', element: inferCanonicalType(val[0], undefined, allCases, key) };
  }

  return { kind: 'unknown' };
}

/**
 * Parse a CanonicalData object into a normalized, language-agnostic signature representation.
 */
export function parseCanonicalSignature(meta: CanonicalData): CanonicalSignature {
  const flat = flattenCases(meta.cases);
  const first = flat[0];
  const mode: CanonicalMode = meta.mode || (first?.property === 'operations' ? 'operations' : 'function');
  const exercise = meta.exercise;
  const inputsMeta = meta.inputs || first?.inputs || {};
  const returnsMeta = meta.returns || first?.returns || 'standard';
  const mutationTarget = meta.mutation?.target || first?.mutation?.target;

  if (mode === 'operations') {
    let className = meta.receiver || (first?.input?.operations?.[0]) || 'Solution';
    let ctorParams: CanonicalParamDescriptor[] = [];
    let foundCtor = false;

    const methodMap = new Map<string, CanonicalMethodDescriptor>();

    for (const c of flat) {
      const ops: string[] = c.input?.operations || [];
      const args: any[][] = c.input?.arguments || [];
      const exps: any[] = c.expected || [];

      if (ops.length > 0) {
        if (!meta.receiver && ops[0]) {
          className = ops[0];
        }
        if (!foundCtor && args.length > 0 && Array.isArray(args[0])) {
          ctorParams = (args[0] || []).map((arg, idx) => ({
            name: `arg${idx + 1}`,
            type: inferCanonicalType(arg),
            isMutationTarget: false
          }));
          if (ctorParams.length > 0) {
            foundCtor = true;
          }
        }
      }

      for (let i = 1; i < ops.length; i++) {
        const op = ops[i];
        const methodArgs = args[i] || [];
        const expectedVal = exps[i];

        const existing = methodMap.get(op);
        if (!existing) {
          const returnType = expectedVal === null || expectedVal === undefined
            ? { kind: 'void' as const }
            : inferCanonicalType(expectedVal);

          methodMap.set(op, {
            name: op,
            parameters: methodArgs.map((a, aIdx) => ({
              name: `arg${aIdx + 1}`,
              type: inferCanonicalType(a),
              isMutationTarget: false
            })),
            returnType
          });
        } else {
          // If we previously marked it void because expectedVal was null/undefined,
          // refine it if a subsequent invocation returns a concrete value.
          if (existing.returnType.kind === 'void' && expectedVal !== null && expectedVal !== undefined) {
            existing.returnType = inferCanonicalType(expectedVal);
          }
          // If existing parameters were empty but this invocation has arguments, refine them
          if (existing.parameters.length === 0 && methodArgs.length > 0) {
            existing.parameters = methodArgs.map((a, aIdx) => ({
              name: `arg${aIdx + 1}`,
              type: inferCanonicalType(a),
              isMutationTarget: false
            }));
          }
        }
      }
    }

    return {
      exercise,
      mode: 'operations',
      name: className,
      receiver: className,
      mutationTarget,
      parameters: ctorParams,
      returnType: { kind: 'void' },
      methods: Array.from(methodMap.values())
    };
  }

  if (mode === 'compose') {
    const compose = meta.compose || ['decode', 'encode'];
    const outerFn = compose[0];
    const innerFn = compose[1];
    const inputKeys = Object.keys(first?.input || {});

    const params: CanonicalParamDescriptor[] = inputKeys.map((k) => ({
      name: k,
      type: inferCanonicalType(first.input[k], inputsMeta[k], flat, k),
      isMutationTarget: false
    }));

    const retType = inferCanonicalType(
      first?.expected,
      returnsMeta,
      flat,
      'expected'
    );

    const innerFunction: CanonicalMethodDescriptor = {
      name: innerFn,
      parameters: params,
      returnType: { kind: 'primitive', type: 'string' }
    };

    const outerFunction: CanonicalMethodDescriptor = {
      name: outerFn,
      parameters: [
        {
          name: outerFn === 'decode' ? 's' : 'data',
          type: { kind: 'primitive', type: 'string' },
          isMutationTarget: false
        }
      ],
      returnType: retType
    };

    return {
      exercise,
      mode: 'compose',
      name: outerFn,
      receiver: meta.receiver,
      compose: [outerFn, innerFn],
      innerFunction,
      outerFunction,
      mutationTarget,
      parameters: params,
      returnType: retType,
      methods: [innerFunction, outerFunction]
    };
  }

  // Standard function mode
  const propName = first?.property || meta.property || exercise;
  const inputKeys = Object.keys(first?.input || {});

  const params: CanonicalParamDescriptor[] = inputKeys.map((k) => ({
    name: k,
    type: inferCanonicalType(first.input[k], inputsMeta[k], flat, k),
    isMutationTarget: k === mutationTarget
  }));

  const retType = mutationTarget
    ? { kind: 'void' as const }
    : inferCanonicalType(
        first?.expected,
        returnsMeta,
        flat,
        'expected'
      );

  return {
    exercise,
    mode: 'function',
    name: propName,
    mutationTarget,
    parameters: params,
    returnType: retType,
    methods: []
  };
}
