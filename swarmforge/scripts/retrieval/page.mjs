import {fileURLToPath} from 'node:url';

const entry = fileURLToPath(new URL('../retrieval.mjs', import.meta.url));
const quote = value => `'${value.replaceAll("'", "'\\''")}'`;

function cursorStart(cursor, result, bytes) {
  if (!cursor) return 0;
  let value;
  try { value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')); }
  catch { throw new Error('Invalid continuation'); }
  if (value.version !== 1 || value.identity !== result.identity || value.snapshot !== result.snapshot) {
    throw new Error('Input changed; restart read');
  }
  if (!Number.isSafeInteger(value.offset) || value.offset <= 0 || value.offset >= bytes.length ||
      (bytes[value.offset] & 0xc0) === 0x80) throw new Error('Invalid continuation position');
  return value.offset;
}

function continuation(result, options, offset) {
  const token = Buffer.from(JSON.stringify({version: 1, identity: result.identity,
    snapshot: result.snapshot, offset})).toString('base64url');
  const args = [options.operation, options.input,
    ...(options.glob === undefined ? [] : ['--glob', options.glob]),
    ...(options.literal === undefined ? [] : ['--literal', options.literal]),
    '--cursor', token, ...(options.json ? ['--json'] : [])];
  return {args, command: [process.execPath, entry, ...args].map(quote).join(' ')};
}

export function page(result, options) {
  const bytes = Buffer.from(result.body);
  const start = cursorStart(options.cursor, result, bytes);
  let end = bytes.length;
  if (!options.full) {
    end = Math.min(start + 12288, bytes.length);
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    let lines = 0;
    for (let i = start; i < end; i++) {
      if (bytes[i] === 10 && ++lines === 80) { end = i + 1; break; }
    }
  }
  const prefix = bytes.subarray(0, start).toString('utf8');
  const body = bytes.subarray(start, end).toString('utf8');
  const startLine = prefix.split('\n').length;
  const complete = end === bytes.length;
  return {source: result.source, position: {startByte: start, endByte: end,
    startLine, endLine: startLine + (body.match(/\n/g)?.length ?? 0)},
    body, complete, message: result.message,
    continuation: complete ? null : continuation(result, options, end)};
}

export function render(result, json) {
  if (json) return JSON.stringify(result) + '\n';
  const {position: p, body} = result;
  return `Source: ${JSON.stringify(result.source)}; bytes [${p.startByte}, ${p.endByte}); line ${p.startLine}\n` +
    body + (body && !body.endsWith('\n') ? '\n' : '') +
    (result.message ? `${result.message}\n` : '') +
    (result.complete ? 'Complete: yes\n' : `Complete: no\nContinue: ${result.continuation.command}\n`);
}
