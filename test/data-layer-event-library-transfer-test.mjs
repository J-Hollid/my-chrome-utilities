import assert from "node:assert/strict";
import {
  appendImportedTemplates,
  eventLibraryExport,
  eventLibraryImport,
  replaceImportedTemplates,
} from "../dist/data-layer-event-library-transfer.js";

const template = (id, name, version = 1) => ({
  id, name, eventName: name.toLowerCase().replaceAll(" ", "_"), sourceId:"event-history", sourceName:"Event history", destination:"event.history", tags:["checkout"], validation:"Valid", payload:{ value:version }, version, provenance:"library-created", revisionHistory:version > 1 ? [{ id:`${id}:v1`, name, eventName:name.toLowerCase(), sourceId:"event-history", sourceName:"Event history", destination:"event.history", tags:[], validation:"Not checked", payload:{}, version:1, provenance:"library-created" }] : [],
});
const current = [template("template-1", "Purchase confirmation", 4), template("template-2", "Scroll milestone", 2)];
const exported = eventLibraryExport(current);
assert.equal(exported.format, "my-chrome-utilities.event-library");
assert.equal(exported.version, 1);
assert.deepEqual(eventLibraryImport(JSON.stringify(exported)).templates, current);
assert.throws(() => eventLibraryImport("{"), /Select a valid Library JSON file/);
assert.throws(() => eventLibraryImport(JSON.stringify({ ...exported, version:2 })), /Export with a supported Library version/);
const imported = [template("template-2", "Imported scroll", 2), template("template-3", "Checkout", 1)];
assert.deepEqual(replaceImportedTemplates(current, imported), imported);
const appended = appendImportedTemplates(current, imported, () => "template-remapped");
assert.equal(appended.templates.length, 4);
assert.equal(appended.remapped, 1);
assert.equal(appended.templates[2].id, "template-remapped");
assert.match(appended.templates[2].provenance, /imported:template-2->template-remapped/);
