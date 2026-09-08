import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, readdir, writeFile, rm} from 'node:fs/promises';
import path from 'node:path';
import {verificationDigest as digest} from '../../../scripts/verification-evidence.mjs';

export async function verifyClojureLaneRegression(context) {
  const source = await readFile('test/swarmforge-process-contract-test.mjs', 'utf8');
  const body = source.slice(source.indexOf('const directClojureEntrypoints ='), source.indexOf('const runMainSource ='));
  assert.ok(body.includes('must be executed by a global or pack-local Clojure test lane'));
  const check = new (Object.getPrototypeOf(async function () {}).constructor)(
    'root', 'readdir', 'readFile', 'assert', 'path', 'acceptanceTestFiles',
    'acceptanceTestDirectory', 'babashkaTaskSource', 'verificationRegistrySource', body);
  const filename = 'project_observation_source_resolvers_test.clj';
  const test = await readFile('test/acceptance/' + filename, 'utf8');
  const wrapper = await readFile('test/project-observation-source-resolvers-test.mjs', 'utf8');
  const registry = await readFile('verification/packs.json', 'utf8');
  async function discovers(location) {
    const root = await mkdtemp(path.resolve('tmp/source-clojure-lane-'));
    try {
      const testDirectory = path.join(root, 'test/acceptance');
      await mkdir(testDirectory, {recursive: true});
      await writeFile(path.join(testDirectory, filename), test);
      const entry = path.join(root, location);
      await mkdir(path.dirname(entry), {recursive: true});
      await writeFile(entry, wrapper);
      try {
        await check(root, readdir, readFile, assert, path, [filename], testDirectory, '', registry);
        return {discovered: true};
      } catch (error) {
        assert.match(error.message, /must be executed by a global or pack-local Clojure test lane/);
        return {discovered: false};
      }
    } finally { await rm(root, {recursive: true, force: true}); }
  }
  const before = await discovers('test/project-observation-sources/acceptance-resolvers-test.mjs');
  const after = await discovers('test/project-observation-source-resolvers-test.mjs');
  const expectedPreRepairFailure = {discovered: false}, expectedRepairResult = {discovered: true};
  assert.deepEqual(before, expectedPreRepairFailure); assert.deepEqual(after, expectedRepairResult);
  if (!context) return;
  const fixture = {id: 'source-resolver-clojure-lane-v1', causalCategory: context.causalCategory,
    diagnosedBoundaryDigest: digest(context.diagnosedBoundary),
    input: {boundary: 'production process-contract lane census', before: 'nested wrapper', after: 'registered root wrapper'},
    expectedPreRepairFailure, expectedRepairResult};
  const fixtureDigest = digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression: {version: 2, incidentId: context.incidentId,
    failureDigest: context.failureDigest, fixture,
    preRepairResult: {status: 'failed', fixtureDigest, observed: before},
    repairResult: {status: 'passed', fixtureDigest, observed: after}}}));
}
