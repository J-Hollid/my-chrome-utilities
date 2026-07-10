import assert from "node:assert/strict";
import { assignSchema, createSchema, validateEvent } from "../dist/data-layer-schema-verification.js";
for (let sample = 0; sample < 100; sample += 1) { const schema = assignSchema(createSchema(`Schema ${sample}`, 1, { type: "object", required: ["id"], properties: { id: { type: "number" } } }), { sourceId: "source", eventName: "event", target: "payload" }); const result = validateEvent({ sourceId: "source", eventName: "event", payload: { id: sample }, rawInput: null }, [schema]); assert.equal(result.state, "Valid"); }
