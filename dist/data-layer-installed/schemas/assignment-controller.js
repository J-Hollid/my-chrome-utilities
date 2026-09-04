/** Owns installed Schema assignment editor and condition state. */
export class SchemaAssignmentController {
    editing;
    conditions = { target: "payload", suggestions: [] };
    #disposers = [];
    own(dispose) { this.#disposers.push(dispose); }
    dispose() {
        this.editing = undefined;
        this.conditions = { target: "payload", suggestions: [] };
        for (const dispose of this.#disposers.splice(0))
            dispose();
    }
}
//# sourceMappingURL=assignment-controller.js.map