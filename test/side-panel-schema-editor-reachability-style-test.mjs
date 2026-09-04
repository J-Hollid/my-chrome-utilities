import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const reachability = await readFile("side-panel-schema-editor-reachability.css", "utf8");
assert.match(reachability, /@media \(max-width: 699px\)/u,
  "the editor-only route does not change the wide two-column layout");
assert.match(reachability,
  /#workspace-panel-data-layer:has\([\s\S]*data-schema-editor-route="active"[\s\S]*overflow: hidden/u,
  "the narrow outer workspace stops being a competing scroll owner");
assert.match(reachability,
  /data-schema-editor-route="active"[\s\S]*> :not\(h3, #schema-detail\)[\s\S]*display: none/u,
  "the narrow route removes the relationship tree from the editor viewport");
assert.match(reachability,
  /> #schema-detail[\s\S]*overflow-y: auto[\s\S]*overscroll-behavior-y: contain/u,
  "the visible Schema detail is the one vertical editor-route scroll owner");
