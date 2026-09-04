import { builtInRulesForProperty, createRuleConfiguration, reusableRuleMetadata, reusableRulesForProperty,
     } from "../../utilities/data-layer/schemas.js";
import type { SchemaRuleController } from "./rule-controller.js";
import type { RulePickerPorts } from "./rule-picker-contracts.js";
/** Renders the rule-selection and reusable-rule attachment view. */
export function renderRulePickerSelection(c: SchemaRuleController, p: RulePickerPorts, path: string, rerender: () => void,
     normalize: (value: string) => string): boolean {
    const picker = p.picker;
    const document = picker?.ownerDocument;
    if (!picker || !document || c.configuration)
        return false;
    const heading = document.createElement("h4"), search = document.createElement("input"), results = document.createElement("section"),
         cancel = document.createElement("button"), propertyType = c.typeForAttachment(p.active(), path);
    heading.id = "schema-property-rule-picker-heading";
    heading.textContent = `Add rule for ${path} · type ${propertyType}`;
    results.id = "schema-property-rule-results";
    search.id = "schema-property-rule-search";
    search.value = c.pickerSearch;
    picker.setAttribute("aria-labelledby", heading.id);
    cancel.type = "button";
    cancel.textContent = "Cancel";
    const canonical = normalize(path), attachedIds = new Set((p.active().workingDraft?.attachedRules ??
        p.active().attachedRules ??
        [])
        .filter(({ propertyPath }) => normalize(propertyPath ?? "") === canonical)
        .map(({ id }) => id)), query = c.pickerSearch.trim().toLowerCase(), builtIns = builtInRulesForProperty(propertyType).filter((rule) => !query ||
        [rule.name, rule.operator, rule.applicableType]
            .join(" ")
            .toLowerCase()
            .includes(query)), reusable = reusableRulesForProperty(c.rules, propertyType, c.pickerSearch,
                 attachedIds), create = document.createElement("section"), library = document.createElement("section");
    create.setAttribute("aria-label", "Create a rule");
    library.setAttribute("aria-label", "Attach from Rule Library");
    create.append(Object.assign(document.createElement("h5"), {
        textContent: "Create a rule",
    }));
    library.append(Object.assign(document.createElement("h5"), {
        textContent: "Attach from Rule Library",
    }));
    for (const rule of builtIns) {
        const article = document.createElement("article"), button = document.createElement("button"),
             metadata = document.createElement("p");
        button.type = "button";
        button.textContent = rule.name;
        metadata.textContent = reusableRuleMetadata(rule, propertyType);
        const action = (): void => {
            c.setConfiguration(createRuleConfiguration(rule.name as NonNullable<typeof c.configuration>["ruleType"],
                 propertyType));
            rerender();
        };
        button.addEventListener("click", action);
        c.ownPicker(() => button.removeEventListener("click", action));
        article.append(button, metadata);
        create.append(article);
    }
    for (const rule of reusable) {
        const article = document.createElement("article"), button = document.createElement("button"),
             metadata = document.createElement("p");
        button.type = "button";
        button.textContent = `${rule.name} version ${rule.version ?? 1}${rule.alreadyAttached ? " · already attached" : ""}`;
        button.disabled = rule.alreadyAttached;
        metadata.textContent = reusableRuleMetadata(rule, propertyType);
        const action = (): void => {
            c.attach(p.active().id, rule.id, path);
            p.closeForCommit();
        };
        button.addEventListener("click", action);
        c.ownPicker(() => button.removeEventListener("click", action));
        article.append(button, metadata);
        library.append(article);
    }
    if (!builtIns.length && !reusable.length) {
        const empty = document.createElement("p"), clear = document.createElement("button");
        empty.id = "schema-property-rule-empty";
        empty.textContent = "No compatible rules match this search";
        clear.type = "button";
        clear.textContent = "Clear search";
        const clearSearch = (): void => {
            c.setPickerSearch("");
            rerender();
        };
        clear.addEventListener("click", clearSearch);
        c.ownPicker(() => clear.removeEventListener("click", clearSearch));
        results.append(empty, clear);
    }
    else
        results.append(create, library);
    const close = (): void => p.close(), searchRules = (): void => {
        c.setPickerSearch(search.value);
        rerender();
    };
    cancel.addEventListener("click", close);
    search.addEventListener("input", searchRules);
    c.ownPicker(() => cancel.removeEventListener("click", close), () => search.removeEventListener("input",
         searchRules));
    picker.replaceChildren(heading, search, results, cancel);
    return true;
}
