import assert from "node:assert/strict";
import { disposedRejection, expansionConfirm, fixture } from "./retired-allowed-value-controller-contract-test.mjs";
import { canonicalPropertyId, persistenceSchemaId } from "./retired-canonical-controller-contract-test.mjs";
import { guidedChoice } from "./retired-guided-controller-contract-test.mjs";

const { elements, uiController } = fixture;

// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-001
assert.equal(uiController.openSavedCanonical(persistenceSchemaId), true);
fixture.canonicalSettlementMode = "defer"; const beforeDisposeCanonical = uiController.canonicalDocument();
const staleCanonicalSettlement = uiController.dispatchCanonical({ kind:"rename", baseRevision:beforeDisposeCanonical.revision,
  propertyId:canonicalPropertyId, name:"Settles after disposal" });
fixture.deferHydration = true; const staleHydration = uiController.hydrateActiveProjectForSchemas();
uiController.dispose();
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-002
assert.equal(elements.get("#schema-editor").querySelector("#compact-canonical-table-editor"), undefined,
  "Schemas removes its on-demand canonical table host during disposal");
fixture.releaseCanonicalSettlement(); await staleCanonicalSettlement;
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-003
assert.equal(elements.get("#compact-canonical-context").hidden, true, "a settlement completing after disposal cannot reopen stale canonical UI");
fixture.releaseHydration({ name:"Stale Project" }); await staleHydration;
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-004
assert.notEqual(elements.get("#schema-result").textContent, "Loaded schema contributors for Stale Project.",
  "a durable hydration settling after disposal cannot render stale project state");
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-005
assert.match(String(await disposedRejection), /disposed before durable persistence settled/);
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-006
assert.equal(fixture.persistenceListener, undefined, "disposal detaches the durable persistence port");
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-007
assert.equal(fixture.layeredProfileDisposals, 1, "Schemas disposes the layered Profile editor with its owner lifecycle");
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-008
assert.equal(guidedChoice.listenerCount(), 0, "disposal removes the guided continuation choice listener");
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-009
assert.equal(expansionConfirm.listenerCount(), 0, "disposal removes the open allowed-value dialog listeners");
const retainedSchemaListeners = [...elements].filter(([, item]) => item.listenerCount()).map(([selector, item]) => [selector, item.listenerCount()]);
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-010
assert.deepEqual(retainedSchemaListeners, [], "Schemas removes every editor and revision listener it owns");

export { fixture };
