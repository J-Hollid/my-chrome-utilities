import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
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

export function verificationContractLeavesByOwner(sourcesByOwner) {
  return Object.fromEntries(Object.entries(sourcesByOwner).map(([owner, source]) => [
    owner,
    verificationContractSyntaxLeaves(source, owner),
  ]));
}

const immutableBaseline = {
  commit:"a62bde42ab1b9ec4471517ec028a2b368ef46139",
  path:"test/fixtures/verification-process-contract-conservation.json",
  sha256:"7ea22d66d9c499f2971a906f2d6753862c8506665da3a9d4fa793ef1242070b2",
};
const transitionAuthority = {
  commit:"0ff4b09bb4533c41714ccee0fa9949f951254a10",
  path:"features/modular-verification-packs.feature",
  scenario:"Modular verification packs 221",
};
const historicalBlobCache = new Map();
const authenticatedAuthorityPopulations = new WeakSet();
const sha40 = /^[a-f0-9]{40}$/u;

function declaredAuthorityCommits(manifest, refreshAuthority) {
  const commits=[];
  const failures=[];
  const declarations=[
    ...(Array.isArray(manifest?.transitions) ? manifest.transitions.map((entry, index) => ({
      authority:entry?.authority, source:`transition:${index}`,
    })) : []),
    ...(Array.isArray(manifest?.generations) ? manifest.generations.map((entry, index) => ({
      authority:entry?.authority, source:`generation:${index}`,
    })) : []),
    ...(refreshAuthority === undefined ? [] : [{
      authority:{commit:refreshAuthority}, source:"refresh-authority",
    }]),
  ];
  for (const {authority, source} of declarations) {
    if (!sha40.test(authority?.commit ?? "")) {
      failures.push({violation:"missing-authority", source});
    } else commits.push(authority.commit);
  }
  return {commits:[...new Set(commits)].sort(), failures};
}

function gitAuthorityOutcome(commit) {
  const readable=spawnSync("git", ["cat-file", "-e", `${commit}^{commit}`], {
    stdio:"ignore",
  }).status === 0;
  const ancestral=readable && spawnSync("git", ["merge-base", "--is-ancestor", commit, "HEAD"], {
    stdio:"ignore",
  }).status === 0;
  return {readable, ancestral};
}

export function resolveVerificationContractAuthorityPopulation(manifest, options = {}) {
  const allowedKeys=["refreshAuthority", "testOnlyAncestryResolver"];
  if (Object.keys(options).some((key) => !allowedKeys.includes(key)) ||
      options.testOnlyAncestryResolver !== undefined &&
        typeof options.testOnlyAncestryResolver !== "function") {
    throw new Error("Authority discovery accepts only refresh authority or isolated Git outcomes");
  }
  const derived=declaredAuthorityCommits(manifest, options.refreshAuthority);
  const outcomes=derived.commits.map((commit) => {
    const gitOutcome=gitAuthorityOutcome(commit);
    const testRestriction=options.testOnlyAncestryResolver?.(commit);
    if (testRestriction !== undefined &&
        (typeof testRestriction?.readable !== "boolean" ||
          typeof testRestriction?.ancestral !== "boolean")) {
      throw new Error("Test authority outcomes require readable and ancestral booleans");
    }
    const result=testRestriction === undefined ? gitOutcome : {
      readable:gitOutcome.readable && testRestriction.readable,
      ancestral:gitOutcome.ancestral && testRestriction.ancestral,
    };
    return {commit, readable:result?.readable === true, ancestral:result?.ancestral === true};
  });
  const failures=[...derived.failures];
  for (const outcome of outcomes) {
    if (!outcome.readable) failures.push({violation:"unreadable-authority", commit:outcome.commit});
    else if (!outcome.ancestral) {
      failures.push({violation:"non-ancestral-authority", authority:{commit:outcome.commit}});
    }
  }
  const population=Object.freeze({
    commits:Object.freeze([...derived.commits]),
    outcomes:Object.freeze(outcomes.map(Object.freeze)),
    failures:Object.freeze(failures.map(Object.freeze)),
    refreshAuthority:options.refreshAuthority ?? null,
  });
  authenticatedAuthorityPopulations.add(population);
  return population;
}

