// Each entry is an individually reviewed behavior-preserving rename. The audit verifies
// that the exact target path and declaration/call symbol exist; broad rules are forbidden.
export const reviewedControllerReplacements = [
  { identity:"stateOwners:365:completedLiveFlowTests@892:5", kind:"declaration", path:"src/data-layer-installed/live-flow-testing/index.ts", symbol:"completed" },
  { identity:"listeners:161:startTestingButton?.addEventListener@5510:1", kind:"call", path:"src/data-layer-installed/capture/index.ts", symbol:"startTestingButton?.addEventListener" },
  { identity:"listeners:162:endTestingButton?.addEventListener@5513:1", kind:"call", path:"src/data-layer-installed/capture/index.ts", symbol:"endTestingButton?.addEventListener" },
  { identity:"listeners:166:pauseCaptureButton?.addEventListener@5536:1", kind:"call", path:"src/data-layer-installed/capture/index.ts", symbol:"pauseCaptureButton?.addEventListener" },
  { identity:"listeners:167:resumeCaptureButton?.addEventListener@5542:1", kind:"call", path:"src/data-layer-installed/capture/index.ts", symbol:"resumeCaptureButton?.addEventListener" },
];
