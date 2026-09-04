import { createSchema } from "../../utilities/data-layer/schemas.js";
import { schemaDocumentFromValue } from "./schema-model.js";
/** Owns creation of transient Schema drafts from new and captured sources. */
export class SchemaSourceController {
    #ports;
    constructor(ports) { this.#ports = ports; }
    createEmpty() {
        const created = createSchema("", 1, { type: "object" }), transient = { ...created, published: false,
            workingDraft: { name: "", baseVersion: 1, sourceVersion: 1, document: { type: "object" }, assignments: [], pendingChanges: [] } };
        this.#ports.setDraft(transient);
        this.#ports.setSelectedPath("");
        this.#ports.render();
        this.#ports.focusName();
    }
    open(source) {
        const inferred = schemaDocumentFromValue(source.payload), document = inferred.type === "object"
            ? inferred : { type: "object", properties: { value: inferred } }, assignment = { sourceId: source.sourceId, eventName: source.eventName, target: "payload" }, created = createSchema(`${source.name} schema`, 1, document), schema = { ...created, published: false, assignments: [assignment],
            workingDraft: { baseVersion: 1, sourceVersion: 1, document: structuredClone(document), assignments: [assignment], pendingChanges: ["Create schema from captured source"] } };
        this.#ports.setDraft(schema);
        this.#ports.setSelectedPath(Object.keys(document.properties ?? {})[0] ?? "value");
        this.#ports.showSchemas();
        this.#ports.render();
        this.#ports.result(`${source.label} fields loaded into a new schema draft.`);
        this.#ports.focusName();
        return structuredClone(schema);
    }
}
//# sourceMappingURL=source-controller.js.map