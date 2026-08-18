import {safeWorksheetName,templateBindingsFor,templateValueAt,type DocumentationTemplateKind,type TemplateContextObject,type TemplateContextValue} from "./template-contract.js";

export interface ExcelTemplateCell {address:string;value:string|number|boolean;style?:unknown;note?:unknown;sourceAddress?:string}
export interface ExcelTemplateDirectiveCell {cell:string;text:string}
export interface ExcelTemplatePrototype {kind:DocumentationTemplateKind;contractVersion:1;worksheetName:string;cells:readonly ExcelTemplateCell[];directives:readonly ExcelTemplateDirectiveCell[];merges:readonly string[]}
export type ExcelTemplateDirective={kind:"template";templateKind:DocumentationTemplateKind;contractVersion:1}|{kind:"each";items:string;variable:string;direction:"down"|"right";lastCell:string}|{kind:"image";source:"theme.logo";lastCell:string};
export interface ExcelTemplateFinding {cell?:string;message:string}

const cellPattern=/^([A-Z]+)([1-9]\d*)$/u;
const coordinate=(address:string):{row:number;column:number}=>{const match=cellPattern.exec(address.toUpperCase());if(!match)throw new Error(`Invalid cell ${address}.`);let column=0;for(const char of match[1]!)column=column*26+char.charCodeAt(0)-64;return{row:Number(match[2]),column};};
const address=({row,column}:{row:number;column:number}):string=>{let letters="",current=column;while(current>0){current-=1;letters=String.fromCharCode(65+current%26)+letters;current=Math.floor(current/26);}return`${letters}${row}`;};

export function parseExcelTemplateDirective(text:string):ExcelTemplateDirective{
  const source=text.trim(),template=/^tw:template\(kind="(overview|flow|matrix|profile)" contract="1"\)$/u.exec(source);
  if(template)return{kind:"template",templateKind:template[1] as DocumentationTemplateKind,contractVersion:1};
  const each=/^tw:each\(items="([a-z][a-zA-Z0-9.]*)" var="([a-z][a-zA-Z0-9]*)" direction="(down|right)" lastCell="([A-Z]+[1-9]\d*)"\)$/u.exec(source);
  if(each)return{kind:"each",items:each[1]!,variable:each[2]!,direction:each[3] as "down"|"right",lastCell:each[4]!};
  const image=/^tw:image\(source="(theme\.logo)" lastCell="([A-Z]+[1-9]\d*)"\)$/u.exec(source);
  if(image)return{kind:"image",source:"theme.logo",lastCell:image[2]!};
  throw new Error(`Unsupported template directive: ${source}`);
}

const rectanglesCross=(a:{top:number;left:number;bottom:number;right:number},b:typeof a)=>{const overlap=!(a.right<b.left||b.right<a.left||a.bottom<b.top||b.bottom<a.top),aContains=a.top<=b.top&&a.left<=b.left&&a.bottom>=b.bottom&&a.right>=b.right,bContains=b.top<=a.top&&b.left<=a.left&&b.bottom>=a.bottom&&b.right>=a.right;return overlap&&!aContains&&!bContains;};
const placeholderPaths=(value:string)=>[...value.matchAll(/\{\{\s*([a-z][a-zA-Z0-9.]*)\s*\}\}/gu)].map(([,path])=>path!);
const itemPaths:Record<string,readonly string[]>={
  "flow.pages":["page.stepLabel","page.pageName","page.sourcePageName","page.eventName","page.heading","page.rows","page.events"],
  "page.events":["event.eventName","event.heading","event.rows"],
  "table.rows":["row.property","row.concept","row.cells"],"flow.rows":["row.property","row.concept","row.cells"],
  "page.rows":["row.property","row.concept","row.description","row.type","row.allowedValues","row.example","row.comments","row.value","row.cells"],
  "event.rows":["row.property","row.concept","row.description","row.type","row.allowedValues","row.example","row.comments","row.value","row.cells"],
  "row.cells":["cell.columnKey","cell.heading","cell.value"],
  "matrix.rows":["row.property","row.concept","row.cells"],"matrix.concepts":["concept.name","concept.rows"],
  "profile.rows":["row.property","row.concept","row.cells"],"profile.concepts":["concept.name","concept.rows"],
  "concept.rows":["row.property","row.concept","row.cells"],
  "overview.fields":["field.label","field.value"],
};
const rootCollections:Record<DocumentationTemplateKind,readonly string[]>={overview:["overview.fields"],flow:["flow.pages","table.rows","flow.rows"],matrix:["matrix.rows","matrix.concepts","table.rows"],profile:["profile.rows","profile.concepts","table.rows"]};
const nestedCollections:Record<string,readonly string[]>={"flow.pages":["page.events","page.rows"],"page.events":["event.rows"],"page.rows":["row.cells"],"event.rows":["row.cells"],"table.rows":["row.cells"],"flow.rows":["row.cells"],"matrix.rows":["row.cells"],"profile.rows":["row.cells"],"matrix.concepts":["concept.rows"],"profile.concepts":["concept.rows"],"concept.rows":["row.cells"]};

