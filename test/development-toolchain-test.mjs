import assert from "node:assert/strict";
import {composePins, requestedPin} from "../swarmforge/toolchain/pins.mjs";
import {optionalOperation} from "../swarmforge/toolchain/dispatch.mjs";
import {parseRequest} from "../swarmforge/toolchain/cli.mjs";

const root = {version:1, node:{version:"24.19.0"}};
const pin = {provider:"fixture", revision:"a".repeat(40), sha256:"b".repeat(64)};
const fragment = {version:1, tools:{navigator:pin}};
const pins = composePins(root, fragment);
assert.deepEqual(requestedPin(pins, "navigator"), {
  name:"navigator", pin, authority:"swarmforge/toolchain/optional-tools.lock.json",
});
assert.deepEqual(root, {version:1, node:{version:"24.19.0"}});
assert.throws(() => requestedPin(pins, "missing"), /missing-pin/u);
assert.throws(() => composePins(root, {version:1, tools:{node:pin}}), /authority-conflict/u);
for (const invalid of [{...pin, revision:"main"}, {...pin, sha256:"short"},
  {...pin, provider:"../shell"}, {...pin, extra:true}, null]) {
  assert.throws(() => composePins(root, {version:1, tools:{navigator:invalid}}), /invalid-pin/u);
}
for (const invalid of [{version:2, tools:{}}, {version:1}, {version:1, tools:[]},
  {version:1, tools:{}, extra:true}]) {
  assert.throws(() => composePins(root, invalid), /schema/u);
}
assert.throws(() => composePins({version:2}, fragment), /core-schema/u);
assert.deepEqual(composePins(root, {version:1, tools:{}}), {});
pin.revision = "c".repeat(40);
assert.equal(requestedPin(pins, "navigator").pin.revision, "a".repeat(40));

const calls = [];
const providers = {fixture:{
  inspect:async (request) => { calls.push(["inspect", request]); return {available:false}; },
  provision:async (request) => { calls.push(["provision", request]); return {available:true}; },
}};
const inspected = await optionalOperation({operation:"inspect", name:"navigator", pins, providers});
assert.equal(inspected.available, false);
assert.deepEqual(calls.map(([operation]) => operation), ["inspect"]);
assert.equal(calls[0][1].pin.revision, "a".repeat(40));
await optionalOperation({operation:"provision", name:"navigator", pins, providers});
assert.deepEqual(calls.map(([operation]) => operation), ["inspect", "provision"]);
for (const request of [{operation:"provision"}, {operation:"provision",name:"missing"},
  {operation:"download",name:"navigator"}]) {
  await assert.rejects(optionalOperation({...request, pins, providers}), /request|missing-pin/u);
}
assert.equal(calls.length, 2, "invalid requests must not invoke providers");
await assert.rejects(optionalOperation({operation:"provision", name:"navigator", pins, providers:{}}),
  /provider-unavailable/u);
assert.deepEqual(parseRequest(["inspect", "navigator"]), {operation:"inspect", name:"navigator"});
for (const args of [[], ["provision"], ["inspect", "x", "extra"], ["download", "x"]]) {
  assert.throws(() => parseRequest(args), /request/u);
}
console.log(JSON.stringify({developmentToolchain:{pins:true, dispatch:true, offlineInspection:true}}));
