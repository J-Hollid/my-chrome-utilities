import assert from 'node:assert/strict';
import {chmod, readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fixture} from './fixture.mjs';

export async function readCase(shape) {
  const texts = {'many short lines': 'short line\n'.repeat(180),
    'one long line': 'long'.repeat(8000),
    'Unicode characters across a boundary': 'a'.repeat(12287) + '🙂漢é'.repeat(2000)};
  assert.ok(Object.hasOwn(texts, shape), `Unknown shape: ${shape}`);
  const f = await fixture();
  try {
    await f.put('input.txt', texts[shape]);
    let args = ['read', 'input.txt'], reconstructed = '', pages = 0;
    for (;;) {
      const result = f.run(args);
      assert.equal(result.status, 0, result.stderr);
      const p = result.page;
      assert.equal(p.position.startByte, Buffer.byteLength(reconstructed));
      assert.ok(Buffer.byteLength(p.body) <= 12288);
      assert.ok(p.body.split('\n').length - Number(p.body.endsWith('\n')) <= 80);
      reconstructed += p.body;
      assert.ok(++pages < 20);
      if (p.complete) { assert.equal(p.continuation, null); break; }
      args = p.continuation.args;
    }
    assert.equal(reconstructed, texts[shape]);
    return {shape, pages, reconstructed: true, complete: true};
  } finally { await f.close(); }
}

export async function discoveryCase(directory, operation) {
  assert.ok((directory === 'docs with spaces' && operation === 'filename discovery') ||
    (directory === 'src' && operation === 'literal search for $() syntax'));
  const f = await fixture();
  try {
    for (let i = 0; i < 95; i++) await f.put(`${directory}/${String(i).padStart(3, '0')}.txt`, '$(touch SHOULD_NOT_EXIST)\n');
    await f.put('unrelated/file.txt', '$(touch SHOULD_NOT_EXIST)\n');
    const search = operation.startsWith('literal');
    let args = search ? ['search', directory, '--literal', '$(touch SHOULD_NOT_EXIST)'] : ['files', directory];
    let body = '', pages = 0;
    for (;;) {
      const result = f.run(args);
      assert.equal(result.status, 0, result.stderr);
      const p = result.page;
      assert.ok(Buffer.byteLength(p.body) <= 12288);
      assert.ok(p.body.split('\n').length - 1 <= 80);
      body += p.body; pages++;
      if (p.complete) break;
      assert.ok(p.continuation.command);
      args = p.continuation.args;
    }
    const expected = Array.from({length: 95}, (_, i) => `${directory}/${String(i).padStart(3, '0')}.txt${search ? ':1:$(touch SHOULD_NOT_EXIST)' : ''}\n`).join('');
    assert.equal(body, expected);
    assert.equal(pages, 2);
    assert.ok(!(await readdir(f.root)).includes('SHOULD_NOT_EXIST'));
    return {directory, operation, pages, scoped: true, stable: true, shellSafe: true};
  } finally { await f.close(); }
}

export async function inputCase(condition) {
  const f = await fixture();
  try {
    await f.put('input.txt', 'content\n'.repeat(100));
    let args = ['read', 'input.txt'], expected;
    if (condition === 'missing file') { args = ['read', 'absent.txt']; expected = 'File not found'; }
    else if (condition === 'unreadable file') {
      await chmod(path.join(f.root, 'input.txt'), 0); expected = 'Cannot read file';
    } else if (condition === 'no literal matches') {
      args = ['search', '.', '--literal', 'ABSENT']; expected = 'No matches';
    } else if (condition === 'input changed after the last page') {
      args = f.run(args).page.continuation.args;
      await f.put('input.txt', 'changed\n'.repeat(100)); expected = 'Input changed; restart read';
    } else throw new Error(`Unknown condition: ${condition}`);
    const result = f.run(args);
    if (condition === 'no literal matches') {
      assert.equal(result.status, 0); assert.equal(result.page.message, expected);
    } else { assert.notEqual(result.status, 0); assert.ok(result.stderr.includes(expected)); assert.equal(result.stdout, ''); }
    await chmod(path.join(f.root, 'input.txt'), 0o600);
    return {condition, result: expected, exit: result.status, falseComplete: false};
  } finally { await f.close(); }
}

export async function fullCase() {
  const f = await fixture();
  try {
    const input = 'Required instruction.\n'.repeat(2000);
    await f.put('required.prompt', input);
    await f.put('.swarmforge/state', 'unchanged');
    await f.put('receipt.json', '{"unchanged":true}');
    const before = await readdir(f.root);
    const result = f.run(['read', 'required.prompt', '--full']);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.page.body, input);
    assert.equal(result.page.complete, true);
    assert.deepEqual(await readdir(f.root), before);
    for (const [file, expected] of [['required.prompt', input], ['.swarmforge/state', 'unchanged'], ['receipt.json', '{"unchanged":true}']]) {
      assert.equal(await readFile(path.join(f.root, file), 'utf8'), expected);
    }
    return {complete: true, unchanged: true, confirmation: false};
  } finally { await f.close(); }
}
