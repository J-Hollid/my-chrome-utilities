import {canonicalPropertyPath,canonicalTableRows} from "../data-layer-canonical-schema.js";
import type {CanonicalSchemaRenderContext} from "../data-layer-canonical-schema-render.js";
import {button} from "./dom.js";

export function canonicalNavigatorRows(context:Pick<CanonicalSchemaRenderContext,"document"|"query"|"propertyFilter"|"propertySort">):ReturnType<typeof canonicalTableRows>{
  const query=context.query.trim().toLowerCase(),matches=(node:ReturnType<typeof canonicalTableRows>[number]["node"])=>!query||node.name.toLowerCase().includes(query)||canonicalPropertyPath(context.document,node.id).toLowerCase().includes(query),facet=(node:ReturnType<typeof canonicalTableRows>[number]["node"])=>context.propertyFilter==="all"||context.propertyFilter==="conditions"&&Boolean(node.presence.condition)||context.propertyFilter==="documentation"&&Boolean(node.documentation.displayText||node.documentation.description||node.documentation.comments)||context.propertyFilter==="issues"&&node.provenance.some(({state})=>state==="shadowed");
  const rows=canonicalTableRows(context.document).filter(({node})=>matches(node)&&facet(node));if(context.propertySort==="name")rows.sort((left,right)=>left.node.name.localeCompare(right.node.name)||left.path.localeCompare(right.path));else if(context.propertySort==="type")rows.sort((left,right)=>left.node.type.localeCompare(right.node.type)||left.path.localeCompare(right.path));return rows;
}

export function renderNavigatorRows(tree:HTMLElement,context:CanonicalSchemaRenderContext):void {
  const {dom,document}=context;for(const row of canonicalNavigatorRows(context)){const article=dom.createElement("article"),choose=button(dom,`${"› ".repeat(row.depth)}${row.node.name} · ${row.path} · ${row.node.type}`,()=>context.openProperty(row.node,choose));choose.dataset.propertyId=row.id;choose.setAttribute("aria-current",String((context.activePropertyId??document.selectedPropertyId)===row.id));article.dataset.propertyRow="true";article.dataset.propertyId=row.id;const actions=button(dom,"Property actions",()=>{context.setMenuPropertyId(row.id);context.openProperty(row.node,actions);});actions.setAttribute("aria-label",`Property actions for ${row.path}`);actions.dataset.propertyActionsPath=row.path;article.append(choose,actions);if(context.menuPropertyId===row.id)article.append(context.renderMenu(row.node));tree.append(article);}
}

export function applyNavigatorView(tree:HTMLElement,dom:Document,view:CanonicalSchemaRenderContext["document"]["view"]):void {
  if(view==="table"){const body=dom.createElement("tbody");for(const article of Array.from(tree.children)){const row=dom.createElement("tr"),cell=dom.createElement("td");cell.append(article);row.append(cell);body.append(row);}tree.replaceChildren(body);tree.setAttribute("role","table");tree.dataset.canonicalView="table";return;}
  tree.setAttribute("role","tree");tree.dataset.canonicalView="tree";
}
