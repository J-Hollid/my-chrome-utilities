import {spawn} from 'node:child_process';
import {readFile, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

export const digest = value => createHash('sha256').update(value).digest('hex');
const text = bytes => new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(bytes);

async function command(file, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {cwd, stdio: ['ignore', 'pipe', 'pipe']});
    const out = [], err = [];
    child.stdout.on('data', chunk => out.push(chunk));
    child.stderr.on('data', chunk => err.push(chunk));
    child.once('error', reject);
    child.once('close', (status, signal) => resolve({status, signal,
      stdout: Buffer.concat(out), stderr: Buffer.concat(err).toString('utf8')}));
  });
}

async function readable(file) {
  try {
    const info = await stat(file);
    if (!(info.mode & 0o444)) throw new Error('Input has no read permission');
    return info;
  } catch (error) {
    const message = error.code === 'ENOENT' ? 'File not found' : 'Cannot read file';
    throw new Error(`${message}: ${file}: ${error.message}`);
  }
}

function checked(result) {
  if (![0, 1].includes(result.status)) {
    throw new Error(`Search failed (${result.signal ?? result.status}): ${result.stderr.trim()}`);
  }
  return result;
}

export async function query(options, root = process.cwd()) {
  const absolute = path.resolve(root, options.input);
  const input = path.relative(root, absolute) || '.';
  if (input === '..' || input.startsWith(`..${path.sep}`)) throw new Error('Input must be within the current repository directory');
  const info = await readable(absolute);
  const identity = JSON.stringify({root, input, operation: options.operation, glob: options.glob, literal: options.literal});
  if (options.operation === 'read') {
    if (!info.isFile()) throw new Error(`Cannot read file: ${input}: not a regular file`);
    let bytes;
    try { bytes = await readFile(absolute); }
    catch (error) { throw new Error(`Cannot read file: ${input}: ${error.message}`); }
    return {source: input, body: text(bytes), snapshot: digest(bytes), identity: digest(identity)};
  }
  const ignored = await command('git', ['check-ignore', '--quiet', '--', input], root);
  const common = [...(ignored.status === 0 ? ['--no-ignore', '--hidden'] : []),
    ...(options.glob === undefined ? [] : ['--glob', options.glob])];
  const listed = checked(await command('rg', ['--files', '--null', ...common, '--', input], root));
  const files = text(listed.stdout).split('\0').filter(Boolean).map(p => p.replace(/^\.\//, '')).sort();
  const body = files.length ? files.join('\n') + '\n' : '';
  if (options.operation === 'files') {
    return {source: input, body, identity: digest(identity), snapshot: digest(body), message: files.length ? undefined : 'No matches'};
  }
  // Include every scoped file's identity, so a changed input invalidates a continuation
  // even if its edited lines did not match the literal search.
  const identities = [];
  for (const file of files) {
    const meta = await readable(path.join(root, file));
    identities.push([file, meta.size, meta.mtimeMs, meta.ctimeMs]);
  }
  const result = checked(await command('rg', ['--json', '--fixed-strings', '--line-number',
    ...common, '--', options.literal, input], root));
  const matches = text(result.stdout).split('\n').filter(Boolean).map(line => JSON.parse(line))
    .filter(item => item.type === 'match').map(({data}) => {
      if (data.lines.text === undefined || data.path.text === undefined) throw new Error('Cannot read file: search result is not UTF-8 text');
      return {file: data.path.text.replace(/^\.\//, ''), line: data.line_number, value: data.lines.text};
    }).sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line);
  const matchBody = matches.map(m => `${m.file}:${m.line}:${m.value}${m.value.endsWith('\n') ? '' : '\n'}`).join('');
  return {source: input, body: matchBody, identity: digest(identity),
    snapshot: digest(JSON.stringify(identities) + matchBody), message: matches.length ? undefined : 'No matches'};
}