function authorityPopulationFailures(manifest, population) {
  if (!authenticatedAuthorityPopulations.has(population)) {
    return [{violation:"unauthenticated-authority-population"}];
  }
  const expected=declaredAuthorityCommits(manifest,
    population.refreshAuthority ?? undefined);
  if (expected.failures.length) return expected.failures;
  if (canonicalJson(expected.commits) !== canonicalJson(population.commits)) {
    return [{violation:"authority-population-mismatch",
      expected:expected.commits, actual:population.commits}];
  }
  return [...population.failures];
}

function gitBlob(commit, blobPath) {
  const identity=`${commit}:${blobPath}`;
  if (historicalBlobCache.has(identity)) return historicalBlobCache.get(identity);
  const result=spawnSync("git", ["show", identity], {encoding:null, stdio:["ignore", "pipe", "pipe"]});
  const blob=result.status === 0 ? result.stdout : null;
  historicalBlobCache.set(identity, blob);
  return blob;
}

function immutableBaselineFailures(manifest) {
  const blob=gitBlob(immutableBaseline.commit, immutableBaseline.path);
  if (!blob || createHash("sha256").update(blob).digest("hex") !== immutableBaseline.sha256) {
    return [{violation:"immutable-baseline-identity"}];
  }
  let baseline;
  try { baseline=JSON.parse(blob.toString("utf8")); }
  catch { return [{violation:"immutable-baseline-identity"}]; }
  const projectionKeys=["version", "owners", "provenance", "totals"];
  if (projectionKeys.some((key) => canonicalJson(manifest[key]) !== canonicalJson(baseline[key]))) {
    return [{violation:"immutable-baseline-projection"}];
  }
  for (const kind of verificationContractConservationKinds) {
    const actual=manifest.inventory?.[kind], expected=baseline.inventory?.[kind];
    if (canonicalJson(actual) === canonicalJson(expected)) continue;
    const sorted = (entries) => Array.isArray(entries) ? [...entries]
      .map((entry) => canonicalJson(entry)).sort() : entries;
    if (canonicalJson(sorted(actual)) === canonicalJson(sorted(expected))) {
      return [{kind, violation:"immutable-baseline-order"}];
    }
    return [{kind, violation:"immutable-baseline-projection"}];
  }
  return [];
}

function parsedTransitionAuthority(commit) {
  const cacheKey=`transition-authority\0${commit}`;
  if (historicalBlobCache.has(cacheKey)) return historicalBlobCache.get(cacheKey);
  const blob=gitBlob(commit, transitionAuthority.path);
  if (!blob) {
    const missing={error:"exact-authority-feature-blob"};
    historicalBlobCache.set(cacheKey, missing);
    return missing;
  }
  const source=blob.toString("utf8");
  const commentAndOutline = /(?:^|\n)  # Modular verification packs 221\r?\n  Scenario Outline: Modular verification packs 221(?:\r?\n|$)/u;
  if (!commentAndOutline.test(source)) {
    const missing={error:"exact-authority-scenario"};
    historicalBlobCache.set(cacheKey, missing);
    return missing;
  }
  const temporaryRoot=mkdtempSync(path.join(os.tmpdir(), "verification-authority-"));
  try {
    const featurePath=path.join(temporaryRoot, "modular-verification-packs.feature");
    const irPath=path.join(temporaryRoot, "authority.json");
    writeFileSync(featurePath, blob);
    const parsed=spawnSync("bb", ["gherkin-parser", featurePath, irPath], {
      encoding:"utf8", stdio:["ignore", "pipe", "pipe"],
    });
    if (parsed.status !== 0) throw new Error(parsed.stderr || "locked Gherkin parser failed");
    const document=JSON.parse(readFileSync(irPath, "utf8"));
    const scenarios=document.scenarios.filter(({name}) => name === transitionAuthority.scenario);
    const result=scenarios.length === 1 ? {examples:scenarios[0].examples} :
      {error:"exact-authority-scenario"};
    historicalBlobCache.set(cacheKey, result);
    return result;
  } catch {
    const invalid={error:"exact-authority-scenario"};
    historicalBlobCache.set(cacheKey, invalid);
    return invalid;
  } finally {
    rmSync(temporaryRoot, {recursive:true, force:true});
  }
}

