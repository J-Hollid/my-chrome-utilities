/** Acquire the requested live port before committing a keyboard connection. */
export async function acquireFlowKeyboardTarget({ source, target, ports, selected, preview,
  key, waitFor }) {
  source().focus();
  key("Enter");
  await waitFor(() => Boolean(preview()), "keyboard connection preview");
  const limit = ports().length;
  for (let attempt = 0; attempt < limit && !target()?.classList.contains("is-valid-target"); attempt += 1) {
    const before = selected();
    key("ArrowRight");
    await waitFor(() => {
      const current = selected();
      return current !== undefined && current !== before;
    }, "keyboard connection target transition");
  }
  const acquired = target();
  if (!acquired?.isConnected || !acquired.classList.contains("is-valid-target")) {
    throw new Error("Requested keyboard connection port was not acquired");
  }
  key("Enter");
  return { preview: true, valid: true };
}

/** Read the connected current projection after asynchronous repository rendering. */
export async function waitForFlowOutlineProjection({ observe, waitFor, expectedNames = [] }) {
  return waitFor(() => {
    const { canvas, outline, surfaceOpen, saving } = observe();
    const ready = Boolean(canvas?.isConnected && outline?.isConnected && surfaceOpen && !saving &&
      expectedNames.every(name => canvas.textContent.includes(name) && outline.textContent.includes(name)));
    return { ready, canvas, outline };
  }, "current Flow outline projection", state => state.ready,
  ({ canvas, outline, ready }) => ({ ready, canvasConnected: Boolean(canvas?.isConnected),
    outlineConnected: Boolean(outline?.isConnected), canvasText: canvas?.textContent,
    outlineText: outline?.textContent }));
}
