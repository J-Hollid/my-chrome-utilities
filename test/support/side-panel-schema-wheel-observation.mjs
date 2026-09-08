import {observeBrowserReadiness} from "./browser-observation-control.mjs";

/** Observe one native wheel input before resetting the same scroll owner. */
export async function observeSchemaEditorWheel({read, dispatch, now, sleep}) {
  const before = await read();
  await dispatch();
  let previous;
  const after = await observeBrowserReadiness({
    targetId: "SIDE_PANEL_SCHEMA_EDITOR_REACHABILITY_TARGET",
    phase: "interaction",
    predicateDescription: "native wheel movement settled in the Schema editor",
    observe: read,
    ready(state) {
      const settled = state.offset > before.offset && state.offset === previous;
      previous = state.offset;
      return settled;
    },
    snapshot: state => ({before: before.offset, after: state.offset}),
    timeoutMs: 2000, pollIntervalMs: 25, stabilityMs: 50, maximumSnapshotCharacters: 300,
    ...(now ? {now} : {}), ...(sleep ? {sleep} : {}),
  });
  return {before, after};
}
