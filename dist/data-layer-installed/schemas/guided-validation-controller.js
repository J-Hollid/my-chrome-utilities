import { GUIDED_CONTINUATION_STORAGE_KEY, restoreGuidedContinuationSelections, selectGuidedContinuation, } from "../../utilities/data-layer/schemas.js";
export class SchemaGuidedValidationController {
    #storage;
    selections;
    propertyReturn;
    #dialogDisposers = [];
    #livePropertyDisposers = [];
    #allowedValueDisposers = [];
    constructor(storage) {
        this.#storage = storage;
        this.selections = restoreGuidedContinuationSelections(storage.getItem(GUIDED_CONTINUATION_STORAGE_KEY));
    }
    select(event, schemaId) {
        this.selections = selectGuidedContinuation(this.selections, event, schemaId);
        this.#storage.setItem(GUIDED_CONTINUATION_STORAGE_KEY, JSON.stringify(this.selections));
    }
    ownDialog(dispose) { this.#dialogDisposers.push(dispose); }
    ownLiveProperty(dispose) { this.#livePropertyDisposers.push(dispose); }
    ownAllowedValue(dispose) { this.#allowedValueDisposers.push(dispose); }
    clearDialog() { for (const dispose of this.#dialogDisposers.splice(0))
        dispose(); }
    clearLiveProperty() { for (const dispose of this.#livePropertyDisposers.splice(0))
        dispose(); }
    clearAllowedValue() { for (const dispose of this.#allowedValueDisposers.splice(0))
        dispose(); }
    dialogListenerCount() { return this.#dialogDisposers.length; }
    dispose() {
        this.clearDialog();
        this.clearLiveProperty();
        this.clearAllowedValue();
        this.propertyReturn = undefined;
    }
}
//# sourceMappingURL=guided-validation-controller.js.map