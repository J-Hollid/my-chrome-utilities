import { deriveSpecificationRows, defaultSpecificationColumns, renderSpecificationClipboard, specificationColumnLabels, specificationProperties, specificationSurfaces, } from "./data-layer-schema-specification-builder.js";
function isDescendant(parent, child) {
    return child.startsWith(`${parent}/`) || child.startsWith(`${parent}/*/`);
}
function parentProperty(property, properties) {
    return properties
        .filter((candidate) => candidate.canonicalPath !== property.canonicalPath
        && isDescendant(candidate.canonicalPath, property.canonicalPath))
        .sort((left, right) => right.canonicalPath.length - left.canonicalPath.length)[0];
}
function appendAllowedValueGroups(cell, groups) {
    groups.forEach((group, index) => {
        if (index)
            cell.append(document.createElement("br"));
        cell.append(document.createTextNode(group));
    });
}
export function renderSchemaSpecificationBuilder(root, current, allSchemas, initialSurfaceKey, close, clipboardPort) {
    const surfaces = specificationSurfaces(current);
    let surface = surfaces.find(({ key }) => key === initialSurfaceKey) ?? surfaces[0];
    let properties = specificationProperties(surface.schema, allSchemas);
    let selected = new Set(properties.filter(({ selectedByDefault }) => selectedByDefault).map(({ canonicalPath }) => canonicalPath));
    let sort = "schema";
    let columns = [...defaultSpecificationColumns];
    const heading = document.createElement("h4");
    heading.id = "schema-specification-builder-heading";
    heading.tabIndex = -1;
    heading.textContent = `Build specification · ${current.name}`;
    root.setAttribute("aria-labelledby", heading.id);
    const sourceLabel = document.createElement("label");
    sourceLabel.textContent = "Source ";
    const sourceSelect = document.createElement("select");
    sourceSelect.id = "schema-specification-source";
    sourceLabel.append(sourceSelect);
    const controls = document.createElement("section");
    controls.id = "schema-specification-selector";
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Search properties";
    search.setAttribute("aria-label", "Search properties");
    const selectAll = document.createElement("button");
    selectAll.type = "button";
    selectAll.textContent = "Select all";
    const clear = document.createElement("button");
    clear.type = "button";
    clear.textContent = "Clear selection";
    const sortSelect = document.createElement("select");
    sortSelect.setAttribute("aria-label", "Preview order");
    sortSelect.append(Object.assign(document.createElement("option"), { value: "schema", textContent: "Schema order" }), Object.assign(document.createElement("option"), { value: "name", textContent: "Property name" }));
    const list = document.createElement("ul");
    list.id = "schema-specification-property-list";
    controls.append(search, selectAll, clear, sortSelect, list);
    const summary = document.createElement("p");
    summary.id = "schema-specification-completeness";
    const table = document.createElement("table");
    table.id = "schema-specification-preview";
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    head.append(headRow);
    const body = document.createElement("tbody");
    table.append(head, body);
    const feedback = document.createElement("output");
    feedback.id = "schema-specification-copy-feedback";
    feedback.setAttribute("aria-live", "polite");
    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "Copy specification table";
    const includeHeadingsLabel = document.createElement("label");
    const includeHeadings = document.createElement("input");
    includeHeadings.type = "checkbox";
    includeHeadings.checked = true;
    includeHeadingsLabel.append(includeHeadings, " Include headings");
    const resetColumns = document.createElement("button");
    resetColumns.type = "button";
    resetColumns.textContent = "Reset column order";
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "Close specification";
    closeButton.addEventListener("click", close);
    root.replaceChildren(heading, sourceLabel, controls, summary, includeHeadingsLabel, resetColumns, table, copy, feedback, closeButton);
    const selectedRows = () => {
        const paths = properties.filter(({ canonicalPath }) => selected.has(canonicalPath)).map(({ canonicalPath }) => canonicalPath);
        if (sort === "name")
            paths.sort((left, right) => left.localeCompare(right));
        return deriveSpecificationRows(surface.schema, paths, allSchemas);
    };
    const renderPreview = () => {
        const rows = selectedRows();
        const missingDescriptions = rows.filter(({ description }) => !description).length;
        const missingExamples = rows.filter(({ example }) => example === undefined).length;
        summary.textContent = `${rows.length} selected properties · ${missingDescriptions} missing descriptions · ${missingExamples} missing examples`;
        const value = (row, column) => column === "propertyName" ? row.propertyName
            : column === "description" ? row.description
                : column === "mandatory" ? row.mandatory
                    : column === "type" ? row.type
                        : column === "example" ? row.example ?? ""
                            : column === "allowedValues" ? row.allowedValueGroups.join("\n")
                                : row.comments;
        headRow.replaceChildren(...columns.map((column, index) => {
            const cell = document.createElement("th");
            cell.dataset.specificationColumn = column;
            cell.append(Object.assign(document.createElement("span"), { textContent: specificationColumnLabels[column] }));
            const earlier = document.createElement("button");
            earlier.type = "button";
            earlier.textContent = "Move earlier";
            earlier.setAttribute("aria-label", `Move ${specificationColumnLabels[column]} earlier`);
            earlier.disabled = index === 0;
            const later = document.createElement("button");
            later.type = "button";
            later.textContent = "Move later";
            later.setAttribute("aria-label", `Move ${specificationColumnLabels[column]} later`);
            later.disabled = index === columns.length - 1;
            earlier.addEventListener("click", () => { [columns[index - 1], columns[index]] = [columns[index], columns[index - 1]]; renderPreview(); });
            later.addEventListener("click", () => { [columns[index], columns[index + 1]] = [columns[index + 1], columns[index]]; renderPreview(); });
            cell.append(earlier, later);
            return cell;
        }));
        body.replaceChildren(...rows.map((row) => {
            const tableRow = document.createElement("tr");
            tableRow.dataset.propertyPath = row.canonicalPath;
            tableRow.append(...columns.map((column) => {
                const cell = document.createElement("td");
                if (column === "allowedValues")
                    appendAllowedValueGroups(cell, row.allowedValueGroups);
                else
                    cell.textContent = value(row, column);
                return cell;
            }));
            return tableRow;
        }));
        copy.disabled = rows.length === 0;
    };
    const matchingProperties = () => {
        const query = search.value.trim().toLowerCase();
        if (!query)
            return new Set(properties.map(({ canonicalPath }) => canonicalPath));
        const matches = properties.filter(({ propertyName, origin }) => `${propertyName} ${origin}`.toLowerCase().includes(query));
        const visible = new Set(matches.map(({ canonicalPath }) => canonicalPath));
        for (const match of matches) {
            let parent = parentProperty(match, properties);
            while (parent) {
                visible.add(parent.canonicalPath);
                parent = parentProperty(parent, properties);
            }
        }
        return visible;
    };
    const renderPropertyList = () => {
        const visible = matchingProperties();
        const items = new Map();
        for (const property of properties.filter(({ canonicalPath }) => visible.has(canonicalPath))) {
            const item = document.createElement("li");
            item.dataset.propertyPath = property.canonicalPath;
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = selected.has(property.canonicalPath);
            checkbox.dataset.path = property.canonicalPath;
            checkbox.addEventListener("change", () => {
                if (checkbox.checked)
                    selected.add(property.canonicalPath);
                else
                    selected.delete(property.canonicalPath);
                renderPreview();
            });
            label.append(checkbox, ` ${property.propertyName} · ${property.origin}${property.container ? " · container" : ""}`);
            item.append(label);
            items.set(property.canonicalPath, item);
        }
        const roots = [];
        for (const property of properties.filter(({ canonicalPath }) => items.has(canonicalPath))) {
            const item = items.get(property.canonicalPath);
            const parent = parentProperty(property, properties);
            const parentItem = parent ? items.get(parent.canonicalPath) : undefined;
            if (!parentItem) {
                roots.push(item);
                continue;
            }
            let children = parentItem.querySelector(":scope > ul");
            if (!children) {
                children = document.createElement("ul");
                parentItem.append(children);
            }
            children.append(item);
        }
        list.replaceChildren(...roots);
    };
    const renderSource = () => {
        sourceSelect.replaceChildren(...surfaces.map(({ key, label }) => Object.assign(document.createElement("option"), {
            value: key,
            textContent: label,
            selected: key === surface.key,
        })));
    };
    sourceSelect.addEventListener("change", () => {
        surface = surfaces.find(({ key }) => key === sourceSelect.value);
        properties = specificationProperties(surface.schema, allSchemas);
        selected = new Set(properties.filter(({ selectedByDefault }) => selectedByDefault).map(({ canonicalPath }) => canonicalPath));
        search.value = "";
        renderPropertyList();
        renderPreview();
    });
    search.addEventListener("input", renderPropertyList);
    selectAll.addEventListener("click", () => {
        const query = search.value.trim().toLowerCase();
        for (const property of properties) {
            if (!query || `${property.propertyName} ${property.origin}`.toLowerCase().includes(query))
                selected.add(property.canonicalPath);
        }
        renderPropertyList();
        renderPreview();
    });
    clear.addEventListener("click", () => {
        selected.clear();
        renderPropertyList();
        renderPreview();
    });
    sortSelect.addEventListener("change", () => {
        sort = sortSelect.value === "name" ? "name" : "schema";
        renderPreview();
    });
    includeHeadings.addEventListener("change", () => { feedback.textContent = includeHeadings.checked ? "Headings will be included." : "Headings will be omitted."; });
    resetColumns.addEventListener("click", () => { columns = [...defaultSpecificationColumns]; renderPreview(); });
    copy.addEventListener("click", async () => {
        const clipboard = renderSpecificationClipboard(selectedRows(), { columns, includeHeadings: includeHeadings.checked });
        try {
            await clipboardPort.writeRich(clipboard.html, clipboard.plain);
            feedback.textContent = "Copied rich table and plain text.";
        }
        catch {
            try {
                await clipboardPort.writePlain(clipboard.plain);
                feedback.textContent = "Rich copy unavailable; copied plain text.";
            }
            catch {
                feedback.textContent = "Copy failed. Select and copy the preview manually.";
            }
        }
    });
    renderSource();
    renderPropertyList();
    renderPreview();
    heading.focus({ preventScroll: true });
}
//# sourceMappingURL=data-layer-schema-specification-builder-ui.js.map