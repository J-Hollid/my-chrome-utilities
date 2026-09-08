import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {readCase, discoveryCase, inputCase, fullCase} from './contract-cases.mjs';
import {inspectInstructions} from './instruction-fixture.mjs';

const example = JSON.parse(process.argv[2] ?? '{}');
let result;
if (example.shape) result = await readCase(example.shape);
else if (example.directory) result = await discoveryCase(example.directory, example.operation);
else if (example.condition) result = await inputCase(example.condition);
else if (example.role) result = await inspectInstructions(example.role, example.route);
else if (example.case === 'full') result = await fullCase();
else if (example.case === 'pending') {
  const root = await mkdtemp(path.resolve('tmp/retrieval-pending-'));
  try {
    const output = path.join(root, 'startup.md');
    execFileSync('bb', ['swarmforge/scripts/role-agent-instruction.bb', 'architect', output]);
    const startup = await readFile(output, 'utf8');
    assert.match(startup, /a running role remains Pending until its effective input or explicit read is observed/);
    assert.match(startup, /Generated startup text alone is not activation proof/);
    result = {status: 'Pending', basis: 'generated instructions only; no session input or read observed', observedOtherRoleUse: false};
  } finally { await rm(root, {recursive: true, force: true}); }
} else throw new Error('Unknown contract example');
console.log(JSON.stringify({retrievalContract: result}));