function transitionAuthorityFailures(transition, ancestralAuthorityCommits) {
  if (!transition?.authority || typeof transition.authority.commit !== "string" ||
      typeof transition.authority.path !== "string" ||
      typeof transition.authority.scenario !== "string" || !transition.from || !transition.to) {
    return [{violation:"invalid-transition", transition}];
  }
  const authority=transition.authority;
  if (!ancestralAuthorityCommits?.has(authority.commit)) {
    return [{violation:"non-ancestral-authority", authority}];
  }
  if (authority.path !== transitionAuthority.path) {
    return [{violation:"exact-authority-feature-path", authority}];
  }
  if (authority.commit !== transitionAuthority.commit) {
    return [{violation:"exact-authority-commit", authority}];
  }
  const parsed=parsedTransitionAuthority(authority.commit);
  if (parsed.error) return [{violation:parsed.error, authority}];
  const scenarioRows=parsed.examples.filter((row) => row.authority === authority.scenario);
  if (scenarioRows.length === 0) {
    return [{violation:"exact-authority-scenario", authority}];
  }
  const exactRows=scenarioRows.filter((row) =>
    row.prior_leaf === transition.from.leaf && row.owner === transition.from.owner &&
    row.owner === transition.to.owner && row.successor_leaf === transition.to.leaf &&
    transition.from.occurrence === 1 && transition.to.occurrence === 1);
  return exactRows.length === 1 ? [] :
    [{violation:"exact-authority-example-row", authority, matches:exactRows.length}];
}

function leafCounts(leaves) {
  const counts = new Map();
  for (const leaf of leaves) counts.set(leaf, (counts.get(leaf) ?? 0) + 1);
  return counts;
}

const canonicalJson = (value) => JSON.stringify(value);
const occurrenceIdentity = (kind, entry) =>
  `${kind}\0${entry.owner}\0${entry.leaf}\0${entry.occurrence}`;

function inventoryTotals(inventory) {
  return Object.fromEntries(verificationContractConservationKinds.map((kind) => {
    const entries = inventory[kind];
    return [kind, { distinctLeaves:new Set(entries.map(({leaf}) => leaf)).size,
      occurrences:entries.length }];
  }));
}

function canonicalInventory(leavesByOwner) {
  const owners = Object.keys(leavesByOwner).sort();
  return Object.fromEntries(verificationContractConservationKinds.map((kind) => {
    const occurrences = new Map();
    const entries = [];
    for (const owner of owners) for (const leaf of leavesByOwner[owner]?.[kind] ?? []) {
      const occurrence = (occurrences.get(leaf) ?? 0) + 1;
      occurrences.set(leaf, occurrence);
      entries.push({ leaf, owner, occurrence });
    }
    return [kind, entries];
  }));
}

export function verificationContractSourceState(sourcesByOwner) {
  const owners = Object.keys(sourcesByOwner).sort();
  return {
    leavesByOwner:verificationContractLeavesByOwner(sourcesByOwner),
    sourceSha256:owners.map((owner) => ({ owner,
      sha256:createHash("sha256").update(sourcesByOwner[owner]).digest("hex") })),
  };
}

export function canonicalVerificationContractGeneration(state, authority, id) {
  const inventory = canonicalInventory(state.leavesByOwner);
  return { id, authority:structuredClone(authority),
    ownerSources:structuredClone(state.sourceSha256), totals:inventoryTotals(inventory), inventory };
}

