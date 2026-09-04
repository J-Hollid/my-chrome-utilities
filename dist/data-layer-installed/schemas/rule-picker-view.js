import { renderRulePickerSelection } from "./rule-picker-selection-view.js";
import { renderRulePickerConfiguration } from "./rule-picker-configuration-view.js";
/** Owns local rule picker DOM presentation and its temporary listeners. */
export class SchemaRulePickerView {
    #controller;
    #ports;
    constructor(controller, ports) {
        this.#controller = controller;
        this.#ports = ports;
    }
    render() {
        const c = this.#controller;
        const p = this.#ports;
        const path = c.pickerPath;
        p.incrementRender();
        if (!p.picker || !path)
            return;
        let workingConfiguration = c.configuration;
        c.clearPicker();
        const normalize = (value) => c.normalizePickerPath(value);
        const rerender = () => {
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
//# sourceMappingURL=rule-picker-view.js.map