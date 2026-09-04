import type { SchemaRuleController } from "./rule-controller.js";
import type { RulePickerPorts } from "./rule-picker-contracts.js";
import { renderRulePickerSelection } from "./rule-picker-selection-view.js";
import { renderRulePickerConfiguration } from "./rule-picker-configuration-view.js";
/** Owns local rule picker DOM presentation and its temporary listeners. */
export class SchemaRulePickerView {
    readonly #controller: SchemaRuleController;
    readonly #ports: RulePickerPorts;
    constructor(controller: SchemaRuleController, ports: RulePickerPorts) {
        this.#controller = controller;
        this.#ports = ports;
    }
    render(): void {
        const c = this.#controller;
        const p = this.#ports;
        const path = c.pickerPath;
        p.incrementRender();
        if (!p.picker || !path)
            return;
        let workingConfiguration = c.configuration;
        c.clearPicker();
        const normalize = (value: string) => c.normalizePickerPath(value);
        const rerender = (): void => {
            if (workingConfiguration)
                c.setConfiguration(workingConfiguration);
            this.render();
        };
        if (renderRulePickerSelection(c, p, path, rerender, normalize))
            return;
        workingConfiguration = c.configuration;
        if (!workingConfiguration)
            return;
        renderRulePickerConfiguration(c, p, path, rerender, normalize, () => this.render(), workingConfiguration);
    }
}
