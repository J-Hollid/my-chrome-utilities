import { exportJsonSchemaBundle, inspectJsonSchemaExport, } from "../../utilities/data-layer/schemas.js";
import { createExtensionSchemaExport, createStandardSchemaExport, } from "./library-export-policy.js";
export { omittedRuleStatus } from "./library-export-policy.js";
/** Owns export dialogs, focus return, download IO, and export review state. */
export class SchemaLibraryExportWorkflow {
    #library;
    #ports;
    #pending;
    #trigger;
    constructor(library, ports) {
        this.#library = library;
        this.#ports = ports;
    }
    reset() {
        this.#pending = undefined;
        this.#trigger = undefined;
    }
    request() {
        const button = this.#ports.elements.exportButton;
        if (button)
            this.openChoices(button);
    }
    openStandard(scope, schema) {
        const schemas = this.#library.schemas;
        const review = schema
            ? inspectJsonSchemaExport(schema, schemas)
            : exportJsonSchemaBundle(schemas).compatibility;
        this.#pending = { scope, ...(schema ? { schema } : {}), review };
        const dialog = this.#ports.elements.exportReview;
        const document = dialog?.ownerDocument;
        if (!dialog || !document)
            return;
        const heading = document.createElement("h4");
        const summary = document.createElement("p");
        const conversions = document.createElement("ul");
        const omitted = document.createElement("ul");
        heading.textContent = "JSON Schema Draft 2020-12 compatibility review";
        summary.textContent =
            scope === "library"
                ? `3rd-party validation format · ${schemas.filter((item) => item.published !== false && item.version > 0).length} schema resources`
                : `${schema?.name} · current published revision ${schema?.version}`;
        conversions.setAttribute("aria-label", "Standard export conversions");
        conversions.append(...review.conversions.map(({ ruleId, propertyPath, conversion }) => Object.assign(document.createElement("li"), {
            textContent: `${ruleId} at ${propertyPath}: ${conversion}`,
        })));
        if (!review.conversions.length) {
            conversions.append(Object.assign(document.createElement("li"), {
                textContent: "No severity or issue-message conversions",
            }));
        }
        omitted.setAttribute("aria-label", "Unsupported rules omitted from standard export");
        omitted.append(...review.omitted.map(({ ruleName, propertyPath, behavior }) => Object.assign(document.createElement("li"), {
            textContent: `${ruleName} at ${propertyPath}: unsupported ${behavior}; omitted`,
        })));
        if (!review.omitted.length) {
            omitted.append(Object.assign(document.createElement("li"), {
                textContent: "No unsupported rules",
            }));
        }
        const confirm = document.createElement("button");
        const cancel = document.createElement("button");
        confirm.type = cancel.type = "button";
        confirm.textContent = review.omitted.length
            ? "Export without unsupported rules"
            : "Export JSON Schema Draft 2020-12";
        cancel.textContent = "Cancel";
        confirm.addEventListener("click", () => this.#confirmStandard());
        cancel.addEventListener("click", () => {
            this.#pending = undefined;
            dialog.close();
            this.#trigger?.focus({ preventScroll: true });
        });
        dialog.replaceChildren(heading, summary, conversions, omitted, confirm, cancel);
        dialog.showModal();
        confirm.focus({ preventScroll: true });
    }
    openChoices(trigger, schema) {
        const dialog = this.#ports.elements.exportChoices;
        const document = dialog?.ownerDocument;
        this.#trigger = trigger;
        if (!dialog || !document)
            return false;
        const heading = document.createElement("h4");
        const extension = document.createElement("button");
        const extensionDescription = document.createElement("p");
        const standard = document.createElement("button");
        const standardDescription = document.createElement("p");
        const cancel = document.createElement("button");
        heading.textContent = schema
            ? `Export ${schema.name}`
            : "Export Schema Library";
        extension.type = standard.type = cancel.type = "button";
        extension.textContent = schema
            ? "Extension schema package"
            : "Extension backup";
        extensionDescription.textContent = schema
            ? "For restoring this schema and its extension dependencies."
            : "For complete extension backup and restore.";
        standard.textContent = schema
            ? "JSON Schema Draft 2020-12"
            : "JSON Schema Draft 2020-12 bundle";
        standardDescription.textContent =
            "For third-party standards-based validation; not extension configuration.";
        if (schema?.published === false || schema?.version === 0) {
            standard.disabled = true;
            standard.title =
                "Publish the schema before exporting a standard revision";
            standardDescription.textContent = standard.title;
        }
        cancel.textContent = "Cancel";
        extension.addEventListener("click", () => this.#exportExtension(schema));
        standard.addEventListener("click", () => {
            dialog.close();
            this.openStandard(schema ? "schema" : "library", schema);
        });
        cancel.addEventListener("click", () => {
            dialog.close();
            this.#trigger?.focus({ preventScroll: true });
            this.#trigger = undefined;
        });
        dialog.replaceChildren(heading, extension, extensionDescription, standard, standardDescription, cancel);
        dialog.showModal();
        extension.focus({ preventScroll: true });
        return true;
    }
    #finish(status) {
        if (this.#ports.elements.result) {
            this.#ports.elements.result.textContent = status;
        }
        this.#ports.elements.exportReview?.close();
        this.#ports.elements.exportChoices?.close();
        this.#pending = undefined;
        this.#trigger?.focus({ preventScroll: true });
        this.#trigger = undefined;
    }
    #confirmStandard() {
        const pending = this.#pending;
        if (!pending)
            return;
        if (pending.scope === "library") {
            const exported = createStandardSchemaExport(this.#library.schemas);
            this.#ports.download(exported.document, exported.filename);
            this.#finish(exported.status);
        }
        else if (pending.schema) {
            const exported = createStandardSchemaExport(this.#library.schemas, pending.schema);
            this.#ports.download(exported.document, exported.filename);
            this.#finish(exported.status);
        }
    }
    #exportExtension(schema) {
        const exported = createExtensionSchemaExport(this.#library.schemas, this.#ports.rules(), schema);
        this.#ports.download(exported.document, exported.filename);
        this.#finish(exported.status);
    }
}
//# sourceMappingURL=library-export-workflow.js.map