import {
  deriveSpecificationRows,
  renderSpecificationClipboard,
  specificationProperties,
  specificationSurfaces,
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

  const summary = document.createElement("p");
  summary.id = "schema-specification-completeness";
  const table = document.createElement("table");
  table.id = "schema-specification-preview";
  const labels = ["Property name", "Description", "Mandatory", "Type", "Example value", "Allowed values", "Comments"];
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  headRow.append(...labels.map((text) => { const th=document.createElement("th");th.append(Object.assign(document.createElement("span"),{textContent:text}));return th; }));
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
  root.replaceChildren(heading, sourceLabel, controls, summary, table, copy, feedback, closeButton);

  const selectedRows = () => {
    const paths = properties.filter(({ canonicalPath }) => selected.has(canonicalPath)).map(({ canonicalPath }) => canonicalPath);
    if (sort === "name") paths.sort((left, right) => left.localeCompare(right));
    return deriveSpecificationRows(surface.schema, paths, allSchemas);
  };

  const renderPreview = (): void => {
    const rows = selectedRows();
    const missingDescriptions = rows.filter(({ description }) => !description).length;
    const missingExamples = rows.filter(({ example }) => example === undefined).length;
    summary.textContent = `${rows.length} selected properties · ${missingDescriptions} missing descriptions · ${missingExamples} missing examples`;
    body.replaceChildren(...rows.map((row) => {
      const tableRow = document.createElement("tr");
      tableRow.dataset.propertyPath = row.canonicalPath;
      const values = [row.propertyName, row.description, row.mandatory, row.type, row.example ?? ""];
      tableRow.append(...values.map((value) => Object.assign(document.createElement("td"), { textContent:value })));
      const allowed = document.createElement("td");
      appendAllowedValueGroups(allowed, row.allowedValueGroups);
      tableRow.append(allowed);
      tableRow.append(Object.assign(document.createElement("td"),{textContent:row.comments}));
      return tableRow;
    }));
    copy.disabled = rows.length === 0;
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
  copy.addEventListener("click", async () => {
    const clipboard = renderSpecificationClipboard(selectedRows());
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
