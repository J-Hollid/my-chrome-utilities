import { deriveSpecificationRows, renderSpecificationClipboard } from "./data-layer-schema-specification-builder.js";
import type { SchemaDefinition } from "./data-layer-schema-verification.js";

export function renderSchemaSpecificationBuilder(root: HTMLElement, schema: SchemaDefinition, close: () => void, writeClipboard: (data: ClipboardItems) => Promise<void>): void {
  root.replaceChildren();
  const heading = document.createElement("h4"); heading.textContent = `Build specification · ${schema.name}`;
  const source = document.createElement("output"); source.textContent = schema.workingDraft ? `Source: working draft based on revision ${schema.version}` : `Source: published revision ${schema.version}`;
  const rows = deriveSpecificationRows(schema, Object.keys(schema.documentation?.properties ?? {}).length ? Object.keys(schema.documentation?.properties ?? {}) : []);
  const summary = document.createElement("p"); summary.textContent = `${rows.length} selected properties`;
  const table = document.createElement("table"); table.id = "schema-specification-preview";
  const labels = ["Property name", "Description", "Mandatory", "Type", "Example value", "Allowed values"];
  table.append(document.createElement("thead"), document.createElement("tbody"));
  const head = table.querySelector("thead")!; const tr = document.createElement("tr"); labels.forEach((label) => { const th = document.createElement("th"); th.textContent = label; tr.append(th); }); head.append(tr);
  const body = table.querySelector("tbody")!; rows.forEach((row) => { const tr = document.createElement("tr"); [row.propertyName,row.description,row.mandatory,row.type,row.example ?? "",row.allowedValues.join(" | ")].forEach((value) => { const td=document.createElement("td"); td.textContent=value; tr.append(td); }); body.append(tr); });
  const copy = document.createElement("button"); copy.type="button"; copy.textContent="Copy specification table"; copy.addEventListener("click", async () => { const clipboard=renderSpecificationClipboard(rows); try { await writeClipboard([new ClipboardItem({"text/html":new Blob([clipboard.html],{type:"text/html"}),"text/plain":new Blob([clipboard.plain],{type:"text/plain"})})]); } catch { await navigator.clipboard?.writeText(clipboard.plain); } });
  const closeButton=document.createElement("button"); closeButton.type="button"; closeButton.textContent="Close specification"; closeButton.addEventListener("click", close);
  root.append(heading, source, summary, table, copy, closeButton);
}