function transitionFailures(manifest, leavesByOwner, ancestralAuthorityCommits) {
  const failures = [];
  const transitions = manifest.transitions;
  if (!Array.isArray(transitions)) return [{violation:"invalid-transitions"}];
  const historical = new Set();
  for (const kind of verificationContractConservationKinds) {
    for (const entry of manifest.inventory?.[kind] ?? []) historical.add(occurrenceIdentity(kind, entry));
    for (const generation of manifest.generations ?? []) {
      for (const entry of generation.inventory?.[kind] ?? []) {
        historical.add(occurrenceIdentity(kind, entry));
      }
    }
  }
  const sources = new Set(), destinations = new Set(), ids = new Set();
  const edges = new Map();
  for (const transition of transitions) {
    const valid = transition && typeof transition.id === "string" &&
      verificationContractConservationKinds.includes(transition.kind) &&
      [transition.from, transition.to].every((entry) => entry && typeof entry.leaf === "string" &&
        typeof entry.owner === "string" && Number.isSafeInteger(entry.occurrence) && entry.occurrence > 0) &&
      transition.authority && typeof transition.authority.commit === "string" &&
      typeof transition.authority.path === "string" && typeof transition.authority.scenario === "string";
    if (!valid) { failures.push({violation:"invalid-transition", transition}); continue; }
    const source = occurrenceIdentity(transition.kind, transition.from);
    const destination = occurrenceIdentity(transition.kind, transition.to);
    if (ids.has(transition.id)) failures.push({violation:"transition-id-duplicate", id:transition.id});
    if (sources.has(source)) failures.push({violation:"transition-source-duplicate", source});
    if (destinations.has(destination)) {
      failures.push({violation:"transition-destination-duplicate", destination});
    }
    ids.add(transition.id); sources.add(source); destinations.add(destination); edges.set(source, destination);
    if (!historical.has(source)) failures.push({violation:"transition-source-unknown", source});
    const sourceCount=(leavesByOwner[transition.from.owner]?.[transition.kind] ?? [])
      .filter((leaf) => leaf === transition.from.leaf).length;
    if (sourceCount) failures.push({violation:"transition-source-present", source, actual:sourceCount});
    failures.push(...transitionAuthorityFailures(transition, ancestralAuthorityCommits));
  }
  for (const transition of transitions.filter((candidate) => candidate?.to)) {
    const destination = occurrenceIdentity(transition.kind, transition.to);
    if (sources.has(destination)) continue;
    const owners = Object.entries(leavesByOwner).filter(([, leaves]) =>
      (leaves[transition.kind] ?? []).includes(transition.to.leaf)).map(([owner]) => owner);
    const destinationCount=(leavesByOwner[transition.to.owner]?.[transition.kind] ?? [])
      .filter((leaf) => leaf === transition.to.leaf).length;
    if (destinationCount !== 1 || transition.to.occurrence !== 1) {
      failures.push({violation:"transition-successor-ambiguous", destination, actual:destinationCount});
    }
    if (owners.length !== 1 || owners[0] !== transition.to.owner) {
      failures.push({violation:"transition-successor-owner", destination, owners});
    }
  }
  for (const source of sources) {
    const seen = new Set();
    let cursor = source;
    while (edges.has(cursor)) {
      if (seen.has(cursor)) { failures.push({violation:"transition-cycle", source}); break; }
      seen.add(cursor); cursor = edges.get(cursor);
    }
  }
  return failures;
}

function effectiveBaselineInventory(manifest) {
  const transitionBySource = new Map((manifest.transitions ?? []).map((transition) => [
    occurrenceIdentity(transition.kind, transition.from), transition,
  ]));
  return Object.fromEntries(verificationContractConservationKinds.map((kind) => {
    const entries = [];
    for (const entry of manifest.inventory[kind] ?? []) {
      let current = {kind, ...entry};
      const seen = new Set();
      while (transitionBySource.has(occurrenceIdentity(current.kind, current))) {
        const key = occurrenceIdentity(current.kind, current);
        if (seen.has(key)) break;
        seen.add(key);
        const transition = transitionBySource.get(key);
        current = {kind:transition.kind, ...transition.to};
      }
      entries.push({leaf:current.leaf, owner:current.owner, occurrence:current.occurrence});
    }
    return [kind, entries];
  }));
}

