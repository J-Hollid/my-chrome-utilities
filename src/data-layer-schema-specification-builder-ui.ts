import { deriveSpecificationRows, renderSpecificationClipboard, specificationProperties } from "./data-layer-schema-specification-builder.js";
import type { SchemaDefinition } from "./data-layer-schema-verification.js";

type ClipboardWriter = (data: ClipboardItems) => Promise<void>;

function draftSurface(schema: SchemaDefinition): SchemaDefinition | undefined {
  const draft = schema.workingDraft;
  if (!draft) return undefined;
  const { attachedRules:_rules, parentSchemaId:_parent, inheritedRuleOverrides:_overrides, documentation:_documentation, ...base } = schema;
  return { ...base, name:draft.name ?? schema.name, document:draft.document, assignments:draft.assignments, ...(draft.attachedRules ? { attachedRules:draft.attachedRules } : {}), ...(draft.parentSchemaId ? { parentSchemaId:draft.parentSchemaId } : {}), ...(draft.inheritedRuleOverrides ? { inheritedRuleOverrides:draft.inheritedRuleOverrides } : {}), ...(draft.documentation ? { documentation:draft.documentation } : {}), workingDraft:draft };
}

function publishedSurface(schema: SchemaDefinition): SchemaDefinition { const { workingDraft:_draft, ...published }=schema; return published; }

export function renderSchemaSpecificationBuilder(root: HTMLElement, initial: SchemaDefinition, allSchemas: readonly SchemaDefinition[], close: () => void, writeClipboard: ClipboardWriter): void {
  let schema = initial;
  let properties = specificationProperties(schema, allSchemas);
  let selected = new Set(properties.filter(({ selectedByDefault }) => selectedByDefault).map(({ canonicalPath }) => canonicalPath));
  let query = "";
  let sort: "schema" | "name" = "schema";

  const render = (): void => {
    root.replaceChildren();
    const heading = document.createElement("h4"); heading.textContent = `Build specification · ${schema.name}`;
    const sourceLabel = schema.workingDraft ? `working draft based on revision ${schema.workingDraft.sourceVersion}` : `published revision ${schema.version}`;
    const source = document.createElement("label"); source.textContent = "Source ";
    const sourceSelect = document.createElement("select"); sourceSelect.id = "schema-specification-source";
    const current = allSchemas.find(({ id }) => id === initial.id) ?? initial;
    const surfaces: { label: string; value: SchemaDefinition }[] = [
      { label:`published revision ${current.version}`, value:publishedSurface(current) },
      ...(current.revisionHistory ?? []).map((revision) => ({ label:`historical revision ${revision.version}`, value:revision })),
      ...(draftSurface(current) ? [{ label:`working draft based on revision ${current.workingDraft!.sourceVersion}`, value:draftSurface(current)! }] : []),
    ];
    surfaces.forEach((surface, index) => { const option=document.createElement("option"); option.value=String(index); option.textContent=surface.label; option.selected=surface.label===sourceLabel; sourceSelect.append(option); });
    sourceSelect.addEventListener("change", () => { schema=surfaces[Number(sourceSelect.value)]!.value; properties=specificationProperties(schema, allSchemas); selected=new Set(properties.filter(({selectedByDefault})=>selectedByDefault).map(({canonicalPath})=>canonicalPath)); render(); });
    source.append(sourceSelect);

    const controls=document.createElement("section"); controls.id="schema-specification-selector";
    const search=document.createElement("input"); search.type="search"; search.placeholder="Search properties"; search.value=query; search.setAttribute("aria-label","Search properties"); search.addEventListener("input",()=>{query=search.value; render();});
    const selectAll=document.createElement("button"); selectAll.type="button"; selectAll.textContent="Select all"; selectAll.addEventListener("click",()=>{properties.filter(matches).forEach(({canonicalPath})=>selected.add(canonicalPath)); render();});
    const clear=document.createElement("button"); clear.type="button"; clear.textContent="Clear selection"; clear.addEventListener("click",()=>{selected.clear(); render();});
    const sortSelect=document.createElement("select"); sortSelect.setAttribute("aria-label","Preview order"); const sortOptions: readonly [string,string][]=[["schema","Schema order"],["name","Property name"]]; sortOptions.forEach(([value,label])=>{const option=document.createElement("option");option.value=value;option.textContent=label;option.selected=sort===value;sortSelect.append(option);}); sortSelect.addEventListener("change",()=>{sort=sortSelect.value as "schema"|"name";render();});
    const list=document.createElement("ul"); list.id="schema-specification-property-list";
    properties.filter(matches).forEach((property)=>{const item=document.createElement("li"); const label=document.createElement("label"); const checkbox=document.createElement("input"); checkbox.type="checkbox";checkbox.checked=selected.has(property.canonicalPath);checkbox.dataset.path=property.canonicalPath;checkbox.addEventListener("change",()=>{checkbox.checked?selected.add(property.canonicalPath):selected.delete(property.canonicalPath);render();}); label.append(checkbox,` ${property.propertyName} · ${property.origin}${property.container?" · container":""}`);item.append(label);list.append(item);});
    controls.append(search,selectAll,clear,sortSelect,list);

    const selectedPaths=properties.filter(({canonicalPath})=>selected.has(canonicalPath)).map(({canonicalPath})=>canonicalPath);
    if(sort==="name") selectedPaths.sort((a,b)=>a.localeCompare(b));
    const rows=deriveSpecificationRows(schema,selectedPaths,allSchemas);
    const missingDescriptions=rows.filter(({description})=>!description).length; const missingExamples=rows.filter(({example})=>example===undefined).length;
    const summary=document.createElement("p"); summary.id="schema-specification-completeness"; summary.textContent=`${rows.length} selected properties · ${missingDescriptions} missing descriptions · ${missingExamples} missing examples`;
    const table=document.createElement("table");table.id="schema-specification-preview";const labels=["Property name","Description","Mandatory","Type","Example value","Allowed values"];
    const thead=document.createElement("thead"),tbody=document.createElement("tbody"),headRow=document.createElement("tr");labels.forEach((text)=>{const th=document.createElement("th");th.textContent=text;headRow.append(th);});thead.append(headRow);
    rows.forEach((row)=>{const tr=document.createElement("tr");[row.propertyName,row.description,row.mandatory,row.type,row.example??"",row.allowedValuesText??row.allowedValues.join(" | ")].forEach((value)=>{const td=document.createElement("td");td.textContent=value;tr.append(td);});tbody.append(tr);});table.append(thead,tbody);
    const feedback=document.createElement("output");feedback.id="schema-specification-copy-feedback";
    const copy=document.createElement("button");copy.type="button";copy.textContent="Copy specification table";copy.disabled=!rows.length;copy.addEventListener("click",async()=>{const clipboard=renderSpecificationClipboard(rows);try{await writeClipboard([new ClipboardItem({"text/html":new Blob([clipboard.html],{type:"text/html"}),"text/plain":new Blob([clipboard.plain],{type:"text/plain"})})]);feedback.textContent="Copied rich table and plain text.";}catch{try{await navigator.clipboard.writeText(clipboard.plain);feedback.textContent="Rich copy unavailable; copied plain text.";}catch{feedback.textContent="Copy failed. Select and copy the preview manually.";}}});
    const closeButton=document.createElement("button");closeButton.type="button";closeButton.textContent="Close specification";closeButton.addEventListener("click",close);
    root.append(heading,source,controls,summary,table,copy,feedback,closeButton);
  };
  const matches=(property:{propertyName:string}):boolean=>property.propertyName.toLowerCase().includes(query.trim().toLowerCase());
  render();
}
