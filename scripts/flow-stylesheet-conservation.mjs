const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//gu, "");

const compactWhitespace = (value) => value
  .trim()
  .replace(/\s+/gu, " ");

const normalizedSelector = (value) => compactWhitespace(value)
  .replace(/\s*([,>{}+~])\s*/gu, "$1")
  .replace(/\s*\(\s*/gu, "(")
  .replace(/\s+\)/gu, ")");

const normalizedDeclarations = (value) => compactWhitespace(value)
  .replace(/\s*([,:;>{}+~])\s*/gu, "$1")
  .replace(/;$/u, "");

function splitSelectors(prelude) {
  const result = [];
  let start = 0, parentheses = 0, brackets = 0, quote;
  for (let index = 0; index < prelude.length; index += 1) {
    const character = prelude[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === "\"" || character === "'") quote = character;
    else if (character === "(") parentheses += 1;
    else if (character === ")") parentheses -= 1;
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets -= 1;
    else if (character === "," && parentheses === 0 && brackets === 0) {
      result.push(prelude.slice(start, index));
      start = index + 1;
    }
  }
  result.push(prelude.slice(start));
  return result.map(normalizedSelector).filter(Boolean);
}

function expandSelectorFunctions(selector) {
  const match = /:(?:is|where)\(/u.exec(selector);
  if (!match) return [selector];
  const opening = match.index + match[0].length - 1;
  let depth = 1, quote, closing = -1;
  for (let index = opening + 1; index < selector.length; index += 1) {
    const character = selector[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === "\"" || character === "'") quote = character;
    else if (character === "(") depth += 1;
    else if (character === ")" && --depth === 0) { closing = index; break; }
  }
  if (closing < 0) throw new Error(`Unclosed selector function: ${selector}`);
  const prefix = selector.slice(0, match.index);
  const suffix = selector.slice(closing + 1);
  return splitSelectors(selector.slice(opening + 1, closing))
    .flatMap((option) => expandSelectorFunctions(normalizedSelector(`${prefix}${option}${suffix}`)));
}

function closingBrace(source, opening) {
  let depth = 1, quote;
  for (let index = opening + 1; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === "\"" || character === "'") quote = character;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) return index;
  }
  throw new Error(`Unclosed CSS block at character ${opening}`);
}

function nextBoundary(source, start) {
  let parentheses = 0, brackets = 0, quote;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === "\"" || character === "'") quote = character;
    else if (character === "(") parentheses += 1;
    else if (character === ")") parentheses -= 1;
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets -= 1;
    else if (parentheses === 0 && brackets === 0 && (character === "{" || character === ";")) {
      return { index, character };
    }
  }
  return undefined;
}

export function stylesheetRuleInventory(source, origin = "stylesheet") {
  const entries = [];
  const visit = (content, contexts = []) => {
    let cursor = 0;
    while (cursor < content.length) {
      while (/\s/u.test(content[cursor] ?? "")) cursor += 1;
      if (cursor >= content.length) break;
      const boundary = nextBoundary(content, cursor);
      if (!boundary) throw new Error(`${origin} contains an unterminated CSS statement`);
      const rawPrelude = content.slice(cursor, boundary.index);
      const prelude = rawPrelude.trim().startsWith("@")
        ? normalizedSelector(rawPrelude)
        : normalizedSelector(rawPrelude);
      if (boundary.character === ";") {
        if (prelude) entries.push({ context:contexts.join(" > "), selector:prelude, declarations:";" });
        cursor = boundary.index + 1;
        continue;
      }
      const end = closingBrace(content, boundary.index);
      const body = content.slice(boundary.index + 1, end);
      if (prelude.startsWith("@")) visit(body, [...contexts, prelude]);
      else {
        const declarations = normalizedDeclarations(body);
        for (const selector of splitSelectors(prelude)) {
          for (const expanded of expandSelectorFunctions(selector)) {
            entries.push({ context:contexts.join(" > "), selector:expanded, declarations });
          }
        }
      }
      cursor = end + 1;
    }
  };
  visit(stripComments(source));
  return entries;
}

const identity = ({ context, selector, declarations }) => `${context}\n${selector}\n${declarations}`;
const sameRule = (left, right) => identity(left) === identity(right);

function localSelectorCandidates(selector) {
  const candidates = new Set([selector]);
  if (selector.startsWith(".twatility-studio .documentary-flow")) {
    candidates.add(selector.slice(".twatility-studio ".length));
  }
  if (selector.startsWith(".twatility-studio ")) {
    candidates.add(`.documentary-flow ${selector.slice(".twatility-studio ".length)}`);
  }
  if (!selector.startsWith(".documentary-flow")) candidates.add(`.documentary-flow ${selector}`);
  return candidates;
}

const extractedMatch = (base, extracted, kind) =>
  base.context === extracted.context &&
  base.declarations === extracted.declarations &&
  (kind === "bridge"
    ? base.selector === extracted.selector
    : localSelectorCandidates(base.selector).has(extracted.selector));

function removeUniqueMatch(pool, entry, predicate, description) {
  const matches = pool.flatMap((candidate, index) => predicate(candidate, entry) ? [index] : []);
  if (matches.length === 0) {
    throw new Error(`${description} has no approved-base match: ${identity(entry)}`);
  }
  pool.splice(matches[0], 1);
}

export function verifyFlowStylesheetConservation({
  baseGlobalSources,
  candidateGlobalSources,
  localSource,
  bridgeSource,
  approvedCandidateGlobalRules = [],
}) {
  const base = baseGlobalSources.flatMap(({ source, path }) => stylesheetRuleInventory(source, path));
  const remainingBase = [...base];
  const candidateGlobals = candidateGlobalSources.flatMap(({ source, path }) => stylesheetRuleInventory(source, path));
  const conservedCandidateGlobals = [...candidateGlobals];
  for (const rule of approvedCandidateGlobalRules) {
    removeUniqueMatch(conservedCandidateGlobals, rule, sameRule, "approved candidate global rule");
  }
  for (const rule of conservedCandidateGlobals) {
    removeUniqueMatch(remainingBase, rule, sameRule, "candidate global rule");
  }
  const local = stylesheetRuleInventory(localSource, "src/flow-graph/flow-workspace.css");
  const bridge = stylesheetRuleInventory(bridgeSource, "src/flow-graph/flow-workspace-shell.css");
  for (const rule of local) {
    removeUniqueMatch(remainingBase, rule, (baseRule, candidate) => extractedMatch(baseRule, candidate, "local"), "Flow-local rule");
  }
  for (const rule of bridge) {
    removeUniqueMatch(remainingBase, rule, (baseRule, candidate) => extractedMatch(baseRule, candidate, "bridge"), "Flow-shell bridge rule");
  }
  if (remainingBase.length) {
    throw new Error(`approved-base rules were lost during extraction:\n${remainingBase.map(identity).join("\n---\n")}`);
  }
  return {
    baseRuleCount:base.length,
    retainedGlobalRuleCount:conservedCandidateGlobals.length,
    addedGlobalRuleCount:approvedCandidateGlobalRules.length,
    localRuleCount:local.length,
    bridgeRuleCount:bridge.length,
    movedRuleCount:local.length + bridge.length,
    conservedExactlyOnce:true,
  };
}
