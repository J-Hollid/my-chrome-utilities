import assert from "node:assert/strict";

import { createSchemaEditorReachability } from
  "../../dist/data-layer-installed/schema-editor-reachability.js";

function element() {
  return {
    dataset:{}, scrollTop:0, isConnected:true, focused:false,
    listeners:new Map(),
    addEventListener(type, listener) { this.listeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (this.listeners.get(type) === listener) this.listeners.delete(type);
    },
    focus(options) { this.focused = true; this.focusOptions = options; },
  };
}

const panel = element(), scrollOwner = element(), createTrigger = element();
const detail = { clientHeight:400, scrollTop:0,
  scrollBy({ top }) { this.scrollTop += top; } };
panel.querySelector = (selector) => selector === "#schema-detail" ? detail : undefined;
scrollOwner.scrollTop = 84;
const reachability = createSchemaEditorReachability({
  panel,
  scrollOwner,
  scheduleFrame:(callback) => callback(),
});

reachability.open(createTrigger);
assert.equal(panel.dataset.schemaEditorRoute, "active",
  "opening selects the narrow editor-only panel route");
assert.equal(scrollOwner.scrollTop, 0,
  "opening puts the editor route at the top of the visible workspace");
let prevented = false;
panel.listeners.get("keydown")({ key:"PageDown", defaultPrevented:false,
  altKey:false, ctrlKey:false, metaKey:false, preventDefault:() => { prevented = true; } });
assert.equal(detail.scrollTop, 340,
  "Page Down moves the editor scroll owner while an editor control has focus");
assert.equal(prevented, true,
  "the handled Page Down does not also scroll an outer surface");

reachability.close(() => undefined);
assert.equal(panel.dataset.schemaEditorRoute, undefined,
  "closing restores the Schema relationship-tree route");
assert.equal(scrollOwner.scrollTop, 84,
  "closing restores the exact outer Schema tree scroll position");
assert.equal(createTrigger.focused, true,
  "closing returns focus to the stable Create schema control");
assert.deepEqual(createTrigger.focusOptions, { preventScroll:true });

const rowTrigger = element(), replacementTrigger = element();
scrollOwner.scrollTop = 39;
reachability.open(rowTrigger, "pages:page:cart");
reachability.open(rowTrigger, "pages:page:cart");
reachability.close((reference) => reference === "pages:page:cart" ? replacementTrigger : undefined);
assert.equal(scrollOwner.scrollTop, 39,
  "rerendering an open editor does not replace its original tree position");
assert.equal(replacementTrigger.focused, true,
  "closing resolves and focuses the exact rerendered relationship reference");
assert.equal(rowTrigger.focused, false,
  "a disconnected relationship control is not used after the tree rerenders");
reachability.reset();
assert.equal(panel.listeners.has("keydown"), false,
  "disposing the reachability controller removes its keyboard listener");

const installedLinks = [];
const ownerDocument = {
  head:{ append:(link) => installedLinks.push(link) },
  querySelector:() => undefined,
  createElement:() => ({ dataset:{} }),
};
createSchemaEditorReachability({
  panel:{ ...element(), ownerDocument },
  scrollOwner:element(),
  scheduleFrame:(callback) => callback(),
});
assert.equal(installedLinks.length, 1,
  "the reachability boundary installs one focused stylesheet");
assert.equal(installedLinks[0].href, "/side-panel-schema-editor-reachability.css");
