// Each entry is an individually reviewed behavior-preserving rename. The audit verifies
// that the exact target path and declaration/call symbol exist; broad rules are forbidden.
export const reviewedControllerReplacements = [
  { identity:"stateOwners:365:completedLiveFlowTests@892:5", kind:"declaration", path:"src/data-layer-installed/live-flow-testing/index.ts", symbol:"completed" },
  { identity:"listeners:161:startTestingButton?.addEventListener@5510:1", kind:"call", path:"src/data-layer-installed/capture/index.ts", symbol:"startTestingButton?.addEventListener" },
  { identity:"listeners:162:endTestingButton?.addEventListener@5513:1", kind:"call", path:"src/data-layer-installed/capture/index.ts", symbol:"endTestingButton?.addEventListener" },
  { identity:"listeners:166:pauseCaptureButton?.addEventListener@5536:1", kind:"call", path:"src/data-layer-installed/capture/index.ts", symbol:"pauseCaptureButton?.addEventListener" },
  { identity:"listeners:167:resumeCaptureButton?.addEventListener@5542:1", kind:"call", path:"src/data-layer-installed/capture/index.ts", symbol:"resumeCaptureButton?.addEventListener" },
  { identity:"subscriptions:0:durableProjectRuntime.subscribe@918:234", kind:"call", path:"src/data-layer-installed/projects/index.ts", symbol:"ports.subscribe" },
  { identity:"subscriptions:1:durableProjectRuntime.subscribe@980:1", kind:"call", path:"src/data-layer-installed/live-flow-testing/index.ts", symbol:"ports.subscribe" },
  { identity:"subscriptions:2:durableProjectRuntime.subscribe@988:367", kind:"call", path:"src/data-layer-installed/schemas/index.ts", symbol:"ports.subscribe" },
  { identity:"subscriptions:3:durableProjectRuntime.subscribe@6360:1", kind:"call", path:"src/data-layer-installed/runtime.ts", symbol:"durableProjectRuntime.subscribe" },
  { identity:"timers:1:globalThis.setTimeout@5304:33", kind:"call", path:"src/data-layer-installed/capture/index.ts", symbol:"globalThis.setTimeout", line:92 },
  { identity:"listeners:3:document.querySelector<HTMLDialogElement>(\"#durable-storage-recovery\")?.addEventListener@711:1", kind:"call", path:"src/data-layer-installed/durable-projects/index.ts", symbol:"durableStorageRecovery?.addEventListener" },
];
