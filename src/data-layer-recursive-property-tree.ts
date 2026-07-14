export type PropertyValueType = "String" | "Number" | "Boolean" | "Object" | "Array" | "Null";
export type TargetSegment = { kind:"property"; value:string } | { kind:"index"; value:number } | { kind:"every"; value:null };

export interface RecursivePropertyNode {
  label: string;
  path: string;
  expression: string;
  summary: string;
  assistance: string;
  matchedValueCount: number;
  detectedTypes: readonly PropertyValueType[];
  examples: readonly unknown[];
  zeroBasedIndex?: number;
  children: RecursivePropertyNode[];
  specificItems: RecursivePropertyNode[];
}

function valueType(value: unknown): PropertyValueType {
  if (value === null) return "Null";
  if (Array.isArray(value)) return "Array";
  if (typeof value === "string") return "String";
  if (typeof value === "number") return "Number";
  if (typeof value === "boolean") return "Boolean";
  return "Object";
}

function unique<T>(values: readonly T[]): T[] { return [...new Set(values)]; }
function pointerToken(value: string): string { return value.replaceAll("~", "~0").replaceAll("/", "~1"); }
function pointerValue(value: string): string { return value.replaceAll("~1", "/").replaceAll("~0", "~"); }
function propertySegment(value: string): TargetSegment { return { kind:"property", value }; }
function expressionFor(segments: readonly TargetSegment[]): string {
  return `$${segments.map((segment) => segment.kind === "property" ? `[${JSON.stringify(segment.value)}]` : segment.kind === "every" ? "[*]" : `[${segment.value}]`).join("")}`;
}

function segmentsForPointer(path: string): TargetSegment[] {
  return path.split("/").slice(1).map((token) => token === "*" ? { kind:"every", value:null } : /^\d+$/.test(token) ? { kind:"index", value:Number(token) } : propertySegment(pointerValue(token)));
}

function nodeSummary(values: readonly unknown[], total: number, arrayContainer: boolean): string {
  const types = unique(values.map(valueType));
  if (arrayContainer) return `Array · ${values.reduce<number>((count, value) => count + (Array.isArray(value) ? value.length : 0), 0)} items`;
  const typeText = types.length > 1 ? `Mixed types · ${types.map((type) => `${type} ${values.filter((value) => valueType(value) === type).length}`).join(" · ")}` : types[0] ?? "Unknown";
  if (values.length < total) return `${typeText} · present in ${values.length} of ${total} items`;
  if (total > 1 && types.length === 1 && types.every((type) => !["Object", "Array"].includes(type))) return `${typeText} · ${values.length} observed values`;
  return typeText;
}

function primitiveExamples(values: readonly unknown[]): unknown[] {
  return unique(values.filter((value) => value === null || typeof value !== "object").map((value) => JSON.stringify(value))).slice(0, 3).map((value) => JSON.parse(value));
}

function buildNode(label: string, path: string, values: readonly unknown[], total: number, segments: readonly TargetSegment[], zeroBasedIndex?: number): RecursivePropertyNode {
  const arrays = values.filter(Array.isArray) as unknown[][];
  const objects = values.filter((value) => value !== null && typeof value === "object" && !Array.isArray(value)) as Record<string, unknown>[];
  const children: RecursivePropertyNode[] = [];
  const specificItems: RecursivePropertyNode[] = [];
  if (objects.length) {
    const keys = unique(objects.flatMap((value) => Object.keys(value)));
    for (const key of keys) {
      const childValues = objects.flatMap((value) => Object.prototype.hasOwnProperty.call(value, key) ? [value[key]] : []);
      children.push(buildNode(key, `${path}/${pointerToken(key)}`, childValues, objects.length, [...segments, propertySegment(key)]));
    }
  }
  if (arrays.length) {
    const items = arrays.flat();
    if (items.length) children.push(buildNode("Every item", `${path}/*`, items, items.length, [...segments, { kind:"every", value:null }]));
    const source = arrays[0] ?? [];
    source.forEach((value, index) => specificItems.push(buildNode(`Item ${index + 1}`, `${path}/${index}`, [value], 1, [...segments, { kind:"index", value:index }], index)));
  }
  return {
    label, path, expression:expressionFor(segments), summary:nodeSummary(values, total, arrays.length > 0),
    assistance:arrays.length && arrays.every((array) => array.length === 0) ? "No item structure was observed" : "",
    matchedValueCount:values.length, detectedTypes:unique(values.map(valueType)), examples:primitiveExamples(values),
    ...(zeroBasedIndex === undefined ? {} : { zeroBasedIndex }), children, specificItems,
  };
}

