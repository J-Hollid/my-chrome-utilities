import type {RuleCondition, RuleRow} from '../detection/types.js';

export interface RuleStep {label: string; result: boolean | null; children?: RuleStep[]; actual?: string;}
const show = (value: unknown): string => value === undefined ? 'undefined' : JSON.stringify(value) ?? String(value);
const all = (steps: RuleStep[]): boolean | null => steps.some(step => step.result === false) ? false :
  steps.every(step => step.result === true) ? true : null;
const any = (steps: RuleStep[]): boolean | null => steps.some(step => step.result === true) ? true :
  steps.every(step => step.result === false) ? false : null;
const operatorNames: Record<string, string> = {
  equals: 'equals', does_not_equal: 'does not equal', contains: 'contains', does_not_contain: 'does not contain',
  starts_with: 'starts with', ends_with: 'ends with', is_defined: 'is defined', is_not_defined: 'is not defined',
  greater_than: 'is greater than', greater_than_or_equal_to: 'is greater than or equal to',
  less_than: 'is less than', less_than_or_equal_to: 'is less than or equal to',
};
function definedValue(row: RuleRow, key: string): boolean | null {
  if (row.dataKeys.includes(key)) return true;
  return row.dataComplete ? false : null;
}
function conditionStep(condition: RuleCondition, row: RuleRow): RuleStep {
  const data = row.data;
  const key = condition.variable.replace(/^udo\./, '');
  const actual = data[key];
  const operator = condition.operator.toLowerCase().replace(/[\s-]+/g, '_');
  const expected = condition.value;
  const text = operatorNames[operator] ?? condition.operator.replace(/_/g, ' ');
  const label = `${condition.variable} ${text}${['is_defined','is_not_defined'].includes(operator) ? '' : ` ${show(expected)}`}`;
  let result: boolean | null = null;
  if (operator === 'is_defined') result = definedValue(row, key);
  else if (operator === 'is_not_defined') {const exists = definedValue(row, key);result = exists === null ? null : !exists;}
  else if (actual !== undefined) {
    const left = String(actual), right = String(expected);
    if (operator === 'equals') result = left === right;
    if (operator === 'does_not_equal') result = left !== right;
    if (operator === 'contains') result = left.includes(right);
    if (operator === 'does_not_contain') result = !left.includes(right);
    if (operator === 'starts_with') result = left.startsWith(right);
    if (operator === 'ends_with') result = left.endsWith(right);
    if (operator.includes('ignore_case')) {
      const a = left.toLowerCase(), b = right.toLowerCase();
      if (operator.startsWith('equals')) result = a === b;
      if (operator.startsWith('does_not_equal')) result = a !== b;
      if (operator.startsWith('contains')) result = a.includes(b);
      if (operator.startsWith('does_not_contain')) result = !a.includes(b);
    }
    const a = Number(actual), b = Number(expected);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      if (operator === 'greater_than') result = a > b;
      if (operator === 'greater_than_or_equal_to') result = a >= b;
      if (operator === 'less_than') result = a < b;
      if (operator === 'less_than_or_equal_to') result = a <= b;
    }
  }
  return {label, result, actual: show(actual)};
}

