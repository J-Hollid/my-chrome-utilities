import {
  deriveSpecificationRows,
  defaultSpecificationColumns,
  retainedSpecificationPreviewScroll,
  renderSpecificationClipboard,
  specificationExampleChoices,
  specificationColumnLabels,
  specificationProperties,
  specificationSurfaces,
  type SpecificationExampleSelection,
  type SpecificationRow,
  type SpecificationTableStyle,
  typeSpecificationExampleSelection,
  type SpecificationColumn,
  type SpecificationProperty,
  type SpecificationSurface,
} from "./data-layer-schema-specification-builder.js";
import type { SchemaDefinition } from "./data-layer-schema-verification.js";

export interface SpecificationClipboardPort {
  writeRich(html: string, plain: string): Promise<void>;
  writePlain(plain: string): Promise<void>;
}

function isDescendant(parent: string, child: string): boolean {
  return child.startsWith(`${parent}/`) || child.startsWith(`${parent}/*/`);
}

function parentProperty(
  property: SpecificationProperty,
  properties: readonly SpecificationProperty[],
): SpecificationProperty | undefined {
  return properties
    .filter((candidate) => candidate.canonicalPath !== property.canonicalPath
      && isDescendant(candidate.canonicalPath, property.canonicalPath))
    .sort((left, right) => right.canonicalPath.length - left.canonicalPath.length)[0];
}

function appendAllowedValueGroups(cell: HTMLTableCellElement, groups: readonly string[]): void {
  groups.forEach((group, index) => {
    if (index) cell.append(document.createElement("br"));
    cell.append(document.createTextNode(group));
  });
}

