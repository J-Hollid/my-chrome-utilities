import assert from 'node:assert/strict';
import {readFile, mkdtemp, rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

export async function inspectInstructions(role, route) {
  const root = await mkdtemp(path.resolve('tmp/retrieval-instructions-'));
  try {
    const output = path.join(root, 'startup.md');
    execFileSync('bb', ['swarmforge/scripts/role-agent-instruction.bb', role, output]);
    const startup = await readFile(output, 'utf8');
    const agents = await readFile('AGENTS.md', 'utf8');
    assert.match(startup, /If the current contents of AGENTS\.md were not supplied.*read AGENTS\.md once/);
    assert.doesNotMatch(startup, /^Read AGENTS\.md; obey its instructions\.$/m);
    assert.match(agents, /node swarmforge\/scripts\/retrieval\.mjs/);
    assert.match(agents, /Return each tool result once/);
    assert.match(agents, /Read explicit\s+required includes once per resolved path/);
    const required = [...startup.matchAll(/^Read (.+); obey its instructions\.$/gm)].map(([, file]) => file);
    const content = await Promise.all(required.map(file => readFile(file, 'utf8')));
    const effective = (route === 'native startup loading' ? [agents, ...content] : [...content, agents]).join('\n');
    assert.equal(effective.split(agents).length - 1, 1);
    assert.ok(effective.includes(await readFile(`swarmforge/roles/${role}.prompt`, 'utf8')));
    assert.ok(required.includes('swarmforge/scripts/shared-articles/handoffs.prompt'));
    assert.match(startup, /Preserve conditional role duties/);
    return {role, route, rulesOnce: true, completeRole: true, fixtureDelivery: true};
  } finally { await rm(root, {recursive: true, force: true}); }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  for (const [role, route] of [['specifier', 'native startup loading'], ['coder', 'explicit safe-boundary reading'],
    ['refactorer', 'native startup loading'], ['architect', 'explicit safe-boundary reading']]) {
    await inspectInstructions(role, route);
  }
  console.log(JSON.stringify({retrievalInstructions: {fixtureRoles: 4, conditionalRead: true}}));
}