export function verificationContractConservationFailures(manifest, leavesByOwner, options = {}) {
  const failures = [];
  const owners = Object.keys(leavesByOwner).sort();
  if (manifest.version !== 1 || !manifest.inventory || typeof manifest.inventory !== "object") {
    return [{violation:"invalid-manifest"}];
  }
  const baselineFailures=immutableBaselineFailures(manifest);
  if (baselineFailures.length) return baselineFailures;
  if (Object.hasOwn(options, "ancestralAuthorityCommits")) {
    return [{violation:"caller-supplied-authority-population"}];
  }
  const populationFailures=authorityPopulationFailures(manifest, options.authorityPopulation);
  if (populationFailures.length) return populationFailures;
  const ancestralAuthorityCommits=new Set(options.authorityPopulation.outcomes
    .filter(({ancestral}) => ancestral).map(({commit}) => commit));
  const allowedKeys = ["generations", "inventory", "owners", "provenance", "totals",
    "transitions", "version"];
  if (Object.keys(manifest).some((key) => !allowedKeys.includes(key))) {
    failures.push({violation:"task-local-exception-or-unknown-field"});
  }
  if (JSON.stringify(manifest.owners) !== JSON.stringify(owners)) {
    failures.push({violation:"owner-inventory", expected:manifest.owners, actual:owners});
  }
  failures.push(...transitionFailures(manifest, leavesByOwner,
    ancestralAuthorityCommits));
  const effectiveInventory = effectiveBaselineInventory(manifest);
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
    const effectiveByLeaf = new Map();
    for (const entry of effectiveInventory[kind]) {
      const expected = effectiveByLeaf.get(entry.leaf) ?? {count:0, owners:new Map()};
      expected.count += 1;
      expected.owners.set(entry.owner, (expected.owners.get(entry.owner) ?? 0) + 1);
      effectiveByLeaf.set(entry.leaf, expected);
    }
    for (const [leaf, expected] of effectiveByLeaf) {
      const occurrences = effectiveInventory[kind].filter((entry) => entry?.leaf === leaf)
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
  if (!Array.isArray(manifest.generations) || manifest.generations.length === 0) {
    failures.push({violation:"missing-current-generation"});
  } else {
    const generationIds = new Set();
    for (const generation of manifest.generations) {
      if (!generation || typeof generation.id !== "string" || generationIds.has(generation.id)) {
        failures.push({violation:"invalid-generation-id", id:generation?.id});
      }
      generationIds.add(generation?.id);
      if (!ancestralAuthorityCommits.has(generation?.authority?.commit)) {
        failures.push({violation:"non-ancestral-authority", authority:generation?.authority});
      }
    }
    const current = manifest.generations.at(-1);
    const state = { leavesByOwner, sourceSha256:options.sourceSha256 ?? current.ownerSources };
    const canonical = canonicalVerificationContractGeneration(state, current.authority, current.id);
    if (canonicalJson(current.ownerSources) !== canonicalJson(canonical.ownerSources)) {
      failures.push({violation:"source-digest", expected:current.ownerSources,
        actual:canonical.ownerSources});
    }
    if (canonicalJson(current.inventory) !== canonicalJson(canonical.inventory) ||
        canonicalJson(current.totals) !== canonicalJson(canonical.totals)) {
      failures.push({violation:"current-generation-inventory"});
    }
    if (canonicalJson(current) !== canonicalJson(canonical) &&
        !failures.some(({violation}) => ["source-digest", "current-generation-inventory"]
          .includes(violation))) {
      failures.push({violation:"noncanonical-generation"});
    }
  }
  return failures;
}

function transitionDestinationFor(manifest, kind, entry) {
  const transition = (manifest.transitions ?? []).find((candidate) =>
    occurrenceIdentity(candidate.kind, candidate.from) === occurrenceIdentity(kind, entry));
  return transition?.to;
}

export function refreshVerificationContractConservationManifest(manifest, state, {
  authority, id, authorityPopulation,
}) {
  const populationFailures=authorityPopulationFailures(manifest, authorityPopulation);
  if (authorityPopulation?.refreshAuthority !== authority?.commit || populationFailures.length) {
    throw new Error(`Refresh refuses unauthenticated authority population: ${JSON.stringify(
      populationFailures.length ? populationFailures : [{violation:"refresh-authority-mismatch"}],
    )}`);
  }
  const ancestralAuthorityCommits=new Set(authorityPopulation.outcomes
    .filter(({ancestral}) => ancestral).map(({commit}) => commit));
  const allowedKeys = ["generations", "inventory", "owners", "provenance", "totals",
    "transitions", "version"];
  if (Object.keys(manifest).some((key) => !allowedKeys.includes(key))) {
    throw new Error("Refresh refuses task-local exceptions and unknown manifest fields");
  }
  const baselineFailures=immutableBaselineFailures(manifest);
  if (baselineFailures.length) {
    throw new Error(`Refresh refuses invalid immutable baseline: ${JSON.stringify(baselineFailures)}`);
  }
  const authenticationFailures=(manifest.transitions ?? []).flatMap((transition) =>
    transitionAuthorityFailures(transition, ancestralAuthorityCommits));
  if (authenticationFailures.length) {
    throw new Error(`Refresh refuses unauthenticated successor authority: ${JSON.stringify(authenticationFailures)}`);
  }
  const generation = canonicalVerificationContractGeneration(state, authority, id);
  const priorInventory = manifest.generations?.at(-1)?.inventory ?? manifest.inventory;
  for (const kind of verificationContractConservationKinds) {
    const currentCounts = new Map();
    for (const entry of generation.inventory[kind]) {
      const key=`${entry.owner}\0${entry.leaf}`;
      currentCounts.set(key, (currentCounts.get(key) ?? 0) + 1);
    }
    const priorGroups = new Map();
    for (const entry of priorInventory[kind] ?? []) {
      const key=`${entry.owner}\0${entry.leaf}`;
      if (!priorGroups.has(key)) priorGroups.set(key, []);
      priorGroups.get(key).push(entry);
    }
    for (const [key, entries] of priorGroups) {
      const deficit=entries.length-(currentCounts.get(key) ?? 0);
      if (deficit <= 0) continue;
      const mapped=entries.filter((entry) => {
        const destination=transitionDestinationFor(manifest, kind, entry);
        return destination && (currentCounts.get(`${destination.owner}\0${destination.leaf}`) ?? 0) > 0;
      });
      if (mapped.length !== deficit) {
        const entry=entries.find((candidate) => !transitionDestinationFor(manifest, kind, candidate)) ?? entries[0];
        throw new Error(`Refresh refuses unmapped prior occurrence: ${occurrenceIdentity(kind, entry)}`);
      }
    }
  }
  if (manifest.generations?.length) {
    const current = manifest.generations.at(-1);
    const comparable = canonicalVerificationContractGeneration(state, current.authority, current.id);
    if (canonicalJson(current) === canonicalJson(comparable) &&
        canonicalJson(current.authority) === canonicalJson(authority) && current.id === id) {
      return structuredClone(manifest);
    }
  }
  const refreshed = {...structuredClone(manifest),
    generations:[...(manifest.generations ?? []), generation]};
  const failures = verificationContractConservationFailures(refreshed, state.leavesByOwner,
    {sourceSha256:state.sourceSha256, authorityPopulation});
  if (failures.length) {
    throw new Error(`Refresh refuses invalid conservation history: ${JSON.stringify(failures)}`);
  }
  return refreshed;
}

export function assertVerificationContractConservation(manifest, leavesByOwner, options = {}) {
  const failures = verificationContractConservationFailures(manifest, leavesByOwner, options);
  if (failures.length) {
    throw new Error(`Verification contract conservation failed: ${JSON.stringify(failures)}`);
  }
}