export function validateExcelTemplatePrototype(prototype:ExcelTemplatePrototype):{valid:boolean;findings:ExcelTemplateFinding[]}{
  const findings:ExcelTemplateFinding[]=[],directives:{source:ExcelTemplateDirectiveCell;directive:ExcelTemplateDirective;rectangle?:{top:number;left:number;bottom:number;right:number};canonicalItems?:string}[]=[];
  if(prototype.contractVersion!==1)findings.push({message:"Use template contract version 1."});
  for(const source of prototype.directives){try{const directive=parseExcelTemplateDirective(source.text),start=coordinate(source.cell),end="lastCell" in directive?coordinate(directive.lastCell):undefined;if(end&&(end.row<start.row||end.column<start.column))findings.push({cell:source.cell,message:`${source.cell} has an out-of-bounds rectangle.`});directives.push({source,directive,...(end?{rectangle:{top:start.row,left:start.column,bottom:end.row,right:end.column}}:{})});}catch(error){findings.push({cell:source.cell,message:(error as Error).message});}}
  for(let left=0;left<directives.length;left+=1)for(let right=left+1;right<directives.length;right+=1){const a=directives[left]!,b=directives[right]!;if(a.rectangle&&b.rectangle&&rectanglesCross(a.rectangle,b.rectangle))findings.push({cell:a.source.cell,message:`Repeat regions at ${a.source.cell} and ${b.source.cell} cross.`});}
  for(const merge of prototype.merges){try{const[startText,endText]=merge.split(":"),start=coordinate(startText!),end=coordinate(endText??startText!),rectangle={top:start.row,left:start.column,bottom:end.row,right:end.column};for(const item of directives)if(item.directive.kind==="each"&&item.rectangle){const region=item.rectangle,overlap=!(rectangle.right<region.left||region.right<rectangle.left||rectangle.bottom<region.top||region.bottom<rectangle.top),inside=rectangle.top>=region.top&&rectangle.left>=region.left&&rectangle.bottom<=region.bottom&&rectangle.right<=region.right;if(overlap&&!inside)findings.push({cell:item.source.cell,message:`Merged range ${merge} crosses repeat boundary at ${item.source.cell}; keep the merge wholly inside or outside.`});}}catch{findings.push({message:`Merged range ${merge} is invalid.`});}}
  const eachDirectives=directives.filter((item):item is typeof item&{directive:Extract<ExcelTemplateDirective,{kind:"each"}>}=>item.directive.kind==="each").sort((left,right)=>{const area=(value:typeof left)=>((value.rectangle?.bottom??0)-(value.rectangle?.top??0)+1)*((value.rectangle?.right??0)-(value.rectangle?.left??0)+1);return area(right)-area(left);});
  for(const item of eachDirectives){
    const parents=eachDirectives.filter(candidate=>candidate!==item&&candidate.rectangle&&item.rectangle&&candidate.rectangle.top<=item.rectangle.top&&candidate.rectangle.left<=item.rectangle.left&&candidate.rectangle.bottom>=item.rectangle.bottom&&candidate.rectangle.right>=item.rectangle.right).sort((a,b)=>{const area=(value:NonNullable<typeof a.rectangle>)=>(value.bottom-value.top+1)*(value.right-value.left+1);return area(a.rectangle!)-area(b.rectangle!);}),parent=parents[0];
    const canonicalAvailable=parent?.canonicalItems?nestedCollections[parent.canonicalItems]??[]:rootCollections[prototype.kind],actualAvailable=parent?canonicalAvailable.map(collection=>collection.replace(new RegExp(`^${itemRoot(parent.canonicalItems!)}\\.`,"u"),`${parent.directive.variable}.`)):canonicalAvailable,index=actualAvailable.indexOf(item.directive.items);
    if(index<0){findings.push({cell:item.source.cell,message:`${item.source.cell} collection ${item.directive.items} is outside this repeat scope.`});continue;}item.canonicalItems=canonicalAvailable[index]!;
  }
  const root=new Set(templateBindingsFor(prototype.kind));
  for(const cell of prototype.cells)for(const path of placeholderPaths(String(cell.value))){if(root.has(path))continue;const point=coordinate(cell.address),owners=eachDirectives.filter(({rectangle})=>rectangle&&point.row>=rectangle.top&&point.row<=rectangle.bottom&&point.column>=rectangle.left&&point.column<=rectangle.right).sort((left,right)=>{const area=(value:NonNullable<typeof left.rectangle>)=>(value.bottom-value.top+1)*(value.right-value.left+1);return area(left.rectangle!)-area(right.rectangle!);}),owner=owners.find(({directive,canonicalItems})=>canonicalItems&&itemPaths[canonicalItems]?.map(binding=>binding.replace(new RegExp(`^${itemRoot(canonicalItems)}\\.`,"u"),`${directive.variable}.`)).includes(path));if(!owner)findings.push({cell:cell.address,message:`${cell.address} uses out-of-scope binding ${path}.`});}
  return{valid:findings.length===0,findings};
}

