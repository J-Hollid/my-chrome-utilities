import { createRuleConfigurationFromAttachedRule } from "../../utilities/data-layer/schemas.js";
/** Owns installed property-to-rule picker and focus-return coordination. */
export class SchemaPropertyRuleWorkflow {
    #ports;
    constructor(ports) { this.#ports = ports; }
    normalizedPath(path) { return this.#ports.rule.normalizePickerPath(path); }
    sampledCondition(path) { return this.#ports.rule.conditionPredicate(path, true); }
    configuredRule() { return this.#ports.rule.configuredRule(); }
    render() { this.#ports.pickerView.render(); this.#renderCondition(); }
    updatePreview() { if (this.#ports.rule.pickerPath)
        this.render(); }
    createConfigured() {
        const { rule } = this.#ports, draft = this.#ports.draft();
        if (!rule.pickerPath || (!this.#ports.activeSchemaId() && !draft))
            return false;
        const configured = rule.configuredRule(), saved = { ...configured, version: rule.editingAttached?.version ?? Math.max(1, configured.version + 1) };
        if (rule.configuration?.saveReusable)
            rule.replaceRules([...rule.rules.filter(({ id }) => id !== saved.id), saved]);
        const attached = this.#ports.attach(this.#ports.activeSchemaId() ?? draft.id, saved.id, rule.pickerPath, saved);
        if (attached)
            this.closeForCommit();
        return attached;
    }
    open(path, trigger) {
        const { canonical, canonicalView, property, rule } = this.#ports;
        if (canonical.editor && !canonical.editor.key.startsWith("saved:") && canonicalView.openRule(path, trigger))
            return;
        rule.setPicker(path, trigger);
        property.selectedPath = path;
        property.interactionReturn = { schemaId: this.#ports.active().id, path, triggerLabel: trigger?.ariaLabel ?? `Add rule for ${path}`,
            editorScroll: this.#ports.schemaEditor?.scrollTop ?? 0, treeScroll: this.#ports.propertyTree?.scrollTop ?? 0,
            detailScroll: this.#ports.schemaDetail?.scrollTop ?? 0 };
        rule.setConfiguration(undefined);
        this.render();
        this.#ports.picker?.showModal();
        this.#ports.picker?.querySelector("#schema-property-rule-search")?.focus({ preventScroll: true });
    }
    close() {
        const { property, propertyTree, rule, picker } = this.#ports, label = rule.pickerTrigger?.getAttribute("aria-label") ?? property.interactionReturn?.triggerLabel;
        picker?.close();
        const trigger = rule.pickerTrigger?.isConnected ? rule.pickerTrigger
            : Array.from(propertyTree?.querySelectorAll("button") ?? []).find((button) => button.getAttribute("aria-label") === label);
        trigger?.focus({ preventScroll: true });
        rule.resetPickerState();
        property.interactionReturn = undefined;
    }
    cancel(event) { event.preventDefault(); this.close(); }
    navigate(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            this.close();
            return;
        }
        if (!["ArrowDown", "ArrowUp", "Enter"].includes(event.key))
            return;
        const buttons = Array.from(this.#ports.picker?.querySelectorAll("#schema-property-rule-results button:not(:disabled)") ?? []), index = buttons.indexOf(this.#ports.document?.activeElement);
        if (event.key === "Enter" && index >= 0) {
            event.preventDefault();
            buttons[index]?.click();
            return;
        }
        if (!buttons.length || event.key === "Enter")
            return;
        event.preventDefault();
        buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
    }
    captureReturn(path, triggerLabel) {
        const { property } = this.#ports;
        property.interactionReturn = { schemaId: this.#ports.active().id, path, triggerLabel,
            editorScroll: this.#ports.schemaEditor?.scrollTop ?? 0, treeScroll: this.#ports.propertyTree?.scrollTop ?? 0,
            detailScroll: this.#ports.schemaDetail?.scrollTop ?? 0 };
    }
    restoreReturn() {
        const { property } = this.#ports, restoration = property.interactionReturn;
        if (!restoration || restoration.schemaId !== this.#ports.activeSchemaId())
            return;
        property.selectedPath = restoration.path;
        if (this.#ports.schemaEditor)
            this.#ports.schemaEditor.scrollTop = restoration.editorScroll;
        if (this.#ports.propertyTree)
            this.#ports.propertyTree.scrollTop = restoration.treeScroll;
        if (this.#ports.schemaDetail)
            this.#ports.schemaDetail.scrollTop = restoration.detailScroll;
        this.#ports.renderSchemas();
    }
    closeForCommit() { this.restoreReturn(); this.#ports.property.interactionReturn = undefined; this.close(); }
    openAttached(schemaId, ruleId, path, trigger) {
        const { rule } = this.#ports, schema = this.#ports.schemas().find(({ id }) => id === schemaId), attached = (schema?.workingDraft?.attachedRules ?? schema?.attachedRules)?.find(({ id }) => id === ruleId);
        if (!schema || !attached)
            return false;
        if (rule.stored(ruleId)) {
            this.#ports.showSubview("schema-rule-library");
            return rule.edit(ruleId);
        }
        const propertyPath = path ?? attached.propertyPath ?? "";
        this.#ports.property.selectedPath = propertyPath;
        rule.setPicker(propertyPath, trigger);
        rule.setEditingAttached(attached);
        rule.setConfiguration(createRuleConfigurationFromAttachedRule(ruleType(attached), this.#ports.propertyType(schema, propertyPath), attached));
        this.#ports.pickerView.render();
        this.#ports.picker?.showModal();
        this.#ports.picker?.querySelector("input, select, textarea, button")?.focus({ preventScroll: true });
        return true;
    }
    #renderCondition() {
        const { picker, rule } = this.#ports;
        if (!picker || !rule.pickerPath)
            return;
        picker.dataset.conditionPreview = JSON.stringify({ propertyPath: this.normalizedPath(rule.pickerPath), ...rule.conditionPredicate(rule.pickerPath) });
    }
}
function ruleType(rule) {
    const operator = rule.operator?.replaceAll("_", "-").toLowerCase();
    if (operator === "exact-value")
        return "Exact value";
    if (operator === "allowed-values")
        return "Allowed values";
    if (operator === "regular-expression" || operator === "regex")
        return "Regular expression";
    if (operator === "text-length")
        return "Text length";
    if (operator === "digits-only")
        return "Digits only";
    if (operator === "numeric-range")
        return "Numeric range";
    if (operator === "item-count")
        return "Item count";
    if (operator === "allow-undeclared-properties")
        return "Allow undeclared properties";
    return "Required";
}
//# sourceMappingURL=property-rule-workflow.js.map