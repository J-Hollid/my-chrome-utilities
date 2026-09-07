import { contextExportIdentity, createContextExportSnapshot } from "./snapshot.js";
/** One confirmation and one immutable snapshot per open preview. */
export class ContextExportSession {
    load;
    ports;
    snapshot;
    #confirmed = false;
    #closed = false;
    constructor(load, ports) {
        this.load = load;
        this.ports = ports;
    }
    get stale() {
        try {
            return !this.snapshot || this.snapshot.identity !== contextExportIdentity(this.load());
        }
        catch {
            return true;
        }
    }
    get needsConfirmation() {
        return !this.#confirmed && Boolean(this.snapshot && (this.snapshot.compatibility.omitted.length || this.snapshot.compatibility.conversions.length));
    }
    refresh() {
        if (this.#closed)
            throw new Error("The export preview is closed.");
        this.#confirmed = false;
        this.snapshot = createContextExportSnapshot(this.load());
        return this.snapshot;
    }
    confirm() {
        if (this.stale || this.#closed)
            throw new Error("Refresh export before confirmation.");
        this.#confirmed = true;
    }
    current() {
        if (this.#closed)
            throw new Error("The export preview is closed.");
        if (this.stale || !this.snapshot)
            throw new Error("The schema changed. Refresh export before Copy or Download.");
        const source = this.load();
        if (source.pending)
            throw new Error("Wait for the current save to finish.");
        if (source.unconfirmed)
            throw new Error("Confirm or cancel the property edits before export.");
        if (this.needsConfirmation)
            throw new Error("Confirm the compatibility review before export.");
        return this.snapshot;
    }
    async copy() { await this.ports.copy(this.current().text); }
    async download() { await this.ports.download(this.current()); }
    close() { this.#closed = true; this.#confirmed = false; }
}
//# sourceMappingURL=session.js.map