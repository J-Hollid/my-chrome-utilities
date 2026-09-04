import { assignmentConditionSuggestions, assignmentDataConditionSummary, duplicateSchemaAssignment, validateAssignmentDataConditions, } from "../../utilities/data-layer/schemas.js";
export function installSchemaAssignmentElements(root) {
    const editor = root.querySelector("#schema-assignment-editor");
    const save = root.querySelector("#save-schema-assignment");
    const ownerDocument = root.ownerDocument
        ?? ("createElement" in root ? root : undefined);
    const conditions = root.querySelector("#schema-assignment-data-conditions")
        ?? ownerDocument?.createElement("section") ?? null;
    if (conditions && !conditions.isConnected) {
        conditions.id = "schema-assignment-data-conditions";
        conditions.setAttribute("aria-label", "Data layer conditions");
        editor?.insertBefore(conditions, save);
    }
    return {
        editor,
        source: root.querySelector("#schema-assignment-source"),
        event: root.querySelector("#schema-assignment-event"),
        priority: root.querySelector("#schema-assignment-priority"),
        save,
        target: root.querySelector("#schema-assignment-target"),
        domain: root.querySelector("#schema-assignment-domain"),
        pathname: root.querySelector("#schema-assignment-pathname"),
        versionPolicy: root.querySelector("#schema-assignment-version-policy"),
        enabled: root.querySelector("#schema-assignment-enabled"),
        list: root.querySelector("#schema-assignment-list"),
        conflicts: root.querySelector("#schema-assignment-conflicts"),
        schema: root.querySelector("#schema-assignment-schema"),
        conditions,
        result: root.querySelector("#schema-assignment-result"),
    };
}
export function bindSchemaAssignmentElements(lifecycle, elements, create, controller) {
    lifecycle.listen(elements.target, "change", () => controller.changeTarget());
    lifecycle.listen(create, "click", () => controller.openNew());
    lifecycle.listen(elements.save, "click", () => controller.save());
}
/** Owns installed Schema assignment behavior, state, and condition rendering. */
export class SchemaAssignmentController {
    #ports;
    editing;
    conditions = { target: "payload", suggestions: [] };
    #disposers = [];
    constructor(ports) { this.#ports = ports; }
    own(dispose) { this.#disposers.push(dispose); }
    conditionState(target, group) {
        return { target, ...(group ? { group: structuredClone(group) } : {}),
            suggestions: assignmentConditionSuggestions(this.#ports.capturedValue(target)) };
    }
    renderConditionEditor() {
        const { conditions, save } = this.#ports.elements;
        if (!conditions)
            return;
        this.#ports.renderConditions(conditions, this.conditions, (next) => {
            this.conditions = { ...structuredClone(next), suggestions: assignmentConditionSuggestions(this.#ports.capturedValue(next.target)) };
            this.renderConditionEditor();
        });
        const validation = validateAssignmentDataConditions(this.conditions.group);
        if (save) {
            save.disabled = !validation.ready;
            save.title = validation.ready ? "" : validation.assistance;
        }
    }
    edit(schemaId, assignment) {
        this.editing = assignment.id ? { schemaId, assignmentId: assignment.id } : { schemaId };
        const elements = this.#ports.elements;
        if (elements.schema)
            elements.schema.value = schemaId;
        if (elements.source)
            elements.source.value = assignment.sourceId;
        if (elements.event)
            elements.event.value = assignment.eventName;
        if (elements.target)
            elements.target.value = assignment.target;
        if (elements.domain)
            elements.domain.value = assignment.domainCondition ?? "";
        if (elements.pathname)
            elements.pathname.value = assignment.pathnameCondition ?? "";
        if (elements.priority)
            elements.priority.value = String(assignment.priority ?? 0);
        if (elements.versionPolicy)
            elements.versionPolicy.value = assignment.versionPolicy ?? "pinned";
        if (elements.enabled)
            elements.enabled.checked = assignment.enabled !== false;
        this.conditions = this.conditionState(assignment.conditionTarget ?? assignment.target, assignment.dataConditionGroup);
        this.renderConditionEditor();
        if (elements.editor)
            elements.editor.hidden = false;
    }
    mutate(schemaId, assignmentId, mutate) {
        this.#ports.replaceSchemas(this.#ports.schemas().map((schema) => schema.id !== schemaId ? schema : { ...schema,
            assignments: schema.assignments.flatMap((assignment) => assignment.id !== assignmentId ? [assignment] : (() => {
                const changed = mutate(assignment);
                return changed ? [changed] : [];
            })()),
        }));
        this.#ports.persistAndRender();
    }
    render() {
        const elements = this.#ports.elements, schemas = this.#ports.schemas();
        const assignments = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment })));
        if (elements.schema?.ownerDocument)
            elements.schema.replaceChildren(...schemas.filter(({ published }) => published !== false).map((schema) => {
                const option = elements.schema.ownerDocument.createElement("option");
                option.value = schema.id;
                option.textContent = `${schema.name} version ${schema.version}`;
                return option;
            }));
        if (elements.list?.ownerDocument)
            elements.list.replaceChildren(...assignments.map(({ schema, assignment }) => {
                const document = elements.list.ownerDocument, item = document.createElement("li"), summary = document.createElement("span");
                summary.textContent = `${assignment.name ?? assignment.id ?? "Assignment"} · ${assignment.sourceId}/${assignment.eventName} · ${assignment.target} · ${assignmentDataConditionSummary(assignment)} · ${assignment.domainCondition ?? "any"}${assignment.pathnameCondition ?? "any"} · priority ${assignment.priority ?? 0} · ${assignment.versionPolicy ?? "pinned"} · ${assignment.enabled === false ? "disabled" : "enabled"} · ${schema.name}`;
                const edit = document.createElement("button"), duplicate = document.createElement("button"), disable = document.createElement("button"), remove = document.createElement("button");
                edit.type = duplicate.type = disable.type = remove.type = "button";
                edit.textContent = "Edit";
                duplicate.textContent = "Duplicate";
                disable.textContent = assignment.enabled === false ? "Enable" : "Disable";
                remove.textContent = "Delete";
                edit.addEventListener("click", () => this.edit(schema.id, assignment));
                duplicate.addEventListener("click", () => {
                    this.#ports.replaceSchemas(this.#ports.schemas().map((candidate) => candidate.id !== schema.id ? candidate : { ...candidate,
                        assignments: [...candidate.assignments, duplicateSchemaAssignment(assignment, `${assignment.id ?? "assignment"}:copy`, `${assignment.name ?? "Assignment"} copy`)] }));
                    this.#ports.persistAndRender();
                });
                disable.addEventListener("click", () => this.mutate(schema.id, assignment.id, (item) => ({ ...item, enabled: item.enabled === false })));
                remove.addEventListener("click", () => this.mutate(schema.id, assignment.id, () => undefined));
                item.append(summary, edit, duplicate, disable, remove);
                return item;
            }));
        const collisions = new Map();
        for (const { schema, assignment } of assignments.filter(({ assignment }) => assignment.enabled !== false)) {
            const key = [assignment.sourceId, assignment.eventName, assignment.target, assignment.priority ?? 0,
                assignment.domainCondition ?? "any", assignment.pathnameCondition ?? "any", assignmentDataConditionSummary(assignment)].join("|");
            collisions.set(key, [...(collisions.get(key) ?? []), `${schema.name}/${assignment.name ?? assignment.id ?? "unnamed"}`]);
        }
        const conflicts = [...collisions.values()].filter((matches) => matches.length > 1);
        if (elements.conflicts)
            elements.conflicts.textContent = conflicts.length
                ? `Assignment conflict: ${conflicts.map((matches) => matches.join(", ")).join("; ")}. Edit priorities before validation.` : "";
    }
    changeTarget() {
        if (!this.conditions.group) {
            this.conditions = this.conditionState(this.#ports.elements.target?.value === "raw input" ? "raw input" : "payload");
            this.renderConditionEditor();
        }
    }
    openNew() {
        this.editing = undefined;
        const target = this.#ports.elements.target?.value === "raw input" ? "raw input" : "payload";
        this.conditions = this.conditionState(target);
        this.renderConditionEditor();
        if (this.#ports.elements.editor)
            this.#ports.elements.editor.hidden = false;
        this.#ports.elements.source?.focus();
    }
    save() {
        const elements = this.#ports.elements, schemas = this.#ports.schemas(), schema = schemas.find((candidate) => candidate.id === elements.schema?.value) ?? schemas[0];
        if (!schema)
            return;
        const validation = validateAssignmentDataConditions(this.conditions.group);
        if (!validation.ready) {
            if (elements.result)
                elements.result.textContent = validation.assistance;
            this.renderConditionEditor();
            return;
        }
        const sourceId = elements.source?.value.trim() || "event-history", eventName = elements.event?.value.trim() || "page_view";
        const target = elements.target?.value === "raw input" ? "raw input" : "payload";
        const existing = this.editing?.schemaId === schema.id ? schema.assignments.find(({ id }) => id === this.editing?.assignmentId) : undefined;
        const next = { id: this.editing?.assignmentId ?? `assignment:${schema.id}:${eventName}`, name: existing?.name ?? `${schema.name} automatic`, sourceId, eventName, target,
            priority: Number(elements.priority?.value || 10), ...(elements.domain?.value.trim() ? { domainCondition: elements.domain.value.trim() } : {}),
            ...(elements.pathname?.value.trim() ? { pathnameCondition: elements.pathname.value.trim() } : {}),
            ...(this.conditions.group ? { conditionTarget: this.conditions.target, dataConditionGroup: structuredClone(this.conditions.group) } : {}),
            versionPolicy: elements.versionPolicy?.value === "follow latest" ? "follow latest" : "pinned", enabled: elements.enabled?.checked ?? true };
        this.#ports.replaceSchemas(schemas.map((candidate) => candidate.id !== schema.id ? candidate : { ...candidate,
            assignments: this.editing?.schemaId === schema.id ? candidate.assignments.map((assignment) => assignment.id === this.editing?.assignmentId ? next : assignment)
                : [...candidate.assignments.filter(({ id }) => id !== next.id), next] }));
        this.editing = undefined;
        this.#ports.persistAndRender();
        if (elements.editor)
            elements.editor.hidden = true;
        if (elements.result)
            elements.result.textContent = `Saved ${next.name} with ${assignmentDataConditionSummary(next)}.`;
    }
    dispose() {
        this.editing = undefined;
        this.conditions = { target: "payload", suggestions: [] };
        for (const dispose of this.#disposers.splice(0))
            dispose();
    }
}
//# sourceMappingURL=assignment-controller.js.map