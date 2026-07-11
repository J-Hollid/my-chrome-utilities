import assert from "node:assert/strict";
import { clearEventLibrary, deleteEventTemplate } from "../dist/data-layer-event-library-deletion.js";

const template = (id, name, version = 1) => ({ id, name, eventName:"purchase", sourceId:"history", sourceName:"Event history", destination:"event.history", tags:[], validation:"Valid", payload:{}, version, provenance:"library-created", revisionHistory:version > 1 ? [{ id:`${id}:v1`, name, eventName:"purchase", sourceId:"history", sourceName:"Event history", destination:"event.history", tags:[], validation:"Valid", payload:{}, version:1, provenance:"library-created" }] : [] });
const first = template("template-7", "Purchase confirmation", 4);
const sameNamed = template("template-9", "Purchase confirmation", 1);
const other = template("template-10", "Scroll milestone", 2);
assert.deepEqual(deleteEventTemplate([first, sameNamed, other], "template-7"), [sameNamed, other]);
assert.deepEqual(clearEventLibrary([first, sameNamed, other]), []);
