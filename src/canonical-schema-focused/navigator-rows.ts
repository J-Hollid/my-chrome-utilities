import {canonicalPropertyPath,canonicalTableRows} from "../data-layer-canonical-schema.js";
import type {CanonicalSchemaRenderContext} from "../data-layer-canonical-schema-render.js";
import {schemaTableColumns,schemaTableExpectedOrAllowed,type SchemaTableEditableFacet} from "../data-layer-schema-table.js";
import {button} from "./dom.js";

export function canonicalNavigatorRows(context:Pick<CanonicalSchemaRenderContext,"document"|"query"|"propertyFilter"|"propertySort">):ReturnType<typeof canonicalTableRows>{
  const query=context.query.trim().toLowerCase(),matches=(node:ReturnType<typeof canonicalTableRows>[number]["node"])=>!query||node.name.toLowerCase().includes(query)||canonicalPropertyPath(context.document,node.id).toLowerCase().includes(query),facet=(node:ReturnType<typeof canonicalTableRows>[number]["node"])=>context.propertyFilter==="all"||context.propertyFilter==="conditions"&&Boolean(node.presence.condition)||context.propertyFilter==="documentation"&&Boolean(node.documentation.displayText||node.documentation.description||node.documentation.comments)||context.propertyFilter==="issues"&&node.provenance.some(({state})=>state==="shadowed");
  const rows=canonicalTableRows(context.document).filter(({node})=>matches(node)&&facet(node));if(context.propertySort==="name")rows.sort((left,right)=>left.node.name.localeCompare(right.node.name)||left.path.localeCompare(right.path));else if(context.propertySort==="type")rows.sort((left,right)=>left.node.type.localeCompare(right.node.type)||left.path.localeCompare(right.path));return rows;
}

export function renderNavigatorRows(tree:HTMLElement,context:CanonicalSchemaRenderContext):void {
  const {dom,document}=context;
  for(const row of canonicalNavigatorRows(context)){const article=dom.createElement("article"),choose=button(dom,`${"› ".repeat(row.depth)}${row.node.name} · ${row.path} · ${row.node.type}`,()=>context.openProperty(row.node,choose));choose.dataset.propertyId=row.id;choose.setAttribute("aria-current",String((context.activePropertyId??document.selectedPropertyId)===row.id));article.dataset.propertyRow="true";article.dataset.propertyId=row.id;const actions=button(dom,"Property actions",()=>{context.setMenuPropertyId(row.id);context.openProperty(row.node,actions);});actions.setAttribute("aria-label",`Property actions for ${row.path}`);actions.dataset.propertyActionsPath=row.path;article.append(choose,actions);if(context.menuPropertyId===row.id)article.append(context.renderMenu(row.node));tree.append(article);}
}

const editableCell=(context:CanonicalSchemaRenderContext,node:ReturnType<typeof canonicalNavigatorRows>[number]["node"],facet:SchemaTableEditableFacet,value:string):HTMLInputElement=>{const control=context.dom.createElement("input");control.type="text";control.value=value;control.dataset.inlineSchemaFacet=facet;control.setAttribute("aria-label",`${facet} for ${canonicalPropertyPath(context.document,node.id)}`);control.addEventListener("input",()=>context.stageInline(node,facet,control.value));return control;};
const sourceText=(node:ReturnType<typeof canonicalNavigatorRows>[number]["node"]):string=>node.provenance.map(({contributorName,source,state})=>contributorName??state??source).join(", ")||"Created here";

function renderTable(tree:HTMLElement,context:CanonicalSchemaRenderContext):void {
  const {dom}=context,table=dom.createElement("table"),head=dom.createElement("thead"),headRow=dom.createElement("tr"),body=dom.createElement("tbody");
  for(const {label} of schemaTableColumns)headRow.append(Object.assign(dom.createElement("th"),{textContent:label}));
  head.append(headRow);
  for(const row of canonicalNavigatorRows(context)){const node=context.working?.id===row.id?context.working:row.node,tr=dom.createElement("tr"),identity=dom.createElement("td"),name=dom.createElement("span"),trigger=button(dom,"⋯",()=>context.openProperty(row.node,trigger)),example=node.documentation.example.value,states=node.provenance.map(({state})=>state).filter(Boolean);tr.dataset.propertyRow="true";tr.dataset.propertyId=row.id;identity.style.position="relative";name.textContent=`${node.name} · `;trigger.setAttribute("aria-label",`Property actions for ${row.path}`);trigger.dataset.propertyActionsPath=row.path;identity.append(name,trigger);tr.append(identity,Object.assign(dom.createElement("td"),{textContent:row.path}),Object.assign(dom.createElement("td"),{textContent:node.type}),Object.assign(dom.createElement("td"),{textContent:node.presence.mode}));
    for(const control of [editableCell(context,row.node,"description",node.documentation.description),editableCell(context,row.node,"expected-or-allowed",schemaTableExpectedOrAllowed({expectedValue:node.expectedValue,allowedValues:node.allowedValues.map(({value})=>value)})),editableCell(context,row.node,"example",example===undefined?"":String(example))]){const cell=dom.createElement("td");cell.append(control);tr.append(cell);}
    tr.append(Object.assign(dom.createElement("td"),{textContent:sourceText(node)}),Object.assign(dom.createElement("td"),{textContent:states.join(", ")||"local"}),Object.assign(dom.createElement("td"),{textContent:states.includes("conflict")||states.includes("shadowed")?"Needs attention":"Ready"}));
    if(context.menuPropertyId===row.id){const overlay=dom.createElement("section");overlay.dataset.schemaRowOverlay="true";overlay.setAttribute("aria-label",`${row.path} property overlay`);overlay.style.cssText="position:absolute;left:0;top:100%;z-index:10;min-width:42rem;max-width:80vw;background:Canvas;border:1px solid ButtonBorder;padding:0.75rem;";overlay.append(context.renderMenu(row.node),context.renderFocusedEditor(context.document,row.node));if(context.review)overlay.append(context.review);identity.append(overlay);}
    body.append(tr);
  }
  table.append(head,body);table.setAttribute("aria-label","Canonical property table");table.dataset.canonicalView="table";tree.replaceChildren(table);tree.dataset.canonicalView="table";
}

export function applyNavigatorView(tree:HTMLElement,dom:Document,view:CanonicalSchemaRenderContext["document"]["view"],context?:CanonicalSchemaRenderContext):void {
  if(view==="table"&&context){renderTable(tree,context);return;}
  tree.setAttribute("role","tree");tree.dataset.canonicalView="tree";
}
