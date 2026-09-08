export function options(argv) {
  const [operation, input, ...rest] = argv;
  if (!['read', 'files', 'search'].includes(operation) || !input) {
    throw new Error('Usage: retrieval.mjs read <file> [--full] | files <directory> [--glob <pattern>] | search <directory> --literal <text> [--cursor <token>] [--json]');
  }
  const result = {operation, input, json: false, full: false};
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    if (flag === '--json') result.json = true;
    else if (flag === '--full') result.full = true;
    else if (['--cursor', '--glob', '--literal'].includes(flag) && i + 1 < rest.length) {
      const key = flag.slice(2);
      if (result[key] !== undefined) throw new Error(`Repeated option: ${flag}`);
      result[key] = rest[++i];
    } else throw new Error(`Unknown or incomplete option: ${flag}`);
  }
  if (operation === 'search' && result.literal === undefined) throw new Error('Search requires --literal <text>');
  if (operation !== 'search' && result.literal !== undefined) throw new Error('--literal requires search');
  if (operation === 'read' && result.glob !== undefined) throw new Error('--glob requires discovery');
  if (result.full && (operation !== 'read' || result.cursor)) throw new Error('--full requires a read without a cursor');
  return result;
}
