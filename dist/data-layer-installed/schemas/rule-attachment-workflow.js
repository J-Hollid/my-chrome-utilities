import { publishReusableRuleSync, reviewReusableRuleSync } from "../../data-layer-reusable-rule-sync.js";
/** Owns pinned attachment upgrade and reusable-rule synchronization reviews. */
export class SchemaRuleAttachmentWorkflow {
    ports;
    #pendingUpgrade;
    #pendingSync;
    #approvedAttachmentUpdateId;
    constructor(ports) {
        this.ports = ports;
    }
    pendingUpgradeState() {
        return this.#pendingUpgrade ? structuredClone(this.#pendingUpgrade) : undefined;
    }
    pendingSyncState() {
        return this.#pendingSync ? structuredClone(this.#pendingSync) : undefined;
    }
    approvedAttachmentUpdate() { return this.#approvedAttachmentUpdateId; }
    review(rule) { return reviewReusableRuleSync(this.ports.behavior().schemas(), rule); }
    requestUpgrade(id, schemaIds) {
        const rule = this.ports.stored(id), p = this.ports.behavior();
        if (!rule)
            return false;
        const affected = p.schemas().filter((schema) => schemaIds.includes(schema.id) && schema.attachedRules?.some((item) => item.id === id));
        this.#pendingUpgrade = { id,
            schemaIds: [...schemaIds] };
        p.presentation.showUpgrade(rule, affected);
        return true;
    }
    confirmUpgrade() {
        const pending = this.#pendingUpgrade, p = this.ports.behavior();
        if (!pending)
            return;
        const rule = this.ports.stored(pending.id);
        if (!rule)
            return;
        p.replaceSchemas(p.schemas().map((schema) => !pending.schemaIds.includes(schema.id) || !schema.attachedRules ? schema : { ...schema,
            attachedRules: schema.attachedRules.map((attached) => attached.id !== rule.id ? attached : { ...attached, name: rule.name, version: rule.version,
                ...(rule.operator ? { operator: rule.operator } : {}), ...(rule.parameters ? { parameters: rule.parameters } : {}), ...(rule.severity ? { severity: rule.severity } : {}),
                ...(rule.message ? { message: rule.message } : {}), enabled: rule.enabled }) }));
        this.#approvedAttachmentUpdateId = pending.id;
        this.#pendingUpgrade = undefined;
        p.persistLibrary();
        p.presentation.close("upgrade");
    }
    cancelUpgrade() { this.#pendingUpgrade = undefined; this.ports.behavior().presentation.close("upgrade"); }
    requestSync(id) {
        const rule = this.ports.stored(id), p = this.ports.behavior();
        if (!rule)
            return false;
        const review = this.review(rule);
        this.#pendingSync = { rule: structuredClone(rule), review };
        p.presentation.showSync(review);
        return true;
    }
    confirmSync() {
        const pending = this.#pendingSync, p = this.ports.behavior();
        if (!pending)
            return;
        const rule = this.ports.stored(pending.rule.id);
        if (!rule)
            throw new Error("The reusable rule was removed after review");
        const review = this.review(rule);
        if (JSON.stringify(review) !== JSON.stringify(pending.review))
            throw new Error("The attached schemas changed after review");
        p.replaceSchemas(publishReusableRuleSync(p.schemas(), rule, review));
        this.#pendingSync = undefined;
        p.persistLibrary();
        p.renderAll();
        p.presentation.close("sync");
    }
    cancelSync() { this.#pendingSync = undefined; this.ports.behavior().presentation.close("sync"); }
    dispose() { this.#pendingUpgrade = undefined; this.#pendingSync = undefined; this.#approvedAttachmentUpdateId = undefined; }
}
//# sourceMappingURL=rule-attachment-workflow.js.map