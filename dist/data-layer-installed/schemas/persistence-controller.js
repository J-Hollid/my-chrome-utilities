import { SCHEMA_LIBRARY_STORAGE_KEY, savedSchemaCanonicalDocument, serializeSchemaLibrary } from "../../utilities/data-layer/schemas.js";
export class SchemaPersistenceController {
    #ports;
    #generation = 0;
    promotion;
    guided;
    constructor(ports) { this.#ports = ports; }
    apply(schemas, rules) { const p = this.#ports; p.library.replaceSchemas(schemas); p.rules.replaceRules(rules); p.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(p.library.schemas)); p.rules.persist(); p.renderAll(); p.renderRules(); }
    restore(schemas, rules) { const p = this.#ports; p.library.replaceSchemas(schemas); p.rules.replaceRules(rules); p.rules.persist(); p.renderAll(); p.renderRules(); }
    begin(kind, schemaId, previousSchemas, previousRules, nextSchemas, nextRules) {
        const generation = ++this.#generation;
        let resolve, reject;
        const completion = new Promise((done, failed) => { resolve = done; reject = failed; });
        const transaction = { schemaId, generation, kind, paused: false, settled: false, previousSchemas: structuredClone([...previousSchemas]), previousRules: structuredClone([...previousRules]), nextSchemas: structuredClone([...nextSchemas]), nextRules: structuredClone([...nextRules]),
            pause: () => { if (transaction.settled || transaction.paused)
                return; transaction.paused = true; this.restore(transaction.previousSchemas, transaction.previousRules); },
            complete: () => { if (transaction.settled || transaction.generation !== generation)
                return; transaction.settled = true; if (transaction.paused)
                this.apply(transaction.nextSchemas, transaction.nextRules); this.#clear(transaction); resolve(); },
            reject: (error) => { if (transaction.settled || transaction.generation !== generation)
                return; transaction.settled = true; this.restore(transaction.previousSchemas, transaction.previousRules); this.#clear(transaction); reject(error); } };
        if (kind === "promotion")
            this.promotion = transaction;
        else
            this.guided = transaction;
        return completion;
    }
    settle(event) {
        const p = this.#ports, position = p.property.pendingCopyPosition;
        if (position && position.settlementSchemaId === event.schemaId && ["saved", "retried", "rejected"].includes(event.type)) {
            const restore = () => { p.root.querySelector(`#schema-property-tree button[aria-label="Copy ${position.path} to another schema"]`)?.focus({ preventScroll: true }); const editor = p.root.querySelector("#schema-editor"), tree = p.root.querySelector("#schema-property-tree"); if (editor)
                editor.scrollTop = position.editorScroll; if (tree)
                tree.scrollTop = position.treeScroll; };
            queueMicrotask(restore);
            p.scheduleFrame(() => { restore(); p.scheduleFrame(() => { restore(); if (p.property.pendingCopyPosition === position)
                p.property.pendingCopyPosition = undefined; }); });
        }
        const canonical = p.canonical, adapter = canonical.editor;
        if (event.type === "retried" && adapter && canonical.projectionRequest?.adapter === adapter && canonical.savedSchemaId(adapter) === event.schemaId)
            return canonical.resumeProjectionPersistence(adapter).then(() => { p.renderAll(); p.renderCanonical(); });
        if (event.type === "saved") {
            const acknowledged = [...canonical.settlementClaims].find(([, schemaId]) => schemaId === event.schemaId)?.[0];
            if (acknowledged !== undefined)
                p.clearCanonicalSettlement(event.schemaId, acknowledged);
            if (adapter)
                p.renderCanonical();
        }
        if (canonical.settlementSchemaId === event.schemaId && (event.type === "retried" || event.type === "rejected")) {
            p.clearCanonicalSettlement(event.schemaId);
            if (event.type === "rejected")
                canonical.rejectDurableChange();
            if (adapter)
                p.renderCanonical();
        }
        const pending = [this.promotion, this.guided], transactional = pending.some((candidate) => candidate?.schemaId === event.schemaId && !candidate.settled);
        if (event.type === "failed" && !transactional && canonical.settlementSchemaId !== event.schemaId) {
            p.library.reload();
            if (p.library.activeSchemaId) {
                const stored = p.library.schemas.find(({ id }) => id === p.library.activeSchemaId);
                if (stored) {
                    p.library.setDraft(p.editorDraft(stored));
                    canonical.setSavedDocument(savedSchemaCanonicalDocument(p.library.draft, (kind) => canonical.createCanonicalId(kind)));
                }
            }
            p.renderAll();
        }
        for (const transaction of pending) {
            if (!transaction || transaction.schemaId !== event.schemaId || transaction.settled)
                continue;
            if (event.type === "failed") {
                if (transaction.kind === "guided")
                    transaction.pause();
                continue;
            }
            if (event.type === "rejected")
                transaction.reject(event.error);
            else
                transaction.complete();
        }
    }
    dispose(error) { this.promotion?.reject(error); this.guided?.reject(error); }
    #clear(transaction) { if (this.promotion === transaction)
        this.promotion = undefined; if (this.guided === transaction)
        this.guided = undefined; }
}
//# sourceMappingURL=persistence-controller.js.map