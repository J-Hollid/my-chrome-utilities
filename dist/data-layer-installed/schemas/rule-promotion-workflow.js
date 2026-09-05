import { promoteLocalRule, reviewLocalRulePromotion } from "../../data-layer-local-rule-promotion.js";
import { storedPromotionRules } from "./schema-model.js";
/** Owns local-rule promotion review generations, settlement, and focus return. */
export class SchemaRulePromotionWorkflow {
    ports;
    #pending;
    #focusReturn;
    #focusedPosition;
    #generation = 0;
    constructor(ports) {
        this.ports = ports;
    }
    pendingState() {
        return this.#pending ? { ...this.#pending } : undefined;
    }
    focusReturnState() {
        return this.#focusReturn ? { ...this.#focusReturn } : undefined;
    }
    focusedPositionState() {
        return this.#focusedPosition ? { ...this.#focusedPosition } : undefined;
    }
    generationValue() { return this.#generation; }
    rememberFocusedPosition(value) { this.#focusedPosition = { ...value }; }
    restore(ruleId, rerender = true) {
        const p = this.ports.behavior();
        if (this.#pending)
            this.#focusReturn = { propertyPath: this.#pending.propertyPath,
                ruleId: ruleId ?? this.#pending.sourceRuleId, detailScroll: this.#pending.detailScroll };
        this.#pending = undefined;
        if (rerender) {
            p.renderAll();
            this.ports.render();
        }
        const focus = this.#focusReturn ? { ...this.#focusReturn } : undefined;
        if (!focus)
            return;
        const restore = () => { if (p.detail && p.detail.scrollTop !== focus.detailScroll)
            p.detail.scrollTop = focus.detailScroll; };
        p.detail?.addEventListener("scroll", restore);
        restore();
        p.scheduleFrame(() => {
            restore();
            p.scheduleFrame(() => {
                Array.from(p.root.querySelectorAll("button[data-rule-id]")).find(({ dataset }) => dataset.ruleId === focus.ruleId && dataset.propertyPath === focus.propertyPath)?.focus({ preventScroll: true });
                restore();
                p.detail?.removeEventListener("scroll", restore);
            });
        });
    }
    open(propertyPath, sourceRuleId) {
        const p = this.ports.behavior(), stored = p.activeSchemaId() ? p.schemas().find(({ id }) => id === p.activeSchemaId()) : undefined, schema = stored ?? p.draft();
        if (!schema)
            return false;
        const editorContext = stored ? "editable" : "new-schema", generation = ++this.#generation, reusableRules = structuredClone(this.ports.rules());
        let review;
        try {
            review = reviewLocalRulePromotion({ schema, reusableRules, propertyPath, sourceRuleId, editorContext });
        }
        catch (error) {
            p.result(error instanceof Error ? error.message : "Promotion is no longer available.");
            return false;
        }
        const focused = this.#focusedPosition?.propertyPath === propertyPath && this.#focusedPosition.ruleId === sourceRuleId ? this.#focusedPosition : undefined;
        this.#pending = { propertyPath,
            sourceRuleId,
            generation, detailScroll: focused?.detailScroll ?? p.detail?.scrollTop ?? 0 };
        this.#focusReturn = undefined;
        p.promotionDialog.open({ review, cancel: () => { if (this.#pending?.generation === generation)
                this.restore(undefined, false); },
            confirm: (selected) => {
                if (this.#pending?.generation !== generation)
                    throw new Error("The promotion review is stale");
                const previousSchemas = structuredClone(p.schemas()), previousRules = structuredClone(this.ports.rules()), result = selected.action === "create" ? promoteLocalRule({ schema, reusableRules,
                    propertyPath, sourceRuleId, editorContext, ...selected }) : promoteLocalRule({ schema, reusableRules, propertyPath, sourceRuleId, editorContext, action: "use-existing",
                    reusableRuleId: selected.reusableRuleId }), nextSchemas = stored ? p.schemas().map((candidate) => candidate.id === result.schema.id ? result.schema : candidate) : p.schemas(), nextRules = storedPromotionRules(result.reusableRules);
                if (!stored) {
                    this.ports.replaceRules(structuredClone(nextRules));
                    p.replaceDraft(structuredClone(result.schema));
                    this.ports.persist();
                    p.renderDraft();
                    this.ports.render();
                    this.restore();
                    return;
                }
                return p.commitPromotion(result.schema.id, previousSchemas, previousRules, nextSchemas, nextRules).then(async () => {
                    await p.settleCanonical?.(result.schema.id);
                    const focus = () => Array.from(p.root.querySelectorAll("button[data-rule-id]")).find(({ dataset }) => dataset.ruleId === result.replacementRuleId &&
                        dataset.propertyPath === propertyPath)?.focus({ preventScroll: true });
                    p.scheduleFrame(() => p.scheduleFrame(focus));
                    return () => {
                        if (this.#pending?.generation === generation) {
                            p
                                .result(`Promoted ${sourceRuleId} to reusable rule ${result.replacementRuleId}.`);
                            this.restore(result.replacementRuleId);
                        }
                        p.scheduleFrame(() => p.scheduleFrame(focus));
                    };
                });
            } });
        return true;
    }
    dispose() { this.#pending = undefined; this.#focusReturn = undefined; this.#focusedPosition = undefined; }
}
//# sourceMappingURL=rule-promotion-workflow.js.map