import assert from "node:assert/strict";
import './navigation-icons/unit.mjs';
import { acceptsUtilityMessage, utilityMessage, utilityPageUrl } from "../../dist/utility-host/protocol.js";
import { validateUtilityContributions } from "../../dist/utility-host/contribution.js";
import { connectUtilityPage } from "../../dist/utility-host/page-client.js";

const identity = { utilityId: "probe", sessionId: "current-session", targetId: 42 };
const action = utilityMessage(identity, "action", { start: true });
assert.equal(acceptsUtilityMessage(action, identity), true);
for (const change of [{ sessionId: "old" }, { targetId: 99 }, { utilityId: "other" },
  { protocol: "other" }, { kind: "undeclared" }]) assert.equal(acceptsUtilityMessage({ ...action, ...change }, identity), false);
for (const value of [null, false, "message", {}]) assert.equal(acceptsUtilityMessage(value, identity), false);
const contribution = { id: "probe", label: "Probe", page: "probe/index.html", storage: { namespace: "utility.probe.state", version: 1 } };
validateUtilityContributions([contribution]);
for (const page of ["https://example.com/probe.html", "../probe.html", "/probe.html", "probe.html?target=99"])
  assert.throws(() => validateUtilityContributions([{ ...contribution, page }]));
assert.throws(() => validateUtilityContributions([contribution, contribution]));
assert.throws(() => validateUtilityContributions([{ ...contribution, storage: { namespace: "data-layer", version: 1 } }]));

const received = [], sent = [], listeners = new Map();
const host = { postMessage: (...args) => sent.push(args) };
const url = utilityPageUrl(contribution.page, identity, "workbench", "https://extension.test/side-panel.html");
const page = { location: new URL(url), opener: host, parent: {},
  addEventListener: (name, callback) => listeners.set(name, callback),
  removeEventListener: (name, callback) => { if (listeners.get(name) === callback) listeners.delete(name); } };
const client = connectUtilityPage(page, message => received.push(message));
assert.equal(client.ownsWork, false);
assert.equal(sent[0][0].kind, "ready");
for (const event of [{ source: {}, origin: page.location.origin, data: action },
  { source: host, origin: "https://other.test", data: action },
  { source: host, origin: page.location.origin, data: { ...action, sessionId: "old" } }]) listeners.get("message")(event);
assert.equal(received.length, 0);
listeners.get("message")({ source: host, origin: page.location.origin, data: action });
assert.equal(received.length, 1);
client.dispose(); assert.equal(listeners.size, 0);
console.log("Utility page identities, local contributions, sender validation, and disposal passed");
