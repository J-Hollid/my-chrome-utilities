import assert from 'node:assert/strict';
import {chmod, readFile, readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fixture} from './fixture.mjs';

const f = await fixture();
try {
  for (const [name, text] of [
    ['short.txt', Array.from({length: 205}, (_, i) => `row ${i}\n`).join('')],
    ['long.txt', 'x'.repeat(32000)],
    ['unicode.txt', 'a'.repeat(12287) + '🙂é漢字'.repeat(2400)],
  ]) {
    await f.put(name, text);
    let args = ['read', name], content = '', count = 0;
    do {
      const result = f.run(args);
      assert.equal(result.status, 0, result.stderr);
      const p = result.page;
      assert.equal(p.position.startByte, Buffer.byteLength(content));
      assert.ok(Buffer.byteLength(p.body) <= 12288);
      assert.ok(p.body.split('\n').length - (p.body.endsWith('\n') ? 1 : 0) <= 80);
      assert.equal(p.position.endByte, p.position.startByte + Buffer.byteLength(p.body));
      content += p.body; count++;
      assert.ok(count < 20, 'continuation must make progress');
      if (p.complete) { assert.equal(p.continuation, null); break; }
      assert.ok(p.continuation.command.includes('--cursor'));
      args = p.continuation.args;
    } while (true);
    assert.equal(content, text);
    assert.ok(count > 1);
  }
  await f.put('.gitignore', 'ignored/\n');
  await f.put('ignored/required.txt', 'Required content');
  await f.put('docs with spaces/z.txt', 'literal $(touch SHOULD_NOT_EXIST)\n');
  await f.put('docs with spaces/a.txt', 'same literal $(touch SHOULD_NOT_EXIST)\n');
  await f.put('elsewhere/z.txt', 'literal $(touch SHOULD_NOT_EXIST)\n');
  const files = f.run(['files', 'docs with spaces', '--glob', '*.txt']);
  assert.equal(files.status, 0, files.stderr);
  assert.equal(files.page.body, 'docs with spaces/a.txt\ndocs with spaces/z.txt\n');
  const search = f.run(['search', 'docs with spaces', '--literal', '$(touch SHOULD_NOT_EXIST)']);
  assert.equal(search.status, 0, search.stderr);
  assert.match(search.page.body, /^docs with spaces\/a.txt:1:/);
  assert.doesNotMatch(search.page.body, /elsewhere/);
  assert.ok(!(await readdir(f.root)).includes('SHOULD_NOT_EXIST'));
  assert.doesNotMatch(f.run(['files', '.']).page.body, /ignored/);
  assert.match(f.run(['files', 'ignored']).page.body, /ignored\/required.txt/);
  assert.equal(f.run(['read', 'ignored/required.txt']).page.body, 'Required content');
  const noMatches = f.run(['search', '.', '--literal', 'ABSENT NEEDLE']);
  assert.equal(noMatches.status, 0);
  assert.equal(noMatches.page.message, 'No matches');
  for (const operation of ['read', 'files', 'search']) {
    const result = f.run([operation, 'missing', ...(operation === 'search' ? ['--literal', 'x'] : [])]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /File not found/);
  }
  await f.put('locked.txt', 'not readable');
  await chmod(path.join(f.root, 'locked.txt'), 0);
  assert.match(f.run(['read', 'locked.txt']).stderr, /Cannot read file/);
  await chmod(path.join(f.root, 'locked.txt'), 0o600);
  const old = f.run(['read', 'long.txt']).page;
  await f.put('long.txt', 'y'.repeat(32000));
  const changed = f.run(old.continuation.args);
  assert.notEqual(changed.status, 0);
  assert.match(changed.stderr, /Input changed; restart read/);
  const full = f.run(['read', 'long.txt', '--full']);
  assert.equal(full.status, 0, full.stderr);
  assert.equal(full.page.body, 'y'.repeat(32000));
  assert.equal(full.page.complete, true);
  assert.equal(await readFile(path.join(f.root, 'long.txt'), 'utf8'), full.page.body);
  // The printed command is directly usable, including shell metacharacters in a path.
  const special = "docs with spaces/quote'$(touch SHOULD_NOT_EXIST).txt";
  await f.put(special, 'q'.repeat(13000));
  const first = f.run(['read', special]).page;
  const next = spawnSync('/bin/sh', ['-c', first.continuation.command], {cwd: f.root, encoding: 'utf8'});
  assert.equal(next.status, 0, next.stderr);
  assert.equal(first.body + JSON.parse(next.stdout).body, 'q'.repeat(13000));
  assert.ok(!(await readdir(f.root)).includes('SHOULD_NOT_EXIST'));
  for (let i = 0; i < 85; i++) await f.put(`pages/${String(i).padStart(3, '0')}.txt`, 'match\n');
  for (const args of [['files', 'pages'], ['search', 'pages', '--literal', 'match']]) {
    const first = f.run(args).page;
    assert.equal(first.complete, false);
    const second = f.run(first.continuation.args).page;
    assert.equal(second.complete, true);
    assert.equal((first.body + second.body).trimEnd().split('\n').length, 85);
    await f.put('pages/000.txt', args[0] === 'files' ? 'match\n' : 'match changed\n');
    if (args[0] === 'files') await f.put('pages/added.txt', 'match\n');
    const stale = f.run(first.continuation.args);
    assert.notEqual(stale.status, 0);
    assert.match(stale.stderr, /Input changed; restart read/);
    if (args[0] === 'files') {
      const {unlink} = await import('node:fs/promises');
      await unlink(path.join(f.root, 'pages/added.txt'));
    }
  }
  const badCursor = f.run(['read', 'long.txt', '--cursor', 'not-a-cursor']);
  assert.notEqual(badCursor.status, 0);
  assert.match(badCursor.stderr, /Invalid continuation/);
  const failedSearch = f.run(['search', '.', '--literal', 'two\nlines']);
  assert.notEqual(failedSearch.status, 0);
  assert.match(failedSearch.stderr, /Search failed/);
  console.log(JSON.stringify({retrieval: {paging: true, unicode: true, scoped: true,
    literal: true, ignoredExplicit: true, errors: true, changed: true, full: true, shellSafe: true}}));
} finally { await f.close(); }
