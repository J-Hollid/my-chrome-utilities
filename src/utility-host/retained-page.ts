import type { UtilityPageContribution } from "./contribution.js";
import { acceptsUtilityMessage, utilityMessage, utilityPageUrl, type UtilityMessageKind,
  type UtilitySessionIdentity } from "./protocol.js";

export interface RetainedPageOptions {
  contribution: UtilityPageContribution;
  panel: HTMLElement;
  page: Window;
  selectTarget: () => Promise<number | null>;
  subscribeTargetClosed: (listener: (id: number) => void) => () => void;
}

export function createRetainedUtilityPage({ contribution, panel, page, selectTarget, subscribeTargetClosed }: RetainedPageOptions) {
  const doc = panel.ownerDocument;
  const status = doc.createElement("output");
  status.setAttribute("aria-live", "polite");
  const frame = doc.createElement("iframe");
  frame.title = contribution.label;
  frame.style.cssText = "width:100%;height:70vh;border:0;display:block";
  const launch = doc.createElement("button");
  launch.type = "button";
  launch.textContent = `Open ${contribution.label} in a full-width page`;
  launch.disabled = true;
  const reset = doc.createElement("button");
  reset.type = "button";
  reset.textContent = `Reset ${contribution.label}`;
  const close = doc.createElement("button");
  close.type = "button";
  close.textContent = `Close ${contribution.label}`;
  panel.append(launch, reset, close, status);
  let identity: UtilitySessionIdentity | undefined;
  let starting: Promise<void> | undefined;
  let selectionClosures: Set<number> | undefined;
  let workbench: Window | null = null;
  let dirty = false, disposed = false, generation = 0, unavailable = false;
  let lastState: unknown;
  const origin = page.location.origin;
  const send = (target: Window | null, kind: UtilityMessageKind, payload?: unknown): void => {
    if (identity && target) target.postMessage(utilityMessage(identity, kind, payload), origin);
  };
  const permitDiscard = (): boolean => !dirty || page.confirm(`Discard unsaved changes in ${contribution.label}?`);
  const resetOwned = (): void => {
    if (!permitDiscard()) return;
    send(frame.contentWindow, "reset");
  };
  const closeOwned = (): void => {
    if (!permitDiscard()) return;
    send(frame.contentWindow, "close");
    workbench?.close(); workbench = null;
    frame.remove(); identity = undefined; starting = undefined;
    dirty = false; lastState = undefined; generation += 1; launch.disabled = true;
    status.textContent = `${contribution.label} is closed. Select its tab to reopen it.`;
  };
  const onMessage = (event: MessageEvent): void => {
    if (disposed || !identity || event.origin !== origin || !acceptsUtilityMessage(event.data, identity)) return;
    const owner = event.source === frame.contentWindow;
    const secondary = workbench !== null && event.source === workbench;
    if (!owner && !secondary) return;
    const message = event.data;
    if (message.kind === "ready") {
      if (owner) { launch.disabled = unavailable; status.textContent = unavailable ? "The bound website target is unavailable." : `${contribution.label} is ready.`; }
      send(owner ? frame.contentWindow : workbench, "state", lastState);
      if (unavailable) send(owner ? frame.contentWindow : workbench, "target-closed");
    } else if (owner && message.kind === "state") {
      lastState = message.payload; send(workbench, "state", lastState);
    } else if (owner && message.kind === "dirty") {
      dirty = message.payload === true;
    } else if (secondary && message.kind === "action" && !unavailable) {
      send(frame.contentWindow, "action", message.payload);
    } else if (message.kind === "reset") resetOwned();
    else if (message.kind === "close") closeOwned();
    else if (secondary && message.kind === "stop") send(frame.contentWindow, "stop");
  };
  const openWorkbench = (): void => {
    if (!identity || unavailable || launch.disabled) return;
    if (workbench && !workbench.closed) { workbench.focus(); return; }
    workbench = page.open(utilityPageUrl(contribution.page, identity, "workbench", page.location.href), "_blank");
    if (!workbench) status.textContent = "The browser could not open the utility page.";
  };
  const removeTargetListener = subscribeTargetClosed((id) => {
    selectionClosures?.add(id);
    if (!identity || identity.targetId !== id) return;
    unavailable = true; launch.disabled = true;
    status.textContent = "The bound website target is unavailable.";
    send(frame.contentWindow, "target-closed"); send(workbench, "target-closed");
  });
  page.addEventListener("message", onMessage);
  launch.addEventListener("click", openWorkbench);
  reset.addEventListener("click", resetOwned);
  close.addEventListener("click", closeOwned);
  async function load(): Promise<void> {
    if (disposed || starting) return starting;
    const version = generation;
    const closedTargets = new Set<number>();
    selectionClosures = closedTargets;
    starting = (async () => {
      status.textContent = `Opening ${contribution.label}…`;
      try {
        const targetId = await selectTarget();
        if (disposed || version !== generation) return;
        unavailable = targetId !== null && closedTargets.has(targetId);
        identity = { utilityId: contribution.id, sessionId: crypto.randomUUID(), targetId };
        frame.src = utilityPageUrl(contribution.page, identity, "owner", page.location.href);
        panel.append(frame);
      } catch (error) { status.textContent = `${contribution.label} could not start: ${String(error)}`; }
      finally { if (selectionClosures === closedTargets) selectionClosures = undefined; }
    })();
    return starting;
  }
  function dispose(): void {
    if (disposed) return;
    send(frame.contentWindow, "close"); send(workbench, "close");
    disposed = true; generation += 1;
    removeTargetListener(); page.removeEventListener("message", onMessage);
    launch.removeEventListener("click", openWorkbench); reset.removeEventListener("click", resetOwned);
    close.removeEventListener("click", closeOwned); frame.remove();
  }
  return { load, dispose };
}
