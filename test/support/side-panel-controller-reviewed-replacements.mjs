// Each entry is an individually reviewed behavior-preserving rename. The audit verifies
// that the exact target path and declaration/call symbol exist; broad rules are forbidden.
export const reviewedControllerReplacements = [
  { identity:"stateOwners:371:eventTemplates@898:5", kind:"declaration", path:"src/data-layer-installed/event-library/index.ts", symbol:"templates" },
  { identity:"stateOwners:372:propertyEditorState@899:5", kind:"declaration", path:"src/data-layer-installed/event-library/index.ts", symbol:"editor" },
  { identity:"stateOwners:360:defectLibrary@886:5", kind:"declaration", path:"src/data-layer-installed/defects/index.ts", symbol:"library" },
  { identity:"stateOwners:361:selectedDefectId@887:5", kind:"declaration", path:"src/data-layer-installed/defects/index.ts", symbol:"selectedId" },
  { identity:"stateOwners:362:defectReturn@888:5", kind:"declaration", path:"src/data-layer-installed/defects/index.ts", symbol:"returnPosition" },
  { identity:"stateOwners:363:defectListScrollTop@889:5", kind:"declaration", path:"src/data-layer-installed/defects/index.ts", symbol:"listScrollTop" },
  { identity:"stateOwners:365:completedLiveFlowTests@892:5", kind:"declaration", path:"src/data-layer-installed/live-flow-testing/index.ts", symbol:"completed" },
];
