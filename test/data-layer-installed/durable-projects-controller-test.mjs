import assert from "node:assert/strict";
const { createDurableProjectsInstalledController } = await import("../../dist/data-layer-installed/durable-projects/index.js");

class Element {
  listeners = new Map();
  hidden = true;
  disabled = false;
  textContent = "";
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  removeEventListener(type, listener) { if (this.listeners.get(type) === listener) this.listeners.delete(type); }
  click() { this.listeners.get("click")?.({ currentTarget:this, preventDefault() {} }); }
}

let starts = 0, stops = 0;
const root = { querySelector:() => null };
const controller = createDurableProjectsInstalledController({ root, startRepository:async()=>{starts += 1; return ()=>{stops += 1;};},
  migration:()=>({ status:"none" }), resolveMigration:async()=>{}, readLegacySource:()=>null,
  downloadMigrationSources() {}, reload() {}, reviewMigration:async()=>{}, retryFailedSave:async()=>{}, rejectFailedSave:async()=>{}, storageRecoveryClosed() {} });
await controller.mount(); await controller.mount(); assert.equal(starts, 1);
controller.dispose(); controller.dispose(); assert.equal(stops, 1);
assert.equal(controller.state().phase, "idle");
let release;
const late = createDurableProjectsInstalledController({ root, startRepository:()=>new Promise((resolve)=>{ release=resolve; }),
  migration:()=>({ status:"none" }), resolveMigration:async()=>{}, readLegacySource:()=>null,
  downloadMigrationSources() {}, reload() {}, reviewMigration:async()=>{}, retryFailedSave:async()=>{}, rejectFailedSave:async()=>{}, storageRecoveryClosed() {} });
const mounting = late.mount(); late.dispose(); release(()=>{stops += 1;}); await mounting;
assert.equal(stops, 2, "a repository resolving after disposal is stopped immediately");
assert.equal(late.state().phase, "idle");

const selectors = new Map([
  ["#durable-migration-review", new Element()],
  ["#durable-migration-review-summary", new Element()],
  ["#durable-migration-review-result", new Element()],
  ["#export-legacy-migration-sources", new Element()],
  ["#migrate-legacy-library-source", new Element()],
  ["#migrate-legacy-active-source", new Element()],
]);
const downloads = [], resolutions = [], reloads = [];
let resolveMigration;
const migrationController = createDurableProjectsInstalledController({
  root:{ querySelector:(selector)=>selectors.get(selector) ?? null }, startRepository:async()=>()=>{},
  migration:()=>({ status:"review-required", projectId:"project:one", conflictingFields:["name"],
    sources:[{ source:"library", revision:3, checksum:"aaa" }, { source:"active", revision:2, checksum:"bbb" }] }),
  resolveMigration:(choice)=>{ resolutions.push(choice); return new Promise((resolve)=>{ resolveMigration=resolve; }); },
  readLegacySource:(key)=>`${key}:bytes`, downloadMigrationSources:(name, serialized)=>downloads.push([name, JSON.parse(serialized)]),
  reload:()=>reloads.push("reload"), reviewMigration:async()=>{}, retryFailedSave:async()=>{}, rejectFailedSave:async()=>{},
  storageRecoveryClosed() {},
});
await migrationController.mount();
assert.equal(selectors.get("#durable-migration-review").hidden, false);
assert.match(selectors.get("#durable-migration-review-summary").textContent, /generation 3 checksum aaa/);
selectors.get("#export-legacy-migration-sources").click();
assert.equal(downloads[0][0], "project:one-legacy-migration-sources.json");
assert.deepEqual(downloads[0][1].sources.map(({ payload })=>payload), [
  "my-chrome-utilities.specification-project-library.v1:bytes",
  "my-chrome-utilities.specification-project.v1:bytes",
]);
selectors.get("#migrate-legacy-library-source").click();
assert.deepEqual(resolutions, ["library"]);
migrationController.dispose();
resolveMigration(); await Promise.resolve(); await Promise.resolve();
assert.deepEqual(reloads, [], "a migration settling after disposal cannot reload the page");
for (const element of selectors.values()) assert.equal(element.listeners.size, 0, "disposal removes every migration listener");

const invalidSelectors = new Map([...selectors.keys()].map((selector)=>[selector, new Element()]));
const invalidDownloads = [];
const invalidController = createDurableProjectsInstalledController({
  root:{ querySelector:(selector)=>invalidSelectors.get(selector) ?? null }, startRepository:async()=>()=>{},
  migration:()=>({ status:"invalid-source-review", actions:["export", "choose"], sources:[
    { key:"my-chrome-utilities.specification-project-library.v1", valid:true, error:"", bytes:12, checksum:"lib" },
    { key:"my-chrome-utilities.specification-project.v1", valid:false, error:"bad JSON", bytes:9, checksum:"active" },
    { key:"my-chrome-utilities.schema-library.v1", valid:true, error:"", bytes:4, checksum:"schema" },
  ] }), resolveMigration:async()=>{}, readLegacySource:()=>null,
  downloadMigrationSources:(name, serialized)=>invalidDownloads.push([name, JSON.parse(serialized)]), reload() {},
  reviewMigration:async()=>{}, retryFailedSave:async()=>{}, rejectFailedSave:async()=>{}, storageRecoveryClosed() {},
});
await invalidController.mount();
assert.equal(invalidSelectors.get("#migrate-legacy-library-source").disabled, false);
assert.equal(invalidSelectors.get("#migrate-legacy-active-source").disabled, true, "invalid source choices remain unavailable");
invalidSelectors.get("#export-legacy-migration-sources").click();
assert.equal(invalidDownloads[0][0], "invalid-legacy-migration-sources.json");
assert.equal(invalidDownloads[0][1].sources[1].error, "bad JSON");
invalidController.dispose();
