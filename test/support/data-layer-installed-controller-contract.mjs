import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

export async function verifyPreparedInstalledController(id) {
  const module = await import(`../../dist/data-layer-installed/${id}/index.js`);
  const source = await readFile(`src/data-layer-installed/${id}/index.ts`, "utf8");
  assert.equal(module.installedControllerDefinition.id, id);
  assert.equal(module.installedControllerDefinition.capabilities.length > 0, true);
  assert.match(source, /export interface \w+InstalledPorts/u);
  assert.doesNotMatch(source, /addEventListener\(|\.subscribe\(|setTimeout\(|setInterval\(/u,
    "a prepared controller must remain unmounted and behavior-free");
  assert.doesNotMatch(source,
    /data-layer-installed\/(?:capture|event-library|schemas|defects|replay|projects|durable-projects|project-event-transport|live-flow-testing)\//u,
    "a prepared controller cannot import another controller implementation");
}