export function renderSchemaSpecificationBuilder(
  root: HTMLElement,
  current: SchemaDefinition,
  allSchemas: readonly SchemaDefinition[],
  initialSurfaceKey: SpecificationSurface["key"],
  close: () => void,
  clipboardPort: SpecificationClipboardPort,
): void {
  const surfaces = specificationSurfaces(current);
  let surface = surfaces.find(({ key }) => key === initialSurfaceKey) ?? surfaces[0]!;
  let properties = specificationProperties(surface.schema, allSchemas);
  let selected = new Set(properties.filter(({ selectedByDefault }) => selectedByDefault).map(({ canonicalPath }) => canonicalPath));
  let sort: "schema" | "name" = "schema";
  let columns = [...defaultSpecificationColumns];
  let copyMode: "spreadsheet" | "rich" = "spreadsheet";
  let includeHeadings = true;
  let tableStyle: SpecificationTableStyle = "plain";
  const exampleSelections = new Map<string, SpecificationExampleSelection>();

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
  sortSelect.append(
    Object.assign(document.createElement("option"), { value:"schema", textContent:"Schema order" }),
    Object.assign(document.createElement("option"), { value:"name", textContent:"Property name" }),
  );
  const list = document.createElement("ul");
  list.id = "schema-specification-property-list";
  controls.append(search, selectAll, clear, sortSelect, list);

  const exportBar = document.createElement("fieldset"); exportBar.id = "schema-specification-export-bar";
  const exportLegend = document.createElement("legend"); exportLegend.textContent = "Export";
  const spreadsheetLabel = document.createElement("label"); const spreadsheet = document.createElement("input"); spreadsheet.type = "radio"; spreadsheet.name = "schema-specification-copy-mode"; spreadsheet.value = "spreadsheet"; spreadsheet.checked = true; spreadsheetLabel.append(spreadsheet, " Spreadsheet");
  const richLabel = document.createElement("label"); const rich = document.createElement("input"); rich.type = "radio"; rich.name = spreadsheet.name; rich.value = "rich"; richLabel.append(rich, " Rich table for Confluence or Jira");
  const headingsLabel = document.createElement("label"); const headings = document.createElement("input"); headings.type = "checkbox"; headings.checked = true; headingsLabel.append(headings, " Include headings");
  const styleLabel = document.createElement("label"); styleLabel.textContent = "Table style "; const styleSelect = document.createElement("select"); styleSelect.setAttribute("aria-label", "Table style");
  ([ ["plain","Plain"], ["bordered","Bordered"], ["highlighted","Bordered with highlighted headings"] ] as const).forEach(([value,textContent]) => styleSelect.append(Object.assign(document.createElement("option"), { value,textContent })));
  styleLabel.append(styleSelect); styleLabel.hidden = true;
  const resetColumns = document.createElement("button"); resetColumns.type = "button"; resetColumns.textContent = "Reset column order";
  exportBar.append(exportLegend, spreadsheetLabel, richLabel, headingsLabel, styleLabel, resetColumns);

  const summary = document.createElement("p");
  summary.id = "schema-specification-completeness";
  const table = document.createElement("table");
  table.id = "schema-specification-preview";
  const preview = document.createElement("section");
  preview.id = "schema-specification-preview-region";
  preview.tabIndex = 0;
  preview.setAttribute("role", "region");
  preview.setAttribute("aria-label", "Specification preview");
  preview.append(table);
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
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Close specification";
  closeButton.addEventListener("click", close);
  root.replaceChildren(heading, sourceLabel, controls, exportBar, summary, preview, copy, feedback, closeButton);

  const selectedRows = (): SpecificationRow[] => {
    const paths = properties.filter(({ canonicalPath }) => selected.has(canonicalPath)).map(({ canonicalPath }) => canonicalPath);
    if (sort === "name") paths.sort((left, right) => left.localeCompare(right));
    return deriveSpecificationRows(surface.schema, paths, allSchemas).map((row): SpecificationRow => {
      const selection = exampleSelections.get(row.canonicalPath);
      if (!selection || selection.source === "documentation") return row;
      if ((selection.source === "allowed" || selection.source === "custom") && selection.value !== undefined) return { ...row, example:selection.value };
      const { example:_example, ...blank } = row;
      return blank;
    });
  };

  const renderPreview = (): void => {
    const previousScroll = preview.scrollLeft;
    const rows = selectedRows();
    const missingDescriptions = rows.filter(({ description }) => !description).length;
    const missingExamples = rows.filter(({ example }) => example === undefined).length;
    summary.textContent = `${rows.length} selected properties · ${missingDescriptions} missing descriptions · ${missingExamples} missing examples`;
    const value = (row: ReturnType<typeof selectedRows>[number], column: SpecificationColumn): string => column === "propertyName" ? row.propertyName
      : column === "description" ? row.description
        : column === "mandatory" ? row.mandatory
          : column === "type" ? row.type
            : column === "example" ? row.example ?? ""
              : column === "allowedValues" ? row.allowedValueGroups.join("\n")
                : row.comments;
    headRow.replaceChildren(...columns.map((column, index) => {
      const cell = document.createElement("th");
      cell.dataset.specificationColumn = column;
      cell.draggable = true;
      cell.append(Object.assign(document.createElement("span"), { textContent:specificationColumnLabels[column] }));
      const earlier = document.createElement("button"); earlier.type = "button"; earlier.textContent = "Move left"; earlier.setAttribute("aria-label", `Move ${specificationColumnLabels[column]} left`); earlier.disabled = index === 0;
      const later = document.createElement("button"); later.type = "button"; later.textContent = "Move right"; later.setAttribute("aria-label", `Move ${specificationColumnLabels[column]} right`); later.disabled = index === columns.length - 1;
      earlier.addEventListener("click", () => { [columns[index - 1], columns[index]] = [columns[index]!, columns[index - 1]!]; renderPreview(); });
      later.addEventListener("click", () => { [columns[index], columns[index + 1]] = [columns[index + 1]!, columns[index]!]; renderPreview(); });
      cell.addEventListener("dragstart", (event) => event.dataTransfer?.setData("text/plain", column));
      cell.addEventListener("dragover", (event) => event.preventDefault());
      cell.addEventListener("drop", (event) => { event.preventDefault(); const moved = event.dataTransfer?.getData("text/plain") as SpecificationColumn; const from = columns.indexOf(moved); const to = columns.indexOf(column); if (from < 0 || to < 0) return; columns.splice(from, 1); columns.splice(to, 0, moved); renderPreview(); });
      cell.append(earlier, later);
      return cell;
    }));
    body.replaceChildren(...rows.map((row) => {
      const tableRow = document.createElement("tr");
      tableRow.dataset.propertyPath = row.canonicalPath;
      tableRow.append(...columns.map((column) => {
        const cell = document.createElement("td");
        cell.dataset.specificationColumn = column;
        if (column === "allowedValues") appendAllowedValueGroups(cell, row.allowedValueGroups);
        else if (column === "example") {
          cell.textContent = row.example ?? "";
          cell.tabIndex = 0;
          cell.setAttribute("role", "button");
          cell.dataset.specificationExamplePath = row.canonicalPath;
          cell.setAttribute("aria-label", `Edit example for ${row.propertyName}`);
          const openEditor = () => {
            if (cell.querySelector(".schema-specification-example-editor")) return;
            body.querySelectorAll(".schema-specification-example-editor").forEach((editor) => editor.remove());
            const baseRow = deriveSpecificationRows(surface.schema, [row.canonicalPath], allSchemas)[0] ?? row;
            const previous = exampleSelections.get(row.canonicalPath) ?? (baseRow.example !== undefined ? { source:"documentation" as const, value:baseRow.example } : { source:"blank" as const });
            const editor = document.createElement("fieldset"); editor.className = "schema-specification-example-editor";
            const legend = document.createElement("legend"); legend.textContent = `Example for ${row.propertyName}`; editor.append(legend);
            const name = `example-${row.canonicalPath}`;
            let customInput: HTMLInputElement | undefined;
            for (const choice of specificationExampleChoices(baseRow, previous)) {
              const label = document.createElement("label"); const radio = document.createElement("input"); radio.type = "radio"; radio.name = name; radio.value = choice.id; radio.checked = choice.selected; radio.disabled = !choice.available;
              label.append(radio, ` ${choice.label}`); if (choice.explanation) label.append(` — ${choice.explanation}`); editor.append(label);
              if (choice.id === "custom") {
                customInput = document.createElement("input"); customInput.placeholder = "Custom value"; customInput.value = previous.source === "custom" ? previous.value ?? "" : ""; customInput.hidden = !choice.selected;
                radio.addEventListener("change", () => { if (customInput) { customInput.hidden = false; customInput.focus({ preventScroll:true }); } }); label.append(" ", customInput); continue;
              }
              radio.addEventListener("change", () => { if (!radio.checked) return; exampleSelections.set(row.canonicalPath, typeSpecificationExampleSelection(baseRow, choice.id)); renderPreview(); });
            }
            const apply = document.createElement("button"); apply.type = "button"; apply.textContent = "Apply custom value"; apply.addEventListener("click", () => { exampleSelections.set(row.canonicalPath, typeSpecificationExampleSelection(baseRow, "custom", customInput?.value ?? "")); renderPreview(); });
            const cancel = document.createElement("button"); cancel.type = "button"; cancel.textContent = "Cancel"; const cancelEditor = () => { editor.remove(); cell.focus({ preventScroll:true }); }; cancel.addEventListener("click", cancelEditor); editor.addEventListener("keydown", (event) => { if (event.key === "Escape") { event.preventDefault(); cancelEditor(); } }); editor.append(apply, cancel); cell.append(editor);
            (editor.querySelector<HTMLInputElement>(`input[name="${CSS.escape(name)}"]:checked`) ?? editor.querySelector<HTMLInputElement>("input:not(:disabled)"))?.focus({ preventScroll:true });
          };
          cell.addEventListener("click", (event) => { if (event.target === cell) openEditor(); });
          cell.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openEditor(); } });
        }
        else cell.textContent = value(row, column);
        return cell;
      }));
      return tableRow;
    }));
    copy.disabled = rows.length === 0;
    preview.scrollLeft = retainedSpecificationPreviewScroll(previousScroll, preview.scrollWidth, preview.clientWidth);
  };

  const matchingProperties = (): Set<string> => {
    const query = search.value.trim().toLowerCase();
    if (!query) return new Set(properties.map(({ canonicalPath }) => canonicalPath));
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

  const renderPropertyList = (): void => {
    const visible = matchingProperties();
    const items = new Map<string, HTMLLIElement>();
    for (const property of properties.filter(({ canonicalPath }) => visible.has(canonicalPath))) {
      const item = document.createElement("li");
      item.dataset.propertyPath = property.canonicalPath;
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = selected.has(property.canonicalPath);
      checkbox.dataset.path = property.canonicalPath;
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) selected.add(property.canonicalPath);
        else selected.delete(property.canonicalPath);
        renderPreview();
      });
      label.append(checkbox, ` ${property.propertyName} · ${property.origin}${property.container ? " · container" : ""}`);
      item.append(label);
      items.set(property.canonicalPath, item);
    }
    const roots: HTMLLIElement[] = [];
    for (const property of properties.filter(({ canonicalPath }) => items.has(canonicalPath))) {
      const item = items.get(property.canonicalPath)!;
      const parent = parentProperty(property, properties);
      const parentItem = parent ? items.get(parent.canonicalPath) : undefined;
      if (!parentItem) {
        roots.push(item);
        continue;
      }
      let children = parentItem.querySelector<HTMLUListElement>(":scope > ul");
      if (!children) {
        children = document.createElement("ul");
        parentItem.append(children);
      }
      children.append(item);
    }
    list.replaceChildren(...roots);
  };

  const renderSource = (): void => {
    sourceSelect.replaceChildren(...surfaces.map(({ key, label }) => Object.assign(document.createElement("option"), {
      value:key,
      textContent:label,
      selected:key === surface.key,
    })));
  };

  sourceSelect.addEventListener("change", () => {
    surface = surfaces.find(({ key }) => key === sourceSelect.value)!;
    properties = specificationProperties(surface.schema, allSchemas);
    selected = new Set(properties.filter(({ selectedByDefault }) => selectedByDefault).map(({ canonicalPath }) => canonicalPath));
    search.value = "";
    exampleSelections.clear();
    renderPropertyList();
    renderPreview();
  });
  search.addEventListener("input", renderPropertyList);
  selectAll.addEventListener("click", () => {
    const query = search.value.trim().toLowerCase();
    for (const property of properties) {
      if (!query || `${property.propertyName} ${property.origin}`.toLowerCase().includes(query)) selected.add(property.canonicalPath);
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
  spreadsheet.addEventListener("change", () => { if (!spreadsheet.checked) return; copyMode = "spreadsheet"; styleLabel.hidden = true; });
  rich.addEventListener("change", () => { if (!rich.checked) return; copyMode = "rich"; styleLabel.hidden = false; });
  headings.addEventListener("change", () => { includeHeadings = headings.checked; });
  styleSelect.addEventListener("change", () => { tableStyle = styleSelect.value as SpecificationTableStyle; });
  resetColumns.addEventListener("click", () => { columns = [...defaultSpecificationColumns]; renderPreview(); });
  copy.addEventListener("click", async () => {
    const clipboard = renderSpecificationClipboard(selectedRows(), { columns, includeHeadings, style:tableStyle });
    if (copyMode === "spreadsheet") {
      try {
        await clipboardPort.writePlain(clipboard.plain);
        feedback.textContent = "Copied spreadsheet table as plain text.";
      } catch {
        feedback.textContent = "Copy failed. Select and copy the preview manually.";
      }
      return;
    }
    try {
      await clipboardPort.writeRich(clipboard.html, clipboard.plain);
      feedback.textContent = "Copied rich table and plain text.";
    } catch {
      try {
        await clipboardPort.writePlain(clipboard.plain);
        feedback.textContent = "Rich copy unavailable; copied plain text.";
      } catch {
        feedback.textContent = "Copy failed. Select and copy the preview manually.";
      }
    }
  });

  renderSource();
  renderPropertyList();
  renderPreview();
  heading.focus({ preventScroll:true });
}