const literal=(value:TemplateContextValue):string|number|boolean=>typeof value==="number"||typeof value==="boolean"?value:value==null?"":typeof value==="string"?value:JSON.stringify(value);
const itemRoot=(collection:string)=>collection.endsWith(".pages")?"page":collection.endsWith(".events")?"event":collection.endsWith(".cells")?"cell":collection.endsWith(".concepts")?"concept":collection.endsWith(".fields")?"field":"row";
const renderCell=(value:ExcelTemplateCell["value"],context:TemplateContextObject):ExcelTemplateCell["value"]=>{if(typeof value!=="string")return value;const matches=[...value.matchAll(/\{\{\s*([a-z][a-zA-Z0-9.]*)\s*\}\}/gu)];if(matches.length===1&&matches[0]![0]===value)return literal(templateValueAt(context,matches[0]![1]!));return value.replace(/\{\{\s*([a-z][a-zA-Z0-9.]*)\s*\}\}/gu,(_match,path)=>String(literal(templateValueAt(context,String(path)))));};

interface Rectangle {top:number;left:number;bottom:number;right:number}
interface RepeatRegion {source:ExcelTemplateDirectiveCell;directive:Extract<ExcelTemplateDirective,{kind:"each"}>;rectangle:Rectangle;children:RepeatRegion[]}
interface RenderedRegion {cells:ExcelTemplateCell[];height:number;width:number}
const contains=(outer:Rectangle,inner:Rectangle)=>outer.top<=inner.top&&outer.left<=inner.left&&outer.bottom>=inner.bottom&&outer.right>=inner.right;
const pointInside=(point:{row:number;column:number},rectangle:Rectangle)=>point.row>=rectangle.top&&point.row<=rectangle.bottom&&point.column>=rectangle.left&&point.column<=rectangle.right;

function repeatTree(prototype:ExcelTemplatePrototype):RepeatRegion[]{
  const regions:RepeatRegion[]=prototype.directives.flatMap<RepeatRegion>(source=>{const directive=parseExcelTemplateDirective(source.text);if(directive.kind!=="each")return[];const start=coordinate(source.cell),end=coordinate(directive.lastCell);return[{source,directive,rectangle:{top:start.row,left:start.column,bottom:end.row,right:end.column},children:[]}];});
  const roots:RepeatRegion[]=[];for(const region of regions){const parents=regions.filter(candidate=>candidate!==region&&contains(candidate.rectangle,region.rectangle)).sort((a,b)=>(a.rectangle.bottom-a.rectangle.top+1)*(a.rectangle.right-a.rectangle.left+1)-(b.rectangle.bottom-b.rectangle.top+1)*(b.rectangle.right-b.rectangle.left+1));const parent=parents[0];if(parent)parent.children.push(region);else roots.push(region);}return roots;
}

function shiftedPoint(point:{row:number;column:number},children:readonly {region:RepeatRegion;rendered:RenderedRegion}[]):{row:number;column:number}{
  let row=point.row,column=point.column;for(const{region,rendered}of children){const originalHeight=region.rectangle.bottom-region.rectangle.top+1,originalWidth=region.rectangle.right-region.rectangle.left+1;if(region.directive.direction==="down"&&point.row>region.rectangle.bottom)row+=rendered.height-originalHeight;if(region.directive.direction==="right"&&point.column>region.rectangle.right)column+=rendered.width-originalWidth;}return{row,column};
}

