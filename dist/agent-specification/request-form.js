import { agentKinds } from "./types.js";
import { profileProperties } from "./context.js";
import { element, field, select } from "./ui-elements.js";
export function requestForm(project) {
    const root = element("section"), mode = select([["page", "Draft a Page"], ["event", "Draft an in-page Event"], ["propertySet", "Draft a Property Set"], ["flow", "Draft events for a Flow"], ["import", "Import an Excel specification"], ["template", "Convert Excel to an export template"], ["both", "Import Excel and create export templates"]]);
    const description = element("textarea");
    description.rows = 4;
    description.placeholder = "Describe the page, action, expected data, and firing conditions. State which parts need review.";
    const flow = select([["", "No flow"], ...project.collections.flows.map(item => [item.id, item.name])]);
    const files = element("input");
    files.type = "file";
    files.multiple = true;
    files.accept = ".xlsx,image/png,image/jpeg,image/webp";
    const source = element("input");
    source.placeholder = "For example: checkout-specification. Keep this key for later imports.";
    const allowNew = element("input");
    allowNew.type = "checkbox";
    allowNew.checked = true;
    const definitions = element("details"), grid = element("div");
    grid.className = "agent-context";
    definitions.append(element("summary", "Allowed definitions and Shared Profile properties"), element("p", "Clear a box to exclude a definition or property. The agent can use only the selected definitions."), grid);
    const checks = new Map(), properties = new Map();
    for (const kind of agentKinds) {
        const section = element("section");
        section.append(element("strong", kind === "propertySets" ? "Property Sets" : kind === "profiles" ? "Shared Profiles" : kind));
        for (const entity of project.collections[kind]) {
            const check = element("input");
            check.type = "checkbox";
            check.checked = true;
            checks.set(entity.id, check);
            section.append(field(entity.name, check));
            if (kind === "profiles") {
                const detail = element("details"), selected = new Map();
                detail.append(element("summary", `${entity.name} properties`));
                for (const property of profileProperties(project, entity.id)) {
                    const input = element("input");
                    input.type = "checkbox";
                    input.checked = true;
                    selected.set(property.id, input);
                    detail.append(field(`${property.path} (${property.type})`, input));
                }
                properties.set(entity.id, selected);
                section.append(detail);
            }
        }
        grid.append(section);
    }
    root.append(field("Task", mode), field("Request", description), field("Flow with screenshots", flow), field("Excel or screenshot files", files), field("Import source key", source), field("Allow new Shared Profiles and Property Sets", allowNew), definitions);
    return { root, files, values: () => ({ mode: mode.value, description: description.value.trim(), flowId: flow.value, sourceKey: source.value.trim(), allowNewDefinitions: allowNew.checked,
            permittedIds: [...checks].filter(([, check]) => check.checked).map(([id]) => id), selectedProperties: Object.fromEntries([...properties].map(([id, items]) => [id, [...items].filter(([, check]) => check.checked).map(([key]) => key)])) }) };
}
//# sourceMappingURL=request-form.js.map