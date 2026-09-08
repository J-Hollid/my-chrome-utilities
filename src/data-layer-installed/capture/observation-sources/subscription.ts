import {observationArrayHook} from "./page-hook.js";
import {observationPageBridge} from "./page-bridge.js";
import type {ObservationEntry, ObservationSubscriptionOptions} from "./coordinator.js";

export interface ObservationScheduler {
  schedule(callback: () => void): unknown;
  cancel(handle: unknown): void;
}
const scheduler: ObservationScheduler = {
  schedule:callback => globalThis.setTimeout(callback, 250),
  cancel:handle => globalThis.clearTimeout(handle as number),
};
// Assign order at the extension receipt boundary, before any source-local activation buffer.
let receiptSequence = 0;

export async function startObservationSourceSubscription(
  options: ObservationSubscriptionOptions,
  clock: ObservationScheduler = scheduler,
): Promise<() => void> {
  const channel = crypto.randomUUID(), target = {tabId:options.tabId};
  let active = true, timer: unknown, activated = false;
  let arrayId: string | undefined, snapshotLength=-1, lastStatus="";
  const pending: ObservationEntry[] = [];
  const listener = (message: unknown, sender: chrome.runtime.MessageSender): void => {
    const entry = message as ObservationEntry & {type?:string; channel?:string};
    if (!active || sender.tab?.id !== options.tabId || entry?.type !== "twa-observation" ||
      entry.channel !== channel || typeof entry.arrayId !== "string" ||
      !Number.isSafeInteger(entry.index) || entry.index < 0 || typeof entry.timestamp !== "string") return;
    const received = {...entry,receiptSequence:++receiptSequence};
    if (activated) { if (entry.arrayId===arrayId) options.onEntry(received); } else pending.push(received);
  };
  const cleanup = async (): Promise<void> => {
    await Promise.allSettled([
      chrome.scripting.executeScript({target, world:"MAIN", func:observationArrayHook,
        args:["detach", options.historyPath, channel, ""]}),
      chrome.scripting.executeScript({target, func:observationPageBridge, args:["detach", channel]}),
    ]);
  };
  const stop = (): void => {
    if (!active) return;
    active = false; clock.cancel(timer); chrome.runtime.onMessage.removeListener(listener);
    pending.length = 0; void cleanup();
  };
  const refresh = async (): Promise<void> => {
    if (!active) return;
    activated = false;
    try {
      const [result] = await chrome.scripting.executeScript({
        target, world:"MAIN", func:observationArrayHook,
        args:["attach", options.historyPath, channel, "twa-observation:" + channel],
      });
      if (!active) { await cleanup(); return; }
      const snapshot = result?.result;
      if (!snapshot) throw new Error("Observation target is unavailable");
      if (lastStatus!==snapshot.status) { lastStatus=snapshot.status; options.onStatus(snapshot.status); }
      if (snapshot.status === "Ready" && snapshot.arrayId) {
        // A snapshot also recovers entries added between disable and re-enable.
        // The coordinator de-duplicates by source, array identity, and index.
        if (arrayId!==snapshot.arrayId || snapshotLength!==snapshot.rawValues.length)
          options.onSnapshot({historyPath:options.historyPath, arrayId:snapshot.arrayId, rawValues:snapshot.rawValues});
        snapshotLength=snapshot.rawValues.length;
        arrayId = snapshot.arrayId;
      } else arrayId = undefined;
      activated = true;
      pending.splice(0).forEach(entry => { if (entry.arrayId === arrayId) options.onEntry(entry); });
      timer = clock.schedule(() => { void refresh(); });
    } catch {
      if (!active) return;
      options.onStatus("Access required"); stop();
    }
  };
  chrome.runtime.onMessage.addListener(listener);
  try {
    await chrome.scripting.executeScript({target, func:observationPageBridge, args:["attach", channel]});
    await refresh();
  } catch { stop(); options.onStatus("Access required"); }
  return stop;
}
