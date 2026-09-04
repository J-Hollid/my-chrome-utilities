import assert from "node:assert/strict";

const { SchemaValidationController } = await import(
  "../../../dist/data-layer-installed/schemas/validation-controller.js"
);

const values = new Map();
const controller = new SchemaValidationController({
  getItem:(key) => values.get(key) ?? null,
  setItem:(key, value) => values.set(key, value),
});
controller.addRecord({ eventId:"event:one", eventName:"checkout", state:"Valid", checkedAt:"now", issueCodes:[] });
controller.setManualOverride("event:one", "schema:one");

assert.equal(controller.records.length, 1);

assert.equal(controller.manualOverrides["event:one"], "schema:one");

assert.equal(values.size, 2, "record and manual override bytes have separate keys");

assert.equal(controller.records[0].eventId,"event:one");

assert.equal(controller.records[0].eventName,"checkout");

assert.equal(controller.records[0].state,"Valid");

assert.deepEqual(controller.records[0].issueCodes,[]);

assert.equal(controller.manualOverrides["event:one"],"schema:one");
controller.setManualOverride("event:one",undefined);

assert.equal(controller.manualOverrides["event:one"],undefined);

assert.match([...values.values()].find((value)=>value.includes("checkout")),/Valid/u);
controller.replaceRecords(Array.from({length:55},(_,index)=>({eventId:`event:${index}`,eventName:`event-${index}`,state:"Not checked",checkedAt:"now",issueCodes:[]})));

assert.equal(controller.records.length,50);

assert.equal(controller.records[0].eventId,"event:5");

assert.equal(controller.records.at(-1).eventId,"event:54");
const projected=controller.recheck([]);
assert.deepEqual(projected,[]);
assert.equal(controller.records.length,50);
controller.addRecord({eventId:"event:last",eventName:"last",state:"Invalid",checkedAt:"later",issueCodes:["required"]});
assert.equal(controller.records.length,50);
assert.equal(controller.records.at(-1).eventId,"event:last");

assert.deepEqual(controller.records.at(-1).issueCodes,["required"]);
let disposed = 0;
controller.ownRow(() => { disposed += 1; });
controller.ownDialog(() => { disposed += 1; });
controller.dispose();
assert.equal(disposed, 2);
