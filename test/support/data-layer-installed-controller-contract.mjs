import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { architectureViolations } from
  "../../scripts/check-architecture.mjs";

export async function verifyPreparedInstalledController(id) {
  const module = await import(`../../dist/data-layer-installed/${id}/index.js`);
  const directory = `src/data-layer-installed/${id}`;
  const paths = (await readdir(directory, { recursive:true })).filter((file) =>
    file.endsWith(".ts")).map((file) => `${directory}/${file}`);
  const files = new Map(await Promise.all(paths.map(async (file) =>
    [file, await readFile(file, "utf8")])));
  const source = files.get(`${directory}/index.ts`);
  const rootSource = await readFile("src/side-panel.ts", "utf8");
  assert.equal(module.installedControllerDefinition.id, id);
  assert.equal(module.installedControllerDefinition.capabilities.length > 0, true);
  assert.match(source, /export interface \w+InstalledPorts/u);
  if (rootSource.split("\n").length - 1 > 500) {
    for (const controllerSource of files.values()) {
      assert.doesNotMatch(controllerSource,
        /addEventListener\(|\.subscribe\(|setTimeout\(|setInterval\(/u,
        "a prepared controller must remain unmounted and behavior-free");
    }
  }
  assert.deepEqual(architectureViolations(files), [],
    "every source in a controller cannot import another controller implementation");
}