export function buildRecursivePropertyTree(payload: unknown): RecursivePropertyNode[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [buildNode("value", "/value", [payload], 1, [propertySegment("value")])];
  return Object.entries(payload as Record<string, unknown>).map(([name, value]) => buildNode(name, `/${pointerToken(name)}`, [value], 1, [propertySegment(name)]));
}

function flattenSearchable(nodes: readonly RecursivePropertyNode[]): RecursivePropertyNode[] {
  return nodes.flatMap((node) => [node, ...flattenSearchable(node.children)]);
}

export function searchRecursivePropertyTree(tree: readonly RecursivePropertyNode[], query: string, expanded: ReadonlySet<string>): { matches:string[]; expanded:string[]; restoreExpanded:string[] } {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = flattenSearchable(tree)
    .filter((node) => terms.every((term) => `${node.label} ${node.path}`.toLowerCase().includes(term)))
    .map(({ path }) => path);
  const opened = unique(matches.flatMap((path) => {
    const tokens = path.split("/").slice(1); return tokens.slice(0, -1).map((_, index) => `/${tokens.slice(0, index + 1).join("/")}`);
  }));
  return { matches, expanded:opened, restoreExpanded:[...expanded] };
}

export function parseTargetExpression(expression: string): TargetSegment[] {
  const trimmed = expression.trim();
  if (trimmed.startsWith("/")) return segmentsForPointer(trimmed);
  if (!trimmed.startsWith("$")) throw new Error("Target expression must begin with $ or /");
  const segments: TargetSegment[] = []; let rest = trimmed.slice(1);
  while (rest) {
    const property = rest.match(/^\[("(?:[^"\\]|\\.)*")\]/);
    if (property) { segments.push(propertySegment(JSON.parse(property[1]!))); rest = rest.slice(property[0].length); continue; }
    const every = rest.match(/^\[\*\]/); if (every) { segments.push({ kind:"every", value:null }); rest = rest.slice(3); continue; }
    const index = rest.match(/^\[(-?\d+(?:\.\d+)?)\]/); if (index) { segments.push({ kind:"index", value:Number(index[1]) }); rest = rest.slice(index[0].length); continue; }
    throw new Error(`Invalid target expression near ${rest}`);
  }
  return segments;
}

function inferredSegments(expression: string, payload: unknown): TargetSegment[] | { result:"blocked"; assistance:string } {
  if (!expression.trim().startsWith("/")) { try { return parseTargetExpression(expression); } catch { return { result:"blocked", assistance:"Correct the target expression" }; } }
  const tokens = expression.trim().split("/").slice(1); const segments: TargetSegment[] = []; let contexts: unknown[] = [payload]; let lastProperty = "value";
  for (const raw of tokens) {
    const token = pointerValue(raw);
    if (token === "*") {
      if (contexts.some((value) => !Array.isArray(value))) return { result:"blocked", assistance:`${lastProperty} is not an array` };
      segments.push({ kind:"every", value:null }); contexts = contexts.flatMap((value) => value as unknown[]); continue;
    }
    const arrays = contexts.filter(Array.isArray) as unknown[][];
    if (arrays.length) {
      if (/^-\d+$/.test(token)) return { result:"blocked", assistance:"Enter a non-negative array index" };
      if (/^[+-]?\d/.test(token) && !/^\d+$/.test(token)) return { result:"blocked", assistance:"Enter a non-negative whole-number array index" };
      if (!/^\d+$/.test(token)) return { result:"blocked", assistance:`Choose Every item or a specific ${lastProperty} index` };
      const index = Number(token); segments.push({ kind:"index", value:index }); contexts = arrays.flatMap((array) => index < array.length ? [array[index]] : []); continue;
    }
    segments.push(propertySegment(token)); lastProperty = token;
    contexts = contexts.flatMap((value) => value && typeof value === "object" && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, token) ? [(value as Record<string, unknown>)[token]] : []);
  }
  return segments;
}

