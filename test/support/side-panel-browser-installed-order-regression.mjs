import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

import { runBrowserObservation } from "../../scripts/run-browser-observation.mjs";

export const installedOrderPairs = Object.freeze({
  capture:["FRESH_LIVE_SESSION_BROWSER_ADAPTER", "PAYLOAD_PATH_FILTER_BROWSER_ADAPTER"],
  schemas:["SCHEMA_WORKSPACE_BROWSER_ADAPTER:default", "ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER"],
  defects:["DEFECT_LIBRARY_BROWSER_ADAPTER", "DEFECT_REPORT_COMPONENT_OPTIONS_BROWSER_ADAPTER"],
  shell:["SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER", "WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER"],
});

export function normalizeInstalledObservation(value) {
  if (Array.isArray(value)) return value.map(normalizeInstalledObservation);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, normalizeInstalledObservation(nested)]));
  }
  if (typeof value === "string") {
    return value
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/giu,
        "<runtime-uuid>")
      .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\b/gu, "<runtime-timestamp>")
      .replace(/\b(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\b/gu, "<runtime-clock>");
  }
  return value;
}

const digest = (value) => createHash("sha256")
  .update(JSON.stringify(normalizeInstalledObservation(value))).digest("hex");

export async function runInstalledOrderRegression() {
  const pairEvidence = {};
  for (const [pack, pair] of Object.entries(installedOrderPairs)) {
    const canonical = await runBrowserObservation(...pair);
    const permuted = await runBrowserObservation(...[...pair].reverse());
    const canonicalNormalized = normalizeInstalledObservation(canonical);
    const permutedNormalized = normalizeInstalledObservation(permuted);
    assert.deepEqual(permutedNormalized, canonicalNormalized,
      `${pack} installed observations changed values when target order changed`);
    pairEvidence[pack] = { pair, canonicalDigest:digest(canonicalNormalized),
      permutedDigest:digest(permutedNormalized), equal:true };
  }
  await runBrowserObservation("LIBRARY_DIRECT_TEMPLATE_PUSH_BROWSER_ADAPTER");
  return { verifiedPacks:Object.keys(installedOrderPairs), singleTargetPack:"event-library", pairEvidence };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify({ installedOrder:await runInstalledOrderRegression() }));
}
