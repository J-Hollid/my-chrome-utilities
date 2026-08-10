import { runEventLibrarySidePanel } from "./side-panel-event-library.mjs";
const target = "EVENT_LIBRARY_RENDERED_SMOKE_TARGET";
await runEventLibrarySidePanel({ ...process.env, SWARMFORGE_BROWSER_TARGET_IDS:JSON.stringify([target]), SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS:JSON.stringify({ [target]:{ EVENT_LIBRARY_RENDERED_SMOKE_TARGET:"1" } }) });
