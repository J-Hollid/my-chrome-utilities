import {canonicalCapturedEvent} from "../../../data-layer-event-presentation.js";
import {createObservationReceiptQueue} from "./receipt-queue.js";
import type {SourceEvent} from "../../../data-layer-source.js";
import type {ProjectObservationSource} from "../../../data-layer-project-observation-sources/model.js";

import type {ObservationSourceStatus} from "../../../data-layer-project-observation-sources/model.js";
export type {ObservationSourceStatus} from "../../../data-layer-project-observation-sources/model.js";
export interface ObservationEntry {
  arrayId: string;
  index: number;
  rawValue: unknown;
  timestamp: string;
  receiptSequence?: number;
}
export interface ObservationSubscriptionOptions {
  tabId: number;
  historyPath: string;
  onSnapshot(snapshot: {historyPath: string; arrayId: string; rawValues: readonly unknown[]}): void;
  onEntry(entry: ObservationEntry): void;
  onStatus(status: ObservationSourceStatus): void;
  onRefresh?(pending: boolean): void;
}
export interface ObservationContext {
  projectId: string;
  sessionId: string;
  tabId: number;
  pageUrl: string;
  pageLoadId: string;
}
export type ProjectSourceEvent = SourceEvent & {
  projectId: string;
  sourceName: string;
  sourcePath: string;
  arrayId: string;
  entryIndex: number;
  captureSequence: number;
};
interface Subscription {
  source: ProjectObservationSource;
  context: ObservationContext;
  active: boolean;
  arrayId?: string;
  cursors: Map<string, Set<number>>;
  stop?: () => void;
}

/** Coordinates configured identities. Page hooks and durable settings are separate ports. */
export function createObservationSourceCoordinator(ports: {
  start(options: ObservationSubscriptionOptions): Promise<() => void>;
  event(event: ProjectSourceEvent): void;
  status(source: ProjectObservationSource, status: ObservationSourceStatus): void;
  now(): string;
}) {
  const subscriptions = new Map<string, Subscription>();
  let sequenceIdentity = "";
  let identity = "", sequence = 0, generation = 0;
  let received = 0;
  const receipts = createObservationReceiptQueue(), initialization = {};
  const deactivate = (subscription: Subscription): void => {
    subscription.active = false;
    subscription.stop?.(); delete subscription.stop;
  };
  function stop(): void {
    generation += 1; receipts.clear();
    subscriptions.forEach(deactivate);
  }
  function capture(subscription: Subscription, entry: ObservationEntry): void {
    if (!subscription.active) return;
    let indices = subscription.cursors.get(entry.arrayId);
    if (!indices) { indices = new Set(); subscription.cursors.set(entry.arrayId, indices); }
    if (indices.has(entry.index)) return;
    indices.add(entry.index);
    sequence += 1;
    const {context, source} = subscription;
    ports.event({
      ...canonicalCapturedEvent({...context, sourceId:source.id, sourceKind:"Data Layer", destination:source.path},
        entry.rawValue, entry.timestamp, sequence),
      projectId:context.projectId, sourceName:source.name, sourcePath:source.path,
      arrayId:entry.arrayId, entryIndex:entry.index, captureSequence:sequence,
    });
  }
  async function activate(subscription: Subscription): Promise<void> {
    subscription.active = true;
    const current = (): boolean => subscription.active && subscriptions.get(subscription.source.id) === subscription;
    try {
      const dispose = await ports.start({
        tabId:subscription.context.tabId, historyPath:subscription.source.path,
        onRefresh:pending => {
          if (pending) { if (current()) receipts.hold(subscription); }
          else receipts.release(subscription);
        },
        onStatus:status => { if (current()) { if (status!=="Ready") delete subscription.arrayId; ports.status(subscription.source, status); } },
        onSnapshot:snapshot => {
          if (!current()) return;
          const repeated = subscription.arrayId === snapshot.arrayId;
          subscription.arrayId=snapshot.arrayId;
          ports.status(subscription.source, "Ready");
          const deliver = (): void => {
            if (!current() || subscription.arrayId !== snapshot.arrayId) return;
            snapshot.rawValues.forEach((rawValue, index) => capture(subscription, {
              rawValue, index, arrayId:snapshot.arrayId, timestamp:ports.now(),
            }));
          };
          // Poll recovery must not place an already received live entry before another source's buffer.
          if (repeated && receipts.held()) receipts.enqueue(Number.MAX_SAFE_INTEGER, deliver); else deliver();
        },
        onEntry:entry => {
          if (!current()) return;
          const deliver = (): void => { if (current() && subscription.arrayId===entry.arrayId) capture(subscription, entry); };
          receipts.enqueue(entry.receiptSequence ?? ++received, deliver);
        },
      });
      if (current()) subscription.stop = dispose; else dispose();
    } catch { if (current()) ports.status(subscription.source, "Access required"); }
  }
  async function synchronize(context: ObservationContext, sources: readonly ProjectObservationSource[]): Promise<void> {
    const nextIdentity = JSON.stringify([context.projectId, context.sessionId, context.tabId, context.pageLoadId]);
    if (identity !== nextIdentity) {
      stop(); subscriptions.clear(); identity = nextIdentity;
      const nextSequenceIdentity=JSON.stringify([context.projectId,context.sessionId]);
      if (sequenceIdentity!==nextSequenceIdentity) { sequence=0; sequenceIdentity=nextSequenceIdentity; }
    }
    const operation = ++generation;
    const ids = new Set(sources.map(source => source.id));
    for (const [id, subscription] of subscriptions) {
      const source = sources.find(source => source.id === id);
      if (!source?.enabled) deactivate(subscription);
      if (!ids.has(id) || source?.path !== subscription.source.path) {
        deactivate(subscription); subscriptions.delete(id);
      }
    }
    receipts.hold(initialization);
    for (const source of sources) {
      if (operation !== generation) return;
      const previous = subscriptions.get(source.id);
      if (previous?.active && source.enabled) { previous.source = {...source}; continue; }
      if (previous) deactivate(previous);
      if (!source.enabled) { ports.status(source, "Disabled"); continue; }
      // Each activation has a distinct callback identity; only entry cursors survive disable.
      const subscription: Subscription = {
        source:{...source}, context:{...context}, active:false, cursors:previous?.cursors ?? new Map(),
      };
      subscriptions.set(source.id, subscription);
      await activate(subscription);
    }
    if (operation !== generation) return;
    receipts.release(initialization);
  }
  return {synchronize, stop};
}
