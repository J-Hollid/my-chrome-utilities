// Compare the retained historical session separately from later registered features.
export const approvedUtilityBrowserTaskKeys = [
  "browser:test/utility-tab-expansion-browser-test.mjs",
  "browser:test/utility-tab-expansion-standalone-browser-test.mjs",
  "browser:test/tealium/detection/cost-test.mjs",
  "browser:test/tealium/detection/browser-test.mjs",
  "browser:test/tealium/detection/frame-access-test.mjs",
  "browser:test/tealium/detection/real-runtime-test.mjs",
  "browser:test/tealium/detection/states-browser-test.mjs",
  "browser:test/tealium/live/access-recovery-test.mjs",
  "browser:test/tealium/live/browser-test.mjs",
  "browser:test/tealium/live/closure-test.mjs",
  "browser:test/tealium/live/data-layer-continuity-test.mjs",
  "browser:test/tealium/live/frame-lifecycle-test.mjs",
  "browser:test/tealium/live/geometry-test.mjs",
  "browser:test/tealium/live/lifecycle-test.mjs",
  "browser:test/tealium/live/startup-test.mjs",
  "browser:test/tealium/devtools/browser-test.mjs",
  "browser:test/tealium/devtools/clipboard-test.mjs",
  "browser:test/tealium/devtools/lifecycle-test.mjs",
  "browser:test/tealium/devtools/limits-test.mjs",
  "browser:test/tealium/devtools/protocol-test.mjs",
];

export function projectAcceptanceSessionToBaseline(identity, basePacks) {
  if (identity.stage !== "acceptance-session") return identity;
  const baseline = new Set(basePacks.find(({id}) => id === identity.packId)?.features ?? []);
  const current = identity.target.split(",");
  const excluded = current.filter((feature) => !baseline.has(feature));
  const artifacts = new Set(excluded.flatMap((feature) => {
    const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
    return [`build/acceptance/generated/${slug}_acceptance_test.clj`,
      `build/acceptance/ir/${feature.slice("features/".length, -".feature".length)}.json`];
  }));
  return {...identity, target:current.filter((feature) => baseline.has(feature)).join(","),
    args:identity.args.filter((argument) => !artifacts.has(argument))};
}
