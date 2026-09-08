/** Hold delivery across source snapshots, then restore extension receipt order. */
export function createObservationReceiptQueue() {
  const holds = new Set<object>();
  let pending: {receipt: number; deliver(): void}[] = [];
  const flush = (): void => {
    if (holds.size) return;
    const ready = pending;
    pending = [];
    ready.sort((left, right) => left.receipt - right.receipt).forEach(entry => entry.deliver());
  };
  return {
    hold(token: object): void { holds.add(token); },
    release(token: object): void { holds.delete(token); flush(); },
    held(): boolean { return holds.size > 0; },
    enqueue(receipt: number, deliver: () => void): void {
      if (holds.size) pending.push({receipt, deliver}); else deliver();
    },
    clear(): void { holds.clear(); pending = []; },
  };
}