export function normalizeTargetExpression(expression: string, payload: unknown): string {
  const segments = inferredSegments(expression, payload); if (!Array.isArray(segments)) throw new Error(segments.assistance); return expressionFor(segments);
}

export function resolveTargetValues(payload: unknown, expression: string): unknown[] {
  const inferred = inferredSegments(expression, payload); if (!Array.isArray(inferred)) return [];
  let contexts: unknown[] = [payload];
  for (const segment of inferred) {
    if (segment.kind === "property") contexts = contexts.flatMap((value) => value && typeof value === "object" && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, segment.value) ? [(value as Record<string, unknown>)[segment.value]] : []);
    else if (segment.kind === "every") contexts = contexts.flatMap((value) => Array.isArray(value) ? value : []);
    else contexts = contexts.flatMap((value) => Array.isArray(value) && segment.value < value.length ? [value[segment.value]] : []);
  }
  return contexts;
}

export function inspectValidationTarget(payload: unknown, expression: string): Record<string, unknown> {
  const inferred = inferredSegments(expression, payload); if (!Array.isArray(inferred)) return inferred;
  let contexts: unknown[] = [payload]; const missingNodes: string[] = []; let lastProperty = "value";
  for (const segment of inferred) {
    if (segment.kind === "property") {
      if (contexts.some(Array.isArray)) return { result:"blocked", assistance:`Choose Every item or a specific ${lastProperty} index` };
      lastProperty = segment.value;
      const next = contexts.flatMap((value) => value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, segment.value) ? [(value as Record<string, unknown>)[segment.value]] : []);
      if (!next.length) missingNodes.push(`property ${segment.value}`); contexts = next;
    } else if (segment.kind === "every") {
      if (contexts.length && contexts.some((value) => !Array.isArray(value))) return { result:"blocked", assistance:`${lastProperty} is not an array` };
      contexts = contexts.flatMap((value) => Array.isArray(value) ? value : []);
      if (!contexts.length) missingNodes.push("Every array item");
    } else {
      if (segment.value < 0) return { result:"blocked", assistance:"Enter a non-negative array index" };
      if (!Number.isInteger(segment.value)) return { result:"blocked", assistance:"Enter a non-negative whole-number array index" };
      if (contexts.length && contexts.some((value) => !Array.isArray(value))) return { result:"blocked", assistance:`${lastProperty} is not an array` };
      contexts = contexts.flatMap((value) => Array.isArray(value) && segment.value < value.length ? [value[segment.value]] : []);
      if (!contexts.length) missingNodes.push(`array index ${segment.value}`);
    }
  }
  const types = unique(contexts.map(valueType)); const readablePath = `/${inferred.map((segment) => segment.kind === "property" ? pointerToken(segment.value) : segment.kind === "every" ? "*" : segment.value).join("/")}`;
  return {
    result:contexts.length ? "accepted" : "unobserved", expression:expressionFor(inferred), readablePath,
    matchedValueCount:contexts.length, detectedTypes:types, examples:primitiveExamples(contexts),
    assistance:contexts.length ? `${contexts.length} value${contexts.length === 1 ? "" : "s"} match this target` : "Structurally valid but currently unobserved",
    missingNodes, requiresExpectedType:contexts.length === 0 || types.length !== 1,
  };
}