function renderContainer(prototype:ExcelTemplatePrototype,bounds:Rectangle,children:readonly RepeatRegion[],scope:TemplateContextObject):RenderedRegion{
  const childOutputs=children.map(region=>({region,rendered:renderRepeat(prototype,region,scope)})),cells:ExcelTemplateCell[]=[];
  for(const cell of prototype.cells){const point=coordinate(cell.address);if(!pointInside(point,bounds)||children.some(({rectangle})=>pointInside(point,rectangle)))continue;const shifted=shiftedPoint(point,childOutputs);cells.push({...cell,address:address({row:shifted.row-bounds.top+1,column:shifted.column-bounds.left+1}),value:renderCell(cell.value,scope)});}
  for(const{region,rendered}of childOutputs){const origin=shiftedPoint({row:region.rectangle.top,column:region.rectangle.left},childOutputs.filter(item=>item.region!==region));for(const cell of rendered.cells){const point=coordinate(cell.address);cells.push({...cell,address:address({row:origin.row-bounds.top+point.row,column:origin.column-bounds.left+point.column})});}}
  const originalHeight=bounds.bottom-bounds.top+1,originalWidth=bounds.right-bounds.left+1,height=originalHeight+childOutputs.filter(({region})=>region.directive.direction==="down").reduce((sum,{region,rendered})=>sum+rendered.height-(region.rectangle.bottom-region.rectangle.top+1),0),width=originalWidth+childOutputs.filter(({region})=>region.directive.direction==="right").reduce((sum,{region,rendered})=>sum+rendered.width-(region.rectangle.right-region.rectangle.left+1),0);return{cells,height,width};
}

function renderRepeat(prototype:ExcelTemplatePrototype,region:RepeatRegion,scope:TemplateContextObject):RenderedRegion{
  const items=templateValueAt(scope,region.directive.items);if(!Array.isArray(items))throw new Error(`${region.source.cell} collection ${region.directive.items} is unavailable.`);const copies=items.map(item=>renderContainer(prototype,region.rectangle,region.children,{...scope,[region.directive.variable]:item as TemplateContextValue,[itemRoot(region.directive.items)]:item as TemplateContextValue})),baseHeight=Math.max(0,...copies.map(({height})=>height)),baseWidth=Math.max(0,...copies.map(({width})=>width)),height=region.directive.direction==="down"?copies.reduce((sum,copy)=>sum+copy.height,0):baseHeight,width=region.directive.direction==="right"?copies.reduce((sum,copy)=>sum+copy.width,0):baseWidth;if(height>1_048_576||width>16_384)throw new Error(`${region.source.cell} expansion of ${items.length} items exceeds the Excel worksheet limit.`);const cells:ExcelTemplateCell[]=[];let rowOffset=0,columnOffset=0;for(const copy of copies){for(const cell of copy.cells){const point=coordinate(cell.address);cells.push({...cell,address:address({row:point.row+rowOffset,column:point.column+columnOffset})});}if(region.directive.direction==="down")rowOffset+=copy.height;else columnOffset+=copy.width;}return{cells,height,width};
}

export function renderExcelTemplateGrid(prototype:ExcelTemplatePrototype,context:TemplateContextObject):{worksheetName:string;cells:ExcelTemplateCell[];merges:string[]}{
  const validation=validateExcelTemplatePrototype(prototype);if(!validation.valid)throw new Error(validation.findings.map(({message})=>message).join("\n"));const roots=repeatTree(prototype),sourceCells=prototype.cells.map(cell=>({...cell,sourceAddress:cell.sourceAddress??cell.address})),renderable={...prototype,cells:sourceCells},points=sourceCells.map(({address:cellAddress})=>coordinate(cellAddress)),bottom=Math.max(1,...points.map(({row})=>row),...roots.map(({rectangle})=>rectangle.bottom)),right=Math.max(1,...points.map(({column})=>column),...roots.map(({rectangle})=>rectangle.right)),rendered=renderContainer(renderable,{top:1,left:1,bottom,right},roots,context);if(rendered.height>1_048_576||rendered.width>16_384)throw new Error("Template expansion exceeds the Excel worksheet limit.");const merges=prototype.merges.flatMap(merge=>{const[startText,endText]=merge.split(":"),start=coordinate(startText!),end=coordinate(endText??startText!),members=rendered.cells.filter(cell=>{const point=coordinate(cell.sourceAddress??cell.address);return point.row>=start.row&&point.row<=end.row&&point.column>=start.column&&point.column<=end.column;}),deltas=new Map<string,{row:number;column:number}>();for(const cell of members){const target=coordinate(cell.address),source=coordinate(cell.sourceAddress??cell.address),delta={row:target.row-source.row,column:target.column-source.column};deltas.set(`${delta.row}:${delta.column}`,delta);}return[...deltas.values()].map(delta=>`${address({row:start.row+delta.row,column:start.column+delta.column})}:${address({row:end.row+delta.row,column:end.column+delta.column})}`);});return{worksheetName:safeWorksheetName(String(templateValueAt(context,"section.name")??prototype.worksheetName)),cells:rendered.cells.sort((a,b)=>coordinate(a.address).row-coordinate(b.address).row||coordinate(a.address).column-coordinate(b.address).column),merges};
}
