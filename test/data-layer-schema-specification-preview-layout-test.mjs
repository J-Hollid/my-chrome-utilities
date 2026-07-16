import assert from "node:assert/strict";
import { retainedSpecificationPreviewScroll } from "../dist/data-layer-schema-specification-builder.js";

assert.equal(retainedSpecificationPreviewScroll(240, 900, 320), 240);
assert.equal(retainedSpecificationPreviewScroll(800, 900, 320), 580);
assert.equal(retainedSpecificationPreviewScroll(120, 280, 320), 0);
assert.equal(retainedSpecificationPreviewScroll(-20, 900, 320), 0);
