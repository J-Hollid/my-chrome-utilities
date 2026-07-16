import { defineUtility, type DataLayerModuleEntry } from "../../platform/utility-contract.js";
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
export const dataLayerUtility={...defineUtility({id:"data-layer",identity:{name:"Data layer",description:"Capture and data-layer workflow entry"},commands:["data-layer.start-testing","data-layer.end-testing","data-layer.save-session","data-layer.choose-observation-target","data-layer.attach-selected-target","data-layer.detach-observation-target","data-layer.show-live","data-layer.show-library","data-layer.show-sessions","data-layer.show-schemas","navigation.show-data-layer"],panels:["Live","Library","Sessions","Schemas"],lifecycle:{activate(){},deactivate(){}},storage:{namespace:"my-chrome-utilities.data-layer",version:1}}),modules:dataLayerModules};
