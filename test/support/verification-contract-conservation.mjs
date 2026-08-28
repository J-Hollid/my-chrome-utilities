import ts from "typescript";

export const verificationContractConservationKinds = Object.freeze([
  "assertions",
  "fixtures",
  "evidence",
]);

export function verificationContractSyntaxLeaves(source, sourcePath) {
  const file = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const printer = ts.createPrinter({removeComments:true});
  const leaves = {assertions:[], fixtures:[], evidence:[]};
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "assert") {
      const method = node.expression.name.text;
      const last = node.arguments.at(-1);
      const hasMessage = method === "fail" || method === "ok" && node.arguments.length >= 2 ||
        ["throws", "rejects", "doesNotThrow"].includes(method) && node.arguments.length >= 3 ||
        !["fail", "ok", "throws", "rejects", "doesNotThrow"].includes(method) &&
          node.arguments.length >= 3;
      leaves.assertions.push(hasMessage
        ? `message:${printer.printNode(ts.EmitHint.Unspecified, last, file).replace(/\bmust\s+/gu, "")}`
        : `expression:${printer.printNode(ts.EmitHint.Unspecified, node.arguments[0], file)}`);
    }
    if (ts.isThrowStatement(node) && ts.isNewExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "Error" &&
        ts.isStringLiteralLike(node.expression.arguments?.[0])) {
      leaves.assertions.push(
        `message:${JSON.stringify(node.expression.arguments[0].text.replace(/\bmust\s+/gu, ""))}`,
      );
    }
    if (ts.isStringLiteralLike(node)) {
      if (/fixture/iu.test(node.text)) leaves.fixtures.push(node.text.split("/").at(-1));
      if (/Acceptance/u.test(node.text)) leaves.evidence.push(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return leaves;
}

function leafCounts(leaves) {
  const counts = new Map();
  for (const leaf of leaves) counts.set(leaf, (counts.get(leaf) ?? 0) + 1);
  return counts;
}

export function verificationContractLeavesByOwner(sourcesByOwner) {
  return Object.fromEntries(Object.entries(sourcesByOwner).map(([owner, source]) => [
    owner,
    verificationContractSyntaxLeaves(source, owner),
  ]));
}

export function verificationContractConservationFailures(manifest, leavesByOwner) {
  const failures = [];
  const owners = Object.keys(leavesByOwner).sort();
  if (manifest.version !== 1 || !manifest.inventory || typeof manifest.inventory !== "object") {
    return [{violation:"invalid-manifest"}];
  }
  if (JSON.stringify(manifest.owners) !== JSON.stringify(owners)) {
    failures.push({violation:"owner-inventory", expected:manifest.owners, actual:owners});
  }
  for (const kind of verificationContractConservationKinds) {
    const entries = manifest.inventory[kind];
    if (!Array.isArray(entries)) {
      failures.push({kind, violation:"invalid-inventory"});
      continue;
    }
    const declaredOccurrences = new Set();
    const expectedByLeaf = new Map();
    const countsByOwner = new Map(owners.map((owner) => [owner,
      leafCounts(leavesByOwner[owner]?.[kind] ?? []),
    ]));
    for (const entry of entries) {
      if (!entry || typeof entry.leaf !== "string" ||
          !Number.isSafeInteger(entry.occurrence) || entry.occurrence < 1 ||
          typeof entry.owner !== "string" || !owners.includes(entry.owner)) {
        failures.push({kind, violation:"invalid-entry", entry});
        continue;
      }
      const occurrenceKey = `${entry.leaf}\0${entry.occurrence}`;
      if (declaredOccurrences.has(occurrenceKey)) {
        failures.push({kind, leaf:entry.leaf, occurrence:entry.occurrence,
          violation:"duplicate-manifest-occurrence"});
        continue;
      }
      declaredOccurrences.add(occurrenceKey);
      const expected = expectedByLeaf.get(entry.leaf) ?? {count:0, owners:new Map()};
      expected.count += 1;
      expected.owners.set(entry.owner, (expected.owners.get(entry.owner) ?? 0) + 1);
      expectedByLeaf.set(entry.leaf, expected);
    }
    const expectedTotals = {
      distinctLeaves:expectedByLeaf.size,
      occurrences:[...expectedByLeaf.values()].reduce((sum, expected) => sum + expected.count, 0),
    };
    if (JSON.stringify(manifest.totals?.[kind]) !== JSON.stringify(expectedTotals)) {
      failures.push({kind, violation:"manifest-totals",
        expected:expectedTotals, actual:manifest.totals?.[kind]});
    }
    for (const [leaf, expected] of expectedByLeaf) {
      const occurrences = entries.filter((entry) => entry?.leaf === leaf)
        .map((entry) => entry.occurrence).sort((left, right) => left - right);
      const expectedOccurrences = Array.from({length:expected.count}, (_, index) => index + 1);
      if (JSON.stringify(occurrences) !== JSON.stringify(expectedOccurrences)) {
        failures.push({kind, leaf, violation:"occurrence-sequence",
          expected:expectedOccurrences, actual:occurrences});
      }
      const actualOwners = owners.map((owner) => ({
        owner,
        count:countsByOwner.get(owner).get(leaf) ?? 0,
      })).filter(({count}) => count);
      const actualCount = actualOwners.reduce((sum, {count}) => sum + count, 0);
      if (actualCount !== expected.count) {
        failures.push({kind, leaf, violation:"cardinality",
          expected:expected.count, actual:actualCount, owners:actualOwners});
      }
      const expectedOwners = [...expected.owners].sort(([left], [right]) => left.localeCompare(right))
        .map(([owner, count]) => ({owner, count}));
      if (JSON.stringify(actualOwners) !== JSON.stringify(expectedOwners)) {
        failures.push({kind, leaf, violation:"exclusive-owner",
          expectedOwners, owners:actualOwners});
      }
    }
  }
  return failures;
}

export function assertVerificationContractConservation(manifest, leavesByOwner) {
  const failures = verificationContractConservationFailures(manifest, leavesByOwner);
  if (failures.length) {
    throw new Error(`Verification contract conservation failed: ${JSON.stringify(failures)}`);
  }
}
