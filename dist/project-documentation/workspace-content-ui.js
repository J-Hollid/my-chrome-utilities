import { reconcileProjectDocumentationConcepts } from "../data-layer-project-documentation-compiler.js";
import { projectCanonicalConcepts } from "../data-layer-layered-schema-project.js";
import { createProjectDocumentationSet } from "../data-layer-project-documentation-records.js";
import { documentationControlInput as controlInput, documentationHeading as heading, documentationLabelled as labelled } from "./workspace-ui-elements.js";
import { renderReorderControl, renderReorderableItemRow } from "../reorderable-editor/control.js";
import { reorderValues } from "../reorderable-editor/model.js";
export function renderDocumentationContent(host, set, available, saveSet, focusScope = host) {
    const flowSearch = controlInput("flowSearch", "", "search"), profileSearch = controlInput("profileSearch", "", "search");
    flowSearch.setAttribute("aria-label", "Search Flows");
    profileSearch.setAttribute("aria-label", "Search Site Profiles");
    const projectChoices = document.createElement("fieldset"), flowChoices = document.createElement("fieldset"), profileChoices = document.createElement("fieldset"), overview = set.sections.find(({ kind }) => kind === "overview"), overviewCheck = document.createElement("input");
    projectChoices.append(Object.assign(document.createElement("legend"), { textContent: "Project sections" }));
    const choice = (label, check) => labelled(label, check);
    overviewCheck.type = "checkbox";
    overviewCheck.checked = Boolean(overview?.selected);
    overviewCheck.addEventListener("change", () => { const sections = overview ? set.sections.map((section) => section.id === overview.id ? { ...section, selected: overviewCheck.checked } : section) : [{ id: `${set.id}:overview`, kind: "overview", name: "Overview", selected: true }, ...set.sections]; saveSet(createProjectDocumentationSet({ ...set, sections }), `${overviewCheck.checked ? "Select" : "Remove"} Overview`); });
    projectChoices.append(choice("Overview", overviewCheck));
    flowChoices.append(Object.assign(document.createElement("legend"), { textContent: "Flow value-map sections" }));
    profileChoices.append(Object.assign(document.createElement("legend"), { textContent: "Site Profile property-table sections" }));
    const draw = () => {
        flowChoices.querySelectorAll("label").forEach((value) => value.remove());
        profileChoices.querySelectorAll("label").forEach((value) => value.remove());
        for (const { entity } of available.flows.filter(({ entity }) => entity.name.toLowerCase().includes(flowSearch.value.toLowerCase()))) {
            const existing = set.sections.find((section) => section.kind === "flow" && section.targetId === entity.id), check = document.createElement("input");
            check.type = "checkbox";
            check.checked = Boolean(existing);
            check.addEventListener("change", () => { const sections = check.checked ? [...set.sections, { id: `section:flow:${entity.id}`, kind: "flow", name: entity.name, targetId: entity.id, selected: true }] : set.sections.filter(({ id }) => id !== existing?.id); saveSet(createProjectDocumentationSet({ ...set, sections }), `${check.checked ? "Select" : "Remove"} Flow ${entity.name}`); });
            flowChoices.append(choice(entity.name, check));
        }
        for (const profile of available.profiles.filter(({ name }) => name.toLowerCase().includes(profileSearch.value.toLowerCase()))) {
            const existing = set.sections.find((section) => section.kind === "profile" && section.targetId === profile.id), check = document.createElement("input");
            check.type = "checkbox";
            check.checked = Boolean(existing);
            check.addEventListener("change", () => { const sections = check.checked ? [...set.sections, { id: `section:profile:${profile.id}`, kind: "profile", name: profile.name, targetId: profile.id, selected: true }] : set.sections.filter(({ id }) => id !== existing?.id); saveSet(createProjectDocumentationSet({ ...set, sections }), `${check.checked ? "Select" : "Remove"} Site Profile ${profile.name}`); });
            profileChoices.append(choice(profile.name, check));
        }
    };
    flowSearch.addEventListener("input", draw);
    profileSearch.addEventListener("input", draw);
    draw();
    const ordered = document.createElement("ol"), contentSections = set.sections.filter(({ kind }) => kind === "overview" || kind === "flow" || kind === "profile");
    ordered.setAttribute("aria-label", "Documentation Set content choices");
    for (const section of contentSections) {
        const item = document.createElement("li"), include = document.createElement("input"), reorder = renderReorderControl({ itemId: section.id, itemLabel: section.name, completeOrder: contentSections.map(({ id, name }) => ({ id, label: name })), dropTarget: item, orderedContainer: ordered, focusScope, focusScopeId: `documentation-content:${set.id}`, onMove: ({ itemId, toIndex }) => { const moved = reorderValues(contentSections, itemId, toIndex, value => value.id); let index = 0; const sections = set.sections.map(candidate => candidate.kind === "overview" || candidate.kind === "flow" || candidate.kind === "profile" ? moved[index++] : candidate); saveSet(createProjectDocumentationSet({ ...set, sections }), `Reorder content choice ${section.name}`); return true; } });
        include.type = "checkbox";
        include.checked = section.kind === "overview" ? section.selected : true;
        include.addEventListener("change", () => { const sections = section.kind === "overview" ? set.sections.map(candidate => candidate.id === section.id ? { ...candidate, selected: include.checked } : candidate) : set.sections.filter(({ id }) => id !== section.id); saveSet(createProjectDocumentationSet({ ...set, sections }), `${include.checked ? "Select" : "Remove"} ${section.name}`); });
        item.dataset.documentationContentChoice = section.id;
        item.append(renderReorderableItemRow({ control: reorder, primaryContent: labelled(section.name, include) }));
        ordered.append(item);
    }
    host.append(projectChoices, flowSearch, flowChoices, profileSearch, profileChoices, ordered);
}
export function renderDocumentationConceptConfiguration(set, state, saveSet) {
    const region = document.createElement("section"), list = document.createElement("ol"), concepts = reconcileProjectDocumentationConcepts(set, projectCanonicalConcepts(state)), headings = document.createElement("input");
    region.setAttribute("aria-label", "Documentation concept configuration");
    region.append(heading(2, "Document settings"), Object.assign(document.createElement("p"), { textContent: "Concept configuration affects Site Profile tables and the Data capture matrix. It does not affect Flow value maps." }));
    list.setAttribute("aria-label", "Ordered documentation concepts");
    for (const concept of concepts) {
        const item = document.createElement("li"), include = document.createElement("input"), reorder = renderReorderControl({ focusScopeId: `documentation-concepts:${set.id}`, itemId: concept.name, itemLabel: concept.name, completeOrder: concepts.map(({ name }) => ({ id: name, label: name })), dropTarget: item, orderedContainer: list, onMove: ({ itemId, toIndex }) => { saveSet(createProjectDocumentationSet({ ...set, concepts: reorderValues(concepts, itemId, toIndex, value => value.name) }), `Reorder concept ${concept.name}`); return true; } });
        include.type = "checkbox";
        include.checked = concept.included;
        include.addEventListener("change", () => saveSet(createProjectDocumentationSet({ ...set, concepts: concepts.map((candidate) => candidate.name === concept.name ? { ...candidate, included: include.checked } : candidate) }), `${include.checked ? "Include" : "Exclude"} concept ${concept.name}`));
        item.dataset.documentationConcept = concept.name;
        item.append(renderReorderableItemRow({ control: reorder, primaryContent: labelled(concept.name, include) }));
        list.append(item);
    }
    headings.type = "checkbox";
    headings.checked = set.includeConceptSubheadings === true;
    headings.addEventListener("change", () => saveSet(createProjectDocumentationSet({ ...set, concepts, includeConceptSubheadings: headings.checked }), `${headings.checked ? "Include" : "Hide"} concept subheadings`));
    region.append(list, labelled("Include concept subheadings", headings));
    return region;
}
//# sourceMappingURL=workspace-content-ui.js.map