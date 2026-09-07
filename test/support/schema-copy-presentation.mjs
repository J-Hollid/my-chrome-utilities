// Storage completion precedes the controller's frame-based focus and scroll
// restoration. Wait for presentation, without polling for the expected values.
// Keep this function self-contained so browser fixtures can embed its source.
export function waitForSchemaCopyPresentation(scope = globalThis) {
  return new Promise((resolve, reject) => {
    let frame;
    const timer = scope.setTimeout(() => {
      scope.cancelAnimationFrame(frame);
      reject(new Error("Timed out waiting for schema copy presentation"));
    }, 2000);
    frame = scope.requestAnimationFrame(() => {
      frame = scope.requestAnimationFrame(() => {
        scope.clearTimeout(timer);
        resolve();
      });
    });
  });
}
