import { createLiveSchemaPropertyDeclaration, } from "./data-layer-live-schema-property-declaration.js";
export function openLiveSchemaPropertyDeclarationDialog(input) {
    input.inspector.querySelector(".live-schema-property-declaration-review")?.remove();
    const dialog = document.createElement("dialog");
    dialog.className = "live-schema-property-declaration-review";
    dialog.setAttribute("aria-labelledby", "live-schema-property-declaration-heading");
    const feedback = document.createElement("output");
    feedback.setAttribute("aria-live", "polite");
    const close = (restoreFocus = true) => {
        if (dialog.open)
            dialog.close();
        dialog.remove();
        if (restoreFocus)
            input.trigger.focus({ preventScroll: true });
    };
    const showReview = (schema) => {
        const declaration = createLiveSchemaPropertyDeclaration(input.payload, input.concretePath, schema);
        const heading = document.createElement("h5");
        heading.id = "live-schema-property-declaration-heading";
        heading.tabIndex = -1;
        heading.textContent = "Review schema property declaration";
        const review = document.createElement("p");
        review.textContent = `${declaration.canonicalPath} · ${declaration.detectedType} · ${schema.name} revision ${schema.version}. No validation rule will be added.`;
        const confirm = document.createElement("button");
        confirm.type = "button";
        confirm.textContent = `Add property to ${schema.name} draft`;
        confirm.addEventListener("click", () => {
            try {
                const afterClose = input.confirm(schema, declaration);
                close(false);
                if (afterClose)
                    requestAnimationFrame(afterClose);
            }
            catch (error) {
                feedback.textContent = error instanceof Error
                    ? error.message
                    : "The property could not be added to the schema draft.";
            }
        });
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Cancel";
        cancel.addEventListener("click", () => close());
        dialog.replaceChildren(heading, review, feedback, confirm, cancel);
        heading.focus({ preventScroll: true });
    };
    const showDestinations = () => {
        const heading = document.createElement("h5");
        heading.id = "live-schema-property-declaration-heading";
        heading.tabIndex = -1;
        heading.textContent = "Choose schema destination";
        const choices = input.destinations.map((schema) => {
            const choose = document.createElement("button");
            choose.type = "button";
            choose.textContent = schema.name;
            choose.addEventListener("click", () => showReview(schema));
            return choose;
        });
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Cancel";
        cancel.addEventListener("click", () => close());
        dialog.replaceChildren(heading, ...choices, cancel);
        heading.focus({ preventScroll: true });
    };
    dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        close();
    });
    input.inspector.append(dialog);
    if (input.selected)
        showReview(input.selected);
    else
        showDestinations();
    dialog.showModal();
    dialog.querySelector("h5")?.focus({ preventScroll: true });
}
//# sourceMappingURL=data-layer-live-schema-property-declaration-ui.js.map