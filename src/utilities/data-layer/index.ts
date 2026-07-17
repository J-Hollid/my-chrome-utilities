import { defineUtility, type DataLayerModuleEntry } from "../../platform/utility-contract.js";
import { createDomUtilityLifecycle } from "../../platform/utility-lifecycle-dom.js";
export * as capture from "./capture.js";
export * as liveInspection from "./live-inspection.js";
export * as eventLibrary from "./event-library.js";
export * as schemas from "./schemas.js";
export * as defectReporting from "./defect-reporting.js";
export * as replay from "./replay.js";
export const dataLayerModules:readonly DataLayerModuleEntry[]=[
  {id:"capture",capability:"source observation and sessions",publicInterface:["capture"]},
  {id:"live-inspection",capability:"event feed and event inspection",publicInterface:["liveInspection"]},
  {id:"event-library",capability:"templates and template revisions",publicInterface:["eventLibrary"]},
  {id:"schemas",capability:"authoring, assignment, and validation",publicInterface:["schemas"]},
  {id:"defect-reporting",capability:"report composition and defect storage",publicInterface:["defectReporting"]},
  {id:"replay",capability:"sequence definition and execution",publicInterface:["replay"]},
];
export const dataLayerUtility={...defineUtility({id:"data-layer",identity:{name:"Data layer",description:"Capture and data-layer workflow entry"},commands:["data-layer.start-testing","data-layer.end-testing","data-layer.save-session","data-layer.choose-observation-target","data-layer.attach-selected-target","data-layer.detach-observation-target","data-layer.show-live","data-layer.show-library","data-layer.show-sessions","data-layer.show-schemas","navigation.show-data-layer"],panels:["workspace-panel-data-layer","data-layer-panel-live","data-layer-panel-library","data-layer-panel-sessions","data-layer-panel-defects","data-layer-panel-schemas"],lifecycle:createDomUtilityLifecycle("data-layer",["workspace-panel-data-layer","data-layer-panel-live","data-layer-panel-library","data-layer-panel-sessions","data-layer-panel-defects","data-layer-panel-schemas"]),storage:{namespace:"my-chrome-utilities.data-layer",version:1,legacyKeys:["historyArrayPath","dataLayerTestingSession","my-chrome-utilities.data-layer-view.v1","my-chrome-utilities.saved-through-event-count.v1","my-chrome-utilities.saved-event-feed-filters.v1","my-chrome-utilities.saved-event-feed-filter-working.v1","my-chrome-utilities.saved-session-library.v1","my-chrome-utilities.saved-session-live-feed.v1","my-chrome-utilities.defect-library.v1","my-chrome-utilities.event-template-library.v1","my-chrome-utilities.schema-library.v1","my-chrome-utilities.guided-validation-continuations.v1","my-chrome-utilities.manual-schema-overrides.v1","my-chrome-utilities.schema-validation-records.v1","my-chrome-utilities.schema-rule-library.v1"]}}),modules:dataLayerModules};
