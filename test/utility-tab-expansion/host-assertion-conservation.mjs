import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';

export async function assertHostAssertionConservation() {
  const prior=execFileSync('git',['show','d5c876f400:test/modular-utility-architecture-test.mjs'],{encoding:'utf8'});
  const a=prior.indexOf('assert.deepEqual(utilityRegistry.map');
  const b=prior.indexOf('assert.deepEqual(architectureViolations');
  const c=prior.indexOf('const captureScope=');
  const d=prior.indexOf('const sidePanelSource=');
  assert.ok(a>0&&b>a&&c>b&&d>c,'Approved assertion boundaries exist');
  const host=await readFile('test/utility-tab-expansion/host-contract.mjs','utf8');
  assert.equal(host.slice(host.indexOf('assert.deepEqual(utilityRegistry.map')),prior.slice(a,b)+prior.slice(c,d),
    'Every extracted assertion and its fixture remain byte-identical');
  assert.equal(await readFile('test/modular-utility-architecture-test.mjs','utf8'),
    "import './utility-tab-expansion/host-contract.mjs';\n"+prior.slice(0,a)+prior.slice(b,c)+prior.slice(d),
    'Full original task executes the extracted assertions and every remaining assertion');
  for(const file of ['test/project-observation-sources-browser-test.mjs',
    'test/project-observation-sources/browser/group-runner.mjs'])
    assert.equal(await readFile(file,'utf8'),execFileSync('git',['show','d5c876f400:'+file],{encoding:'utf8'}),
      'Original source runtime coverage remains unchanged: '+file);
}
