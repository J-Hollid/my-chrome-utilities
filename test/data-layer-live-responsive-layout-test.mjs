import assert from "node:assert/strict";
import { liveResponsiveLayout } from "../dist/data-layer-live-responsive-layout.js";

assert.equal(liveResponsiveLayout({}, 360), "feed-only");
assert.equal(liveResponsiveLayout({ inspectorEventId: "purchase" }, 360), "narrow-detail");
assert.equal(liveResponsiveLayout({ inspectorEventId: "purchase" }, 520), "narrow-detail");
assert.equal(liveResponsiveLayout({ inspectorEventId: "purchase" }, 720), "wide-detail");
