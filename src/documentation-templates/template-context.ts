import type {ProjectDocumentationSnapshot,ProjectDocumentationTable} from "../data-layer-project-documentation-workspace.js";
import type {TemplateContextObject} from "./template-contract.js";

const freeze=<T>(value:T):T=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value as Record<string,unknown>))freeze(child);}return value;};
const publicTable=(table:ProjectDocumentationTable):TemplateContextObject=>table.templateData??{columns:table.headings.map(heading=>({key:heading,heading})),rows:table.rows.map(row=>({concept:"",cells:row.map((value,index)=>({columnKey:table.headings[index]??"",heading:table.headings[index]??"",value}))})),concepts:[],legend:table.legend??""};

export function prepareDocumentationTemplateContext(snapshot:ProjectDocumentationSnapshot,sectionId:string):TemplateContextObject{
  const section=snapshot.set.sections.find(({id})=>id===sectionId),table=snapshot.tables.find(({id})=>id===sectionId);if(!section||!table)throw new Error(`Documentation section ${sectionId} is unavailable in this immutable snapshot.`);const tableValue=publicTable(table),context:TemplateContextObject={document:{title:snapshot.title,incomplete:snapshot.incomplete,generatedAt:snapshot.generatedAt},project:{name:snapshot.projectName,purpose:snapshot.projectPurpose??"",website:snapshot.projectWebsite??""},set:{name:snapshot.set.name},section:{name:section.name,kind:section.kind},theme:{name:snapshot.theme.name,clientName:snapshot.theme.clientName,headerText:snapshot.theme.headerText,footerText:snapshot.theme.footerText,logo:snapshot.theme.logo},table:tableValue};
  if(section.kind==="overview")context.overview={fields:(tableValue.rows as readonly TemplateContextObject[]).map(row=>({label:String(row.property??""),value:String(((row.cells as readonly TemplateContextObject[])[0]?.value)??"")}))};
  if(section.kind==="flow")context.flow=table.templateData??{name:section.name,pages:[],columns:tableValue.columns!,rows:tableValue.rows!};
  if(section.kind==="matrix")context.matrix={columns:tableValue.columns!,rows:tableValue.rows!,concepts:tableValue.concepts!,legend:tableValue.legend!};
  if(section.kind==="profile")context.profile={name:section.name,rows:tableValue.rows!,concepts:tableValue.concepts!};
  return freeze(context);
}
