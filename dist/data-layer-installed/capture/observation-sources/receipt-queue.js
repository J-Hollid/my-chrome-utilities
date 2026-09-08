/** Hold delivery across source snapshots, then restore extension receipt order. */
export function createObservationReceiptQueue() {
    const holds = new Set();
    let pending = [];
    const flush = () => {
        if (holds.size)
            return;
        const ready = pending;
        pending = [];
        ready.sort((left, right) => left.receipt - right.receipt).forEach(entry => entry.deliver());
    };
    return {
        hold(token) { holds.add(token); },
        release(token) { holds.delete(token); flush(); },
        held() { return holds.size > 0; },
        enqueue(receipt, deliver) {
            if (holds.size)
                pending.push({ receipt, deliver });
            else
                deliver();
        },
        clear() { holds.clear(); pending = []; },
    };
}
//# sourceMappingURL=receipt-queue.js.map