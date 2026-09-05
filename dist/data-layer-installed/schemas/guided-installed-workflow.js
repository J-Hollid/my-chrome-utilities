import { createGuidedValidationFlow, } from "../../utilities/data-layer/schemas.js";
import { schemaEditorDraft } from "./schema-model.js";
/** Owns the installed open, save, and return sequence for guided validation. */
export class SchemaGuidedInstalledWorkflow {
    #flow;
    #ports;
    constructor(ports) {
        this.#ports = ports;
        this.#flow = (ports.flowFactory ?? createGuidedValidationFlow)(ports.root, {
            schemaCandidates: () => ports.schemas().map((schema) => this.#candidate(schema)),
            publish: (result) => ports.controller.persistPublished(result),
            close: () => this.close(),
            saved: (result) => this.finishSave(result),
        });
    }
    #candidate(schema) {
        return this.#ports.controller.uiCandidate(schema, schema.workingDraft ? schemaEditorDraft(schema) : schema);
    }
    async openEvent(event, schema) {
        const captured = structuredClone(event), controller = this.#ports.controller;
        const selected = schema ?? controller.selected(captured) ?? controller.candidates(captured)[0]?.schema;
        if (selected)
            controller.select(captured, selected.id);
        controller.clearPropertyReturn();
        this.show(captured.id, selected?.id);
        this.#flow.open(controller.uiEvent(captured), selected ? this.#candidate(selected) : undefined);
    }
    async openProperty(event, schema, propertyPath, returnToSchema = true) {
        const captured = structuredClone(event), controller = this.#ports.controller;
        if (schema)
            controller.select(captured, schema.id);
        this.show(captured.id, schema?.id);
        this.#flow.openProperty(controller.uiEvent(captured), propertyPath, schema ? this.#candidate(schema) : undefined);
        if (returnToSchema) {
            if (schema)
                controller.setPropertyReturn({
                    kind: "schema", schemaId: schema.id, propertyPath, generation: this.#ports.generation(),
                });
            else
                controller.clearPropertyReturn();
        }
    }
    continuation(event) {
        const controller = this.#ports.controller, schema = controller.selected(event);
        return schema?.workingDraft ? {
            schemaId: schema.id, schemaName: schema.name, schemaVersion: schema.version,
            pendingChanges: schema.workingDraft.pendingChanges.length,
            addProperty: () => this.#flow.open(controller.uiEvent(event), this.#candidate(schema)),
            review: () => this.#ports.openDraft(schema),
            publish: () => { this.#ports.openDraft(schema); this.#ports.openRevisionReview(); },
            useDifferent: () => controller.openContinuationPicker(event),
        } : undefined;
    }
    persistAndFinish(result) {
        return this.#ports.controller.persistPublished(result).then(() => this.finishSave(result));
    }
    openValidation(event, schema) {
        this.#flow.open(this.#ports.controller.uiEvent(structuredClone(event)), schema ? this.#candidate(schema) : undefined);
    }
    closeValidation() { this.#flow.close(); }
    draftProjection() {
        const draft = this.#flow.currentDraft();
        return draft ? structuredClone(draft) : undefined;
    }
    dispose() { this.#flow.close(); }
    close() {
        const root = this.#ports.root;
        if (root) {
            root.hidden = true;
            root.removeAttribute("data-event-id");
            root.removeAttribute("data-schema-id");
        }
        this.#ports.controller.restorePropertyReturn();
    }
    openDraft(schema) { this.#ports.openDraft(schema); }
    show(eventId, schemaId) {
        const root = this.#ports.root;
        if (!root)
            return;
        root.hidden = false;
        root.dataset.eventId = eventId;
        root.dataset.schemaId = schemaId ?? "";
    }
    finishSave(result) {
        const ports = this.#ports, controller = ports.controller;
        controller.select({ sourceId: result.assignment.sourceId, name: result.assignment.eventName }, result.schema.id);
        const message = result.destination.kind === "new" ? `Draft ${result.schema.name} was created.` : `Validation was added to ${result.schema.name} draft.`;
        ports.saved?.(message);
        const propertyReturn = controller.propertyReturn();
        if (propertyReturn?.generation === ports.generation() && propertyReturn.kind === "capture") {
            const snapshot = controller.consumePropertyReturn({ generation: ports.generation(), kind: "capture" });
            if (snapshot?.kind === "capture")
                ports.restoreCapture(snapshot.eventId, snapshot.propertyPath);
        }
        else if (propertyReturn?.generation === ports.generation() && propertyReturn.kind === "schema" && propertyReturn.schemaId === result.schema.id) {
            controller.restorePropertyReturn();
        }
        if (ports.result)
            ports.result.textContent = message;
    }
}
//# sourceMappingURL=guided-installed-workflow.js.map