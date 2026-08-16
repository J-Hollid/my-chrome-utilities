import { flowDocumentationPropertyPaths } from "../data-layer-flow-table-documentation-export.js";
import { projectDocumentationProfileColumns, projectDocumentationProfileConceptProperties } from "../data-layer-project-documentation-compiler.js";
import { declareStudioChoice } from "../data-layer-studio-choice-controls.js";
import { documentationButton as button, documentationCheckedOrder as checkedOrder, documentationControlInput as controlInput, documentationHeading as heading, documentationLabelled as labelled, documentationMove as move, documentationSetChecked as setChecked, } from "./workspace-ui-elements.js";
import { createDocumentationProfileConceptRenderer } from "./workspace-profile-concepts-ui.js";
export function createDocumentationSectionConfigurationRenderer(mutateSection) {
    const renderProfileConcepts = createDocumentationProfileConceptRenderer(mutateSection);
    const renderOrderedChoices = (host, input) => {
        const selected = new Set(input.selected), list = document.createElement("ol");
        list.setAttribute("aria-label", `${input.name} order`);
        for (const item of input.all) {
            const row = document.createElement("li"), check = document.createElement("input");
            check.type = "checkbox";
            declareStudioChoice(check, input.choiceKey);
            check.checked = selected.has(item.id);
            check.addEventListener("change", () => input.onChange(setChecked(input.selected, item.id, check.checked)));
            row.append(labelled(item.label, check));
            if (check.checked) {
                const earlier = button("Move earlier", () => input.onChange(move(input.selected, item.id, -1))), later = button("Move later", () => input.onChange(move(input.selected, item.id, 1)));
                earlier.disabled = input.selected.indexOf(item.id) === 0;
                later.disabled = input.selected.indexOf(item.id) === input.selected.length - 1;
                row.append(earlier, later);
            }
            list.append(row);
        }
        host.append(list);
    };
    const renderFlow = (host, set, section, available) => {
        const source = available.flows.find(({ entity }) => entity.id === section.targetId);
        host.dataset.configurationKind = "flow";
        host.append(heading(3, `Configure Flow value map · ${section.name}`));
        if (!source) {
            host.append("Flow unavailable.");
            return;
        }
        const contexts = source.snapshot.contexts.map(({ id, pageName, eventName }) => ({ id, label: `${pageName} / ${eventName}` })), contextIds = checkedOrder(contexts.map(({ id }) => id), section.configuration?.contextIds), paths = checkedOrder(flowDocumentationPropertyPaths(source.snapshot), section.configuration?.paths), metadata = (section.configuration?.columns ?? []);
        const contextGroup = document.createElement("fieldset");
        contextGroup.append(Object.assign(document.createElement("legend"), { textContent: "Value-map contexts and ordering" }));
        renderOrderedChoices(contextGroup, { all: contexts, selected: contextIds, name: "Flow contexts", choiceKey: "documentation.flow-context", onChange: (next) => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, contextIds: next } }), "Configure Flow contexts") });
        const labels = document.createElement("div");
        labels.setAttribute("aria-label", "Flow documentation labels");
        for (const context of contexts.filter(({ id }) => contextIds.includes(id))) {
            const input = controlInput(`label:${context.id}`, section.configuration?.labels?.[context.id] ?? "");
            input.setAttribute("aria-label", `Documentation label for ${context.label}`);
            input.addEventListener("change", () => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, labels: { ...value.configuration?.labels, [context.id]: input.value } } }), `Label ${context.label}`));
            labels.append(labelled(context.label, input));
        }
        contextGroup.append(labels);
        const pathGroup = document.createElement("fieldset");
        pathGroup.append(Object.assign(document.createElement("legend"), { textContent: "Property rows and ordering" }));
        renderOrderedChoices(pathGroup, { all: flowDocumentationPropertyPaths(source.snapshot).map((path) => ({ id: path, label: path })), selected: paths, name: "Flow property rows", choiceKey: "documentation.property-row", onChange: (next) => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, paths: next } }), "Configure Flow property rows") });
        const metadataGroup = document.createElement("fieldset");
        metadataGroup.append(Object.assign(document.createElement("legend"), { textContent: "Metadata columns" }));
        for (const [id, label] of [["description", "Description"], ["type", "Type"], ["allowedValues", "Allowed values"], ["example", "Example"], ["comments", "Comments"]]) {
            const check = document.createElement("input");
            check.type = "checkbox";
            declareStudioChoice(check, "documentation.metadata-column");
            check.checked = metadata.includes(id);
            check.addEventListener("change", () => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, columns: setChecked(metadata, id, check.checked) } }), `Configure Flow metadata ${label}`));
            metadataGroup.append(labelled(label, check));
        }
        host.append(contextGroup, pathGroup, metadataGroup);
    };
    const renderMatrix = (host, set, section, available) => {
        host.dataset.configurationKind = "matrix";
        host.append(heading(3, "Configure project capture matrix"));
        const search = controlInput("matrixSearch", "", "search"), tree = document.createElement("div"), selected = section.configuration?.contextIds ?? [];
        search.setAttribute("aria-label", "Search capture-matrix hierarchy");
        const draw = () => { tree.replaceChildren(); const matches = available.matrixContexts.filter(({ searchText, label }) => `${searchText} ${label}`.toLowerCase().includes(search.value.trim().toLowerCase())), groups = new Map(); for (const context of matches) {
            const parents = groups.get(context.groupLabel) ?? new Map(), items = parents.get(context.parentLabel) ?? [];
            items.push(context);
            parents.set(context.parentLabel, items);
            groups.set(context.groupLabel, parents);
        } for (const [group, parents] of groups) {
            const groupSet = document.createElement("fieldset");
            groupSet.dataset.matrixGroup = group;
            groupSet.append(Object.assign(document.createElement("legend"), { textContent: group }));
            for (const [parent, contexts] of parents) {
                const sectionHost = document.createElement("section");
                sectionHost.dataset.matrixParent = parent;
                sectionHost.append(heading(4, parent));
                for (const context of contexts) {
                    const check = document.createElement("input");
                    check.type = "checkbox";
                    declareStudioChoice(check, "documentation.matrix-context");
                    check.checked = selected.includes(context.id);
                    check.dataset.matrixContextId = context.id;
                    check.dataset.matrixContextKind = context.kind;
                    check.addEventListener("change", () => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, contextIds: setChecked(selected, context.id, check.checked) } }), `Configure matrix ${context.label}`));
                    sectionHost.append(labelled(context.label, check));
                }
                groupSet.append(sectionHost);
            }
            tree.append(groupSet);
        } };
        search.addEventListener("input", draw);
        draw();
        host.append(search, tree);
        const order = document.createElement("fieldset");
        order.append(Object.assign(document.createElement("legend"), { textContent: "Selected matrix column order" }));
        renderOrderedChoices(order, { all: available.matrixContexts.filter(({ id }) => selected.includes(id)).map(({ id, label }) => ({ id, label })), selected, name: "Matrix columns", choiceKey: "documentation.matrix-context", onChange: (next) => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, contextIds: next } }), "Reorder matrix columns") });
        host.append(order);
    };
    const renderProfile = (host, set, section, available) => {
        host.dataset.configurationKind = "profile";
        host.append(heading(3, `Configure Site Profile · ${section.name}`));
        const profile = available.profiles.find(({ id }) => id === section.targetId);
        if (!profile) {
            host.append("Site Profile unavailable.");
            return;
        }
        const columns = checkedOrder(projectDocumentationProfileColumns(), section.configuration?.columns), rows = document.createElement("section");
        renderProfileConcepts(rows, set, section, projectDocumentationProfileConceptProperties(profile));
        const columnHost = document.createElement("fieldset");
        columnHost.append(Object.assign(document.createElement("legend"), { textContent: "Profile columns and ordering" }));
        renderOrderedChoices(columnHost, { all: projectDocumentationProfileColumns().map((column) => ({ id: column, label: column })), selected: columns, name: `${section.name} columns`, choiceKey: "documentation.profile-column", onChange: (next) => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, columns: next } }), `Configure ${section.name} columns`) });
        host.append(rows, columnHost);
    };
    return (host, set, section, available) => {
        host.setAttribute("aria-label", "Selected documentation section configuration");
        if (section?.kind === "flow")
            renderFlow(host, set, section, available);
        else if (section?.kind === "matrix")
            renderMatrix(host, set, section, available);
        else if (section?.kind === "profile")
            renderProfile(host, set, section, available);
        else
            host.append(heading(3, "Configure Overview"), Object.assign(document.createElement("p"), { textContent: "Overview derives the project name, purpose, and website." }));
    };
}
//# sourceMappingURL=workspace-build-ui.js.map