import { defineUtility } from "../../platform/utility-contract.js";
export * as capture from "../../data-layer-observer.js";
export * as liveInspection from "../../data-layer-live-observer.js";
export * as eventLibrary from "../../data-layer-event-library-editor.js";
export * as schemas from "../../data-layer-schema-verification.js";
export * as defectReporting from "../../data-layer-defect-report.js";
export * as replay from "../../data-layer-sequence-replay.js";
export const dataLayerModules = [
    { id: "capture", capability: "source observation and sessions", publicInterface: ["capture"] },
    { id: "live-inspection", capability: "event feed and event inspection", publicInterface: ["liveInspection"] },
    { id: "event-library", capability: "templates and template revisions", publicInterface: ["eventLibrary"] },
    { id: "schemas", capability: "authoring, assignment, and validation", publicInterface: ["schemas"] },
    { id: "defect-reporting", capability: "report composition and defect storage", publicInterface: ["defectReporting"] },
    { id: "replay", capability: "sequence definition and execution", publicInterface: ["replay"] },
];
export const dataLayerUtility = { ...defineUtility({ id: "data-layer", identity: { name: "Data layer", description: "Capture and data-layer workflow entry" }, commands: ["data-layer.start-testing", "data-layer.end-testing", "data-layer.save-session"], panels: ["Live", "Library", "Sessions", "Schemas"], lifecycle: { activate() { }, deactivate() { } }, storage: { namespace: "my-chrome-utilities.data-layer", version: 1 } }), modules: dataLayerModules };
//# sourceMappingURL=index.js.map