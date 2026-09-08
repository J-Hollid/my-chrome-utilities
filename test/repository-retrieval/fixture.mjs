import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

export const helper = path.resolve('swarmforge/scripts/retrieval.mjs');
export async function fixture() {
  const root = await mkdtemp(path.resolve('tmp/retrieval-'));
  spawnSync('git', ['init', '--quiet', root]);
  return {
    root,
    async put(name, text) {
      await mkdir(path.dirname(path.join(root, name)), {recursive: true});
      await writeFile(path.join(root, name), text);
    },
    run(args) {
      const result = spawnSync(process.execPath, [helper, ...args, '--json'], {
        cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
      });
      return {...result, page: result.status === 0 ? JSON.parse(result.stdout) : null};
    },
    close: () => rm(root, {recursive: true, force: true}),
  };
}