function split(source: string, symbol: '&&' | '||'): string[] {
  const parts: string[] = []; let start = 0, depth = 0, quote = '', escaped = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i]!;
    if (quote) {if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === quote) quote = ''; continue;}
    if (char === '"' || char === "'") {quote = char; continue;}
    if (char === '(' || char === '[') depth++;
    if (char === ')' || char === ']') depth--;
    if (!depth && source.slice(i, i + 2) === symbol) {parts.push(source.slice(start, i).trim());start = i + 2;i++;}
  }
  parts.push(source.slice(start).trim());return parts;
}
function unwrap(source: string): string {
  let value = source.trim();
  while (value.startsWith('(') && value.endsWith(')')) {
    let depth = 0, outer = true;
    for (let i = 0; i < value.length - 1; i++) {if (value[i] === '(') depth++;if (value[i] === ')' && --depth === 0) {outer = false;break;}}
    if (!outer) break;
    value = value.slice(1, -1).trim();
  }
  return value;
}
function codeStep(source: string, row: RuleRow): RuleStep {
  const data = row.data;
  const value = unwrap(source);
  for (const [symbol, label, combine] of [['||','Any of',any],['&&','All of',all]] as const) {
    const parts = split(value, symbol);
    if (parts.length > 1) {const children = parts.map(part => codeStep(part, row));return {label, result: combine(children), children};}
  }
  const defined = value.match(/^typeof\s+d\[['"]([^'"]+)['"]\]\s*(===?|!==?)\s*['"]undefined['"]$/);
  if (defined) {
    const key = defined[1]!, exists = definedValue(row, key);
    return {label: `${key} ${defined[2]!.includes('!') ? 'is defined' : 'is not defined'}`,
      result: exists === null ? null : defined[2]!.includes('!') ? exists : !exists, actual: show(data[key])};
  }
  const contains = value.match(/^d\[['"]([^'"]+)['"]\](?:\.toString\(\))?(\.toLowerCase\(\))?\.indexOf\((['"])(.*?)\3(\.toLowerCase\(\))?\)\s*(>=|>|===?|!==?)\s*(-?\d+)$/);
  if (contains) {
    const key = contains[1]!, actual = data[key], expected = contains[4]!;
    const ignoreCase = Boolean(contains[2] && contains[5]);
    const left = ignoreCase ? String(actual).toLowerCase() : String(actual);
    const right = ignoreCase ? expected.toLowerCase() : expected;
    const position = left.indexOf(right), operator = contains[6]!, bound = Number(contains[7]);
    const result = actual === undefined ? null : operator === '>' ? position > bound :
      operator === '>=' ? position >= bound : operator.includes('!') ? position !== bound : position === bound;
    const positive = (operator === '>' && bound === -1) || (operator === '>=' && bound === 0) ||
      (operator.includes('!') && bound === -1);
    const negative = (operator.includes('=') && !operator.includes('!') && bound === -1);
    return {label: `${key} ${positive ? 'contains' : negative ? 'does not contain' : 'includes at position'} ${show(expected)}${ignoreCase ? ' (ignore case)' : ''}`,
      result, actual: show(actual)};
  }
  const comparison = value.match(/^d\[['"]([^'"]+)['"]\](?:\.toString\(\))?(\.toLowerCase\(\))?\s*(===?|!==?|>=|<=|>|<)\s*(['"])(.*?)\4(\.toLowerCase\(\))?$/);
  if (comparison) {
    const key = comparison[1]!, actual = data[key], op = comparison[3]!, expected = comparison[5]!;
    const ignoreCase = Boolean(comparison[2] && comparison[6]);
    const left = ignoreCase ? String(actual).toLowerCase() : String(actual);
    const right = ignoreCase ? expected.toLowerCase() : expected;
    let result: boolean | null = actual === undefined ? null : null;
    if (actual !== undefined) {
      if (op === '==' || op === '===') result = left === right;
      if (op === '!=' || op === '!==') result = left !== right;
      if (['>','<','>=','<='].includes(op) && Number.isFinite(Number(actual)) && Number.isFinite(Number(expected))) {
        const a = Number(actual), b = Number(expected);
        result = op === '>' ? a > b : op === '<' ? a < b : op === '>=' ? a >= b : a <= b;
      }
    }
    const label = `${key} ${{'==':'equals','===':'equals','!=':'does not equal','!==':'does not equal',
      '>':'is greater than','<':'is less than','>=':'is greater than or equal to','<=':'is less than or equal to'}[op]} ${show(expected)}${ignoreCase ? ' (ignore case)' : ''}`;
    return {label, result, actual: show(actual)};
  }
  return {label: 'This published condition cannot be translated', result: null};
}

export function explainRule(row: RuleRow): RuleStep | null {
  if (row.conditions?.length) {
    const groups = row.conditions.map(group => {const children = group.map(item => conditionStep(item, row));
      return {label: 'All of', result: all(children), children};});
    return {label: 'Any of', result: any(groups), children: groups};
  }
  const statement = row.expression?.match(/c\[['"]?\d+['"]?\]\s*\|=\s*([\s\S]*?)(?:}\s*catch|;\s*$)/)?.[1];
  return statement ? codeStep(statement.trim(), row) : null;
}
