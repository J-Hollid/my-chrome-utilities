import {
  safeWorksheetName,
  templateBindingsFor,
  templateValueAt,
  type DocumentationTemplateKind,
  type TemplateContextObject,
  type TemplateContextValue,
} from "./template-contract.js";
import {
  excelTemplateItemPaths as itemPaths,
  excelTemplateItemRoot as itemRoot,
  excelTemplateNestedCollections as nestedCollections,
  excelTemplateRootCollections as rootCollections,
} from "./excel-template-catalogue.js";
export {excelTemplateGuideFor} from "./excel-template-catalogue.js";
export type {ExcelTemplateCollectionGuide,ExcelTemplateValueGuide} from "./excel-template-catalogue.js";

export interface ExcelTemplateCell {
  address:string;
  value:string|number|boolean;
  style?:unknown;
  note?:unknown;
  sourceAddress?:string;
}
export interface ExcelImageAreaProperties {
  fit:"scale-down"|"contain";
  position:{horizontal:"left"|"center"|"right"|`${number}%`;vertical:"top"|"center"|"bottom"|`${number}%`};
  padding:{top:number;right:number;bottom:number;left:number};
}
export interface ExcelRepeatAreaProperties {separatorArea?:{name:string;range:string}}
export interface ExcelOutputAreaProperties {backgroundFill:string}
export type ExcelTemplateArea=
  |{name:string;type:"repeat";source:string;direction:"across"|"down";range:string;properties?:ExcelRepeatAreaProperties}
  |{name:string;type:"image";source:"theme.logo"|"page.visual.image";range:string;properties?:ExcelImageAreaProperties}
  |{name:string;type:"output";source:"";range:string;properties:ExcelOutputAreaProperties};
export interface ExcelTemplatePrototype {
  kind:DocumentationTemplateKind;
  contractVersion:2|3;
  worksheetName:"Template"|string;
  cells:readonly ExcelTemplateCell[];
  areas:readonly ExcelTemplateArea[];
  merges:readonly string[];
}
export interface ExcelTemplateFinding {cell?:string;area?:string;message:string;repair?:string}

interface Point {row:number;column:number}
interface Rectangle {top:number;left:number;bottom:number;right:number}
interface PixelSize {width:number;height:number}
const cellPattern=/^\$?([A-Z]+)\$?([1-9]\d*)$/u;
const coordinate=(raw:string):Point=>{
  const value=raw.includes("!")?raw.slice(raw.lastIndexOf("!")+1):raw;
  const match=cellPattern.exec(value.toUpperCase());
  if(!match)throw new Error(`Invalid cell ${raw}.`);
  let column=0;
  for(const char of match[1]!)column=column*26+char.charCodeAt(0)-64;
  const row=Number(match[2]);if(column>16_384||row>1_048_576)throw new Error(`Cell ${raw} is outside Excel worksheet limits.`);
  return{row,column};
};
const address=({row,column}:Point):string=>{let letters="",current=column;while(current>0){current-=1;letters=String.fromCharCode(65+current%26)+letters;current=Math.floor(current/26);}return`${letters}${row}`;};
const rectangle=(range:string):Rectangle=>{const clean=range.replace(/^'?Template'?!/u,"").replaceAll("$",""),[first,last=first]=clean.split(":"),start=coordinate(first!),end=coordinate(last!);if(end.row<start.row||end.column<start.column)throw new Error(`Invalid range ${range}.`);return{top:start.row,left:start.column,bottom:end.row,right:end.column};};
const contains=(outer:Rectangle,inner:Rectangle)=>outer.top<=inner.top&&outer.left<=inner.left&&outer.bottom>=inner.bottom&&outer.right>=inner.right;
const overlaps=(left:Rectangle,right:Rectangle)=>!(left.right<right.left||right.right<left.left||left.bottom<right.top||right.bottom<left.top);
const crosses=(left:Rectangle,right:Rectangle)=>overlaps(left,right)&&!contains(left,right)&&!contains(right,left);
const pointInside=(point:Point,bounds:Rectangle)=>point.row>=bounds.top&&point.row<=bounds.bottom&&point.column>=bounds.left&&point.column<=bounds.right;
const areaSize=(value:Rectangle)=>(value.bottom-value.top+1)*(value.right-value.left+1);
const placeholderPaths=(value:string)=>[...value.matchAll(/\{\{\s*([a-z][a-zA-Z0-9.]*)\s*\}\}/gu)].map(([,path])=>path!);

const defaultImageProperties=():ExcelImageAreaProperties=>({fit:"scale-down",position:{horizontal:"left",vertical:"top"},padding:{top:0,right:0,bottom:0,left:0}});
const percentage=(value:string):`${number}%`|undefined=>{const match=/^(?:100(?:\.0+)?|\d{1,2}(?:\.\d+)?)%$/u.exec(value);return match?value as `${number}%`:undefined;};
const paddingValues=(value:string):number[]|undefined=>{const parts=value.trim().split(/\s+/u);if(parts.length<1||parts.length>4)return undefined;const values=parts.map(part=>/^(?:0|\d+(?:\.\d+)?)px$/iu.test(part)?Number(part.slice(0,-2)):Number.NaN);return values.every(Number.isFinite)?values:undefined;};

export function parseExcelAreaProperties(type:"image",raw:string):ExcelImageAreaProperties;
export function parseExcelAreaProperties(type:"repeat",raw:string):{separatorAreaName?:string};
export function parseExcelAreaProperties(type:"output",raw:string):ExcelOutputAreaProperties;
export function parseExcelAreaProperties(type:"image"|"repeat"|"output",raw:string):ExcelImageAreaProperties|ExcelOutputAreaProperties|{separatorAreaName?:string}{
  const declarations=new Map<string,string>(),trimmed=raw.trim();
  if(trimmed){const parts=trimmed.split(";");if(parts.at(-1)?.trim()==="")parts.pop();for(const part of parts){const match=/^\s*([a-z-]+)\s*:\s*(.*?)\s*$/iu.exec(part);if(!match||!match[2])throw new Error("Properties contains a malformed declaration. Use property: value.");const name=match[1]!.toLowerCase(),value=match[2]!.trim();if(declarations.has(name))throw new Error(`${name} is declared more than once.`);declarations.set(name,value);}}
  const supported=type==="image"?new Set(["fit","position","padding"]):type==="repeat"?new Set(["separator-area"]):new Set(["background-fill"]);
  for(const name of declarations.keys())if(!supported.has(name)){if(type==="image"&&name==="separator-area")throw new Error("separator-area cannot be used for an Image. Use fit, position, or padding.");if(type==="repeat"&&["fit","position","padding"].includes(name))throw new Error(`${name} cannot be used for a Repeat. Use separator-area or leave Properties blank.`);throw new Error(`unsupported ${type} property ${name}.`);}
  if(type==="repeat")return declarations.has("separator-area")?{separatorAreaName:declarations.get("separator-area")!}:{};
  if(type==="output"){
    const color=declarations.get("background-fill");if(!color||!/^#[0-9a-f]{6}$/iu.test(color))throw new Error("background-fill must be six-digit #RRGGBB. Use a value such as #FFFFFF.");
    return{backgroundFill:color.toUpperCase()};
  }
  const result=defaultImageProperties(),fit=declarations.get("fit");if(fit){const normalized=fit.toLowerCase();if(normalized!=="scale-down"&&normalized!=="contain")throw new Error(`unsupported image fit ${fit}. Use scale-down or contain.`);result.fit=normalized;}
  const position=declarations.get("position");if(position){const values=position.toLowerCase().trim().split(/\s+/u);if(values.length===1&&values[0]==="center")result.position={horizontal:"center",vertical:"center"};else if(values.length===2){const horizontal=["left","center","right"].includes(values[0]!)?values[0] as "left"|"center"|"right":percentage(values[0]!);const vertical=["top","center","bottom"].includes(values[1]!)?values[1] as "top"|"center"|"bottom":percentage(values[1]!);if(!horizontal||!vertical)throw new Error(`Unsupported image position ${position}.`);result.position={horizontal,vertical};}else throw new Error(`Unsupported image position ${position}.`);}
  const padding=declarations.get("padding");if(padding){const values=paddingValues(padding);if(!values)throw new Error(`Unsupported image padding ${padding}. Use one to four nonnegative px values.`);const[top,right=top,bottom=top,left=right]=values;result.padding={top:top!,right:right!,bottom:bottom!,left:left!};}
  return result;
}

const positionFraction=(value:string,leading:string,trailing:string)=>value===leading?0:value==="center"?0.5:value===trailing?1:Number(value.slice(0,-1))/100;
export function imageLayoutInArea(area:PixelSize,natural:PixelSize,properties:ExcelImageAreaProperties=defaultImageProperties()):{width:number;height:number;left:number;top:number}{
  const usableWidth=area.width-properties.padding.left-properties.padding.right,usableHeight=area.height-properties.padding.top-properties.padding.bottom;if(!(usableWidth>0&&usableHeight>0))throw new Error("Padding leaves no room for the image.");
  const scale=Math.min(usableWidth/natural.width,usableHeight/natural.height,properties.fit==="scale-down"?1:Number.POSITIVE_INFINITY),width=natural.width*scale,height=natural.height*scale;
  return{width,height,left:properties.padding.left+(usableWidth-width)*positionFraction(properties.position.horizontal,"left","right"),top:properties.padding.top+(usableHeight-height)*positionFraction(properties.position.vertical,"top","bottom")};
}

interface RepeatArea {area:Extract<ExcelTemplateArea,{type:"repeat"}>;rectangle:Rectangle;parent?:RepeatArea}
function repeatAreas(prototype:ExcelTemplatePrototype,findings:ExcelTemplateFinding[]):RepeatArea[]{
  const result:RepeatArea[]=[];
  const names=new Set<string>();
  for(const area of prototype.areas){
    if(names.has(area.name)){findings.push({area:area.name,message:`Repeat area ${area.name} is declared more than once.`,repair:"Use one unique Excel name for each area."});continue;}
    names.add(area.name);
    if(area.type!=="repeat")continue;
    try{result.push({area,rectangle:rectangle(area.range)});}catch{findings.push({area:area.name,message:`Repeat area ${area.name} cannot be found.`,repair:`Select the intended Template cells and define the named area ${area.name}.`});}
  }
  for(let left=0;left<result.length;left+=1)for(let right=left+1;right<result.length;right+=1)if(crosses(result[left]!.rectangle,result[right]!.rectangle))findings.push({area:result[left]!.area.name,message:`Repeat areas ${result[left]!.area.name} and ${result[right]!.area.name} cross.`,repair:"Resize the areas so they are separate or one fits completely inside the other."});
  for(const item of result){const parent=result.filter(candidate=>candidate!==item&&contains(candidate.rectangle,item.rectangle)).sort((a,b)=>areaSize(a.rectangle)-areaSize(b.rectangle))[0];if(parent)item.parent=parent;}
  return result;
}

export function validateExcelTemplatePrototype(prototype:ExcelTemplatePrototype):{valid:boolean;findings:ExcelTemplateFinding[]}{
  const findings:ExcelTemplateFinding[]=[];
  if(prototype.contractVersion!==2&&prototype.contractVersion!==3)findings.push({message:"Use guided Excel template contract 2 or 3.",repair:"Download guided starter."});
  const repeats=repeatAreas(prototype,findings);
  const outputs=prototype.areas.filter((area):area is Extract<ExcelTemplateArea,{type:"output"}>=>area.type==="output");
  if(outputs.length>1)for(const output of outputs)findings.push({area:output.name,message:"Contract 3 allows at most one Output area.",repair:"Keep one finite Output area."});
  for(const output of outputs){let outputBounds:Rectangle;try{outputBounds=rectangle(output.range);}catch{findings.push({area:output.name,message:`Output area ${output.name} cannot be found.`,repair:`Select one finite Template range and define ${output.name}.`});continue;}for(const area of prototype.areas)if(area!==output&&!contains(outputBounds,rectangle(area.range)))findings.push({area:output.name,message:`${output.name} does not contain all generated output.`,repair:`Resize ${output.name} to contain ${area.name}.`});for(const cell of prototype.cells)if((cell.value!==""&&cell.value!==null&&cell.value!==undefined)&&!pointInside(coordinate(cell.address),outputBounds))findings.push({area:output.name,message:`${output.name} does not contain all generated output.`,repair:`Resize ${output.name} to contain Template ${cell.address}.`});for(const merge of prototype.merges)if(!contains(outputBounds,rectangle(merge)))findings.push({area:output.name,message:`${output.name} does not contain all generated output.`,repair:`Resize ${output.name} to contain merged range ${merge}.`});}
  for(const item of repeats){
    const available=item.parent?nestedCollections[item.parent.area.source]??[]:rootCollections[prototype.kind];
    if(!available.includes(item.area.source))findings.push({area:item.area.name,message:`${item.area.name} cannot repeat that data here.`,repair:`Choose a collection shown as available in the ${prototype.kind==="flow"?"Flow":prototype.kind} guide.`});
    const separator=item.area.properties?.separatorArea;if(separator){let separatorBounds:Rectangle;try{separatorBounds=rectangle(separator.range);}catch{findings.push({area:item.area.name,message:`Separator area ${separator.name} cannot be found.`,repair:`Define ${separator.name} or correct the Properties value.`});continue;}const bounds=item.rectangle,across=item.area.direction==="across",onEdge=contains(bounds,separatorBounds)&&(across?separatorBounds.top===bounds.top&&separatorBounds.bottom===bounds.bottom&&separatorBounds.right===bounds.right&&separatorBounds.left>bounds.left:separatorBounds.left===bounds.left&&separatorBounds.right===bounds.right&&separatorBounds.bottom===bounds.bottom&&separatorBounds.top>bounds.top);if(!onEdge)findings.push({area:item.area.name,message:`${separator.name} must be the complete ${across?"right":"bottom"} edge of ${item.area.name}.`,repair:`Resize ${separator.name} to the full-${across?"height rightmost columns":"width bottom rows"}.`});for(const cell of prototype.cells)if(pointInside(coordinate(cell.address),separatorBounds)&&placeholderPaths(String(cell.value)).length)findings.push({area:item.area.name,message:`${separator.name} contains unsupported template behavior.`,repair:"Keep only literal cells and presentation in the separator."});for(const other of prototype.areas)if(other.type!=="output"&&other.name!==item.area.name&&overlaps(rectangle(other.range),separatorBounds))findings.push({area:item.area.name,message:`${separator.name} contains unsupported template behavior.`,repair:"Keep bindings, images, and nested repeats in the item area."});for(const merge of prototype.merges){const merged=rectangle(merge);if(overlaps(merged,separatorBounds)&&!contains(separatorBounds,merged))findings.push({area:item.area.name,message:`Merged range ${merge} crosses the item/separator boundary.`,repair:"Keep separator merges wholly inside its named area."});}}
  }
  for(const area of prototype.areas.filter((item):item is Extract<ExcelTemplateArea,{type:"image"}>=>item.type==="image")){
    let bounds:Rectangle;try{bounds=rectangle(area.range);}catch{findings.push({area:area.name,message:`Image area ${area.name} cannot be found.`,repair:`Select the intended Template cells and define the named area ${area.name}.`});continue;}
    if(area.source==="page.visual.image"){
      const nearest=repeats.filter((item)=>contains(item.rectangle,bounds)).sort((left,right)=>areaSize(left.rectangle)-areaSize(right.rectangle))[0];
      const nestedOverlap=repeats.find((item)=>item!==nearest&&overlaps(item.rectangle,bounds));
      if(prototype.kind!=="flow"||nearest?.area.source!=="flow.pages"||nestedOverlap)findings.push({area:area.name,message:`${area.name}'s nearest repeat owner must be flow.pages when using page.visual.image, with no nested repeat crossing or enclosed by the image area.`,repair:"Move the image area directly inside its owning Flow Page repeat, outside nested Event, concept, row, or cell repeats."});
    }
  }
  for(const merge of prototype.merges){
    try{const bounds=rectangle(merge);for(const item of repeats)if(overlaps(bounds,item.rectangle)&&!contains(item.rectangle,bounds))findings.push({area:item.area.name,message:`Merged range ${merge} crosses or encloses repeat area ${item.area.name}.`,repair:"Keep the merged cells wholly inside or outside the repeat area."});}
    catch{findings.push({message:`Merged range ${merge} is invalid.`});}
  }
  const roots=new Set(templateBindingsFor(prototype.kind));
  for(const cell of prototype.cells)for(const path of placeholderPaths(String(cell.value))){
    if(roots.has(path))continue;
    const point=coordinate(cell.address),owners=repeats.filter(item=>pointInside(point,item.rectangle)).sort((a,b)=>areaSize(a.rectangle)-areaSize(b.rectangle));
    const allowed=owners.some(owner=>(itemPaths[owner.area.source]??[]).includes(path));
    if(!allowed)findings.push({cell:cell.address,message:`${cell.address} cannot use ${path} here.`,repair:`Put ${cell.address} inside a repeat of the collection that provides ${path} or choose a field shown as available here.`});
  }
  return{valid:findings.length===0,findings};
}

const literal=(value:TemplateContextValue):string|number|boolean=>typeof value==="number"||typeof value==="boolean"?value:value==null?"":typeof value==="string"?value:JSON.stringify(value);
const renderCell=(value:ExcelTemplateCell["value"],context:TemplateContextObject):ExcelTemplateCell["value"]=>{if(typeof value!=="string")return value;const matches=[...value.matchAll(/\{\{\s*([a-z][a-zA-Z0-9.]*)\s*\}\}/gu)];if(matches.length===1&&matches[0]![0]===value)return literal(templateValueAt(context,matches[0]![1]!));return value.replace(/\{\{\s*([a-z][a-zA-Z0-9.]*)\s*\}\}/gu,(_match,path)=>String(literal(templateValueAt(context,String(path)))));};
interface RenderRegion {item:RepeatArea;children:RenderRegion[]}
interface RenderedRegion {cells:ExcelTemplateCell[];height:number;width:number}
function repeatTree(items:readonly RepeatArea[]):RenderRegion[]{const nodes=new Map(items.map(item=>[item,{item,children:[]} as RenderRegion]));const roots:RenderRegion[]=[];for(const item of items){const node=nodes.get(item)!;if(item.parent)nodes.get(item.parent)!.children.push(node);else roots.push(node);}return roots;}
function shiftedPoint(point:Point,children:readonly {region:RenderRegion;rendered:RenderedRegion}[]):Point{let row=point.row,column=point.column;for(const{region,rendered}of children){const bounds=region.item.rectangle,originalHeight=bounds.bottom-bounds.top+1,originalWidth=bounds.right-bounds.left+1;if(region.item.area.direction==="down"&&point.row>bounds.bottom)row+=rendered.height-originalHeight;if(region.item.area.direction==="across"&&point.column>bounds.right)column+=rendered.width-originalWidth;}return{row,column};}
function renderContainer(prototype:ExcelTemplatePrototype,bounds:Rectangle,children:readonly RenderRegion[],scope:TemplateContextObject):RenderedRegion{
  const childOutputs=children.map(region=>({region,rendered:renderRepeat(prototype,region,scope)})),cells:ExcelTemplateCell[]=[];
  for(const cell of prototype.cells){const point=coordinate(cell.address);if(!pointInside(point,bounds)||children.some(({item})=>pointInside(point,item.rectangle)))continue;const shifted=shiftedPoint(point,childOutputs);cells.push({...cell,address:address({row:shifted.row-bounds.top+1,column:shifted.column-bounds.left+1}),value:renderCell(cell.value,scope)});}
  for(const{region,rendered}of childOutputs){const origin=shiftedPoint({row:region.item.rectangle.top,column:region.item.rectangle.left},childOutputs.filter(item=>item.region!==region));for(const cell of rendered.cells){const point=coordinate(cell.address);cells.push({...cell,address:address({row:origin.row-bounds.top+point.row,column:origin.column-bounds.left+point.column})});}}
  const originalHeight=bounds.bottom-bounds.top+1,originalWidth=bounds.right-bounds.left+1,primaryHeight=originalHeight+childOutputs.filter(({region})=>region.item.area.direction==="down").reduce((sum,{region,rendered})=>sum+rendered.height-(region.item.rectangle.bottom-region.item.rectangle.top+1),0),primaryWidth=originalWidth+childOutputs.filter(({region})=>region.item.area.direction==="across").reduce((sum,{region,rendered})=>sum+rendered.width-(region.item.rectangle.right-region.item.rectangle.left+1),0),height=Math.max(primaryHeight,...childOutputs.map(({region,rendered})=>shiftedPoint({row:region.item.rectangle.top,column:region.item.rectangle.left},childOutputs.filter(item=>item.region!==region)).row-bounds.top+rendered.height)),width=Math.max(primaryWidth,...childOutputs.map(({region,rendered})=>shiftedPoint({row:region.item.rectangle.top,column:region.item.rectangle.left},childOutputs.filter(item=>item.region!==region)).column-bounds.left+rendered.width));
  return{cells,height,width};
}
const repeatItemRectangle=(area:Extract<ExcelTemplateArea,{type:"repeat"}>,bounds:Rectangle):Rectangle=>{const separator=area.properties?.separatorArea;if(!separator)return bounds;const separated=rectangle(separator.range);return area.direction==="across"?{...bounds,right:separated.left-1}:{...bounds,bottom:separated.top-1};};
function projectedSeparator(separator:RenderedRegion,copy:RenderedRegion,direction:"across"|"down"):RenderedRegion{
  const orthogonalSize=direction==="across"?copy.height:copy.width,sourceByTarget=new Map<number,number>();for(const cell of copy.cells){const target=coordinate(cell.address),source=coordinate(cell.sourceAddress??cell.address),targetAxis=direction==="across"?target.row:target.column,sourceAxis=direction==="across"?source.row:source.column;if(!sourceByTarget.has(targetAxis))sourceByTarget.set(targetAxis,sourceAxis);}
  const sourceAxes=separator.cells.map(cell=>{const point=coordinate(cell.sourceAddress??cell.address);return direction==="across"?point.row:point.column;}),minimum=Math.min(...sourceAxes),maximum=Math.max(...sourceAxes),seenValues=new Set<string>(),cells:ExcelTemplateCell[]=[];for(let targetAxis=1;targetAxis<=orthogonalSize;targetAxis+=1){const sourceAxis=Math.min(maximum,Math.max(minimum,sourceByTarget.get(targetAxis)??minimum+Math.min(targetAxis-1,maximum-minimum)));for(const cell of separator.cells){const source=coordinate(cell.sourceAddress??cell.address),axis=direction==="across"?source.row:source.column;if(axis!==sourceAxis)continue;const point=coordinate(cell.address),key=cell.sourceAddress??cell.address,retainValue=!seenValues.has(key);seenValues.add(key);cells.push({...cell,address:address(direction==="across"?{row:targetAxis,column:point.column}:{row:point.row,column:targetAxis}),...(retainValue?{}:{value:"",note:undefined})});}}
  return{cells,height:direction==="across"?orthogonalSize:separator.height,width:direction==="down"?orthogonalSize:separator.width};
}
function projectedOutput(prototype:ExcelTemplatePrototype,rendered:RenderedRegion,sourceBottom:number,sourceRight:number):{range:string;backgroundFill:string;cellCount:number}|undefined{
  const outputArea=prototype.areas.find((area):area is Extract<ExcelTemplateArea,{type:"output"}>=>(area.type==="output"));
  if(!outputArea)return undefined;
  const source=rectangle(outputArea.range),bottom=source.bottom+rendered.height-sourceBottom,right=source.right+rendered.width-sourceRight;
  if(bottom>1_048_576||right>16_384)throw new Error(`Generated ${outputArea.name} exceeds the Excel worksheet limit. Reduce the Output area or the number of generated repeat items.`);
  const cellCount=(bottom-source.top+1)*(right-source.left+1);
  if(cellCount>250_000)throw new Error(`Generated ${outputArea.name} ${address({row:source.top,column:source.left})}:${address({row:bottom,column:right})} contains ${cellCount} cells; the generated background exceeds the 250000-cell budget. Reduce the Output area or the number of generated repeat items.`);
  return{range:`${address({row:source.top,column:source.left})}:${address({row:bottom,column:right})}`,backgroundFill:outputArea.properties.backgroundFill,cellCount};
}
function renderRepeat(prototype:ExcelTemplatePrototype,region:RenderRegion,scope:TemplateContextObject):RenderedRegion{
  const items=templateValueAt(scope,region.item.area.source);if(!Array.isArray(items))throw new Error(`Repeat area ${region.item.area.name} cannot use ${region.item.area.source} here.`);
  const prefix=itemRoot(region.item.area.source),itemBounds=repeatItemRectangle(region.item.area,region.item.rectangle),copies=items.map(item=>renderContainer(prototype,itemBounds,region.children,{...scope,[prefix]:item as TemplateContextValue})),separatorBounds=region.item.area.properties?.separatorArea?rectangle(region.item.area.properties.separatorArea.range):undefined,separator=separatorBounds?renderContainer(prototype,separatorBounds,[],scope):undefined,separatorCount=Math.max(items.length-1,0),baseHeight=Math.max(0,...copies.map(({height})=>height),separator?.height??0),baseWidth=Math.max(0,...copies.map(({width})=>width),separator?.width??0),height=region.item.area.direction==="down"?copies.reduce((sum,copy)=>sum+copy.height,0)+(separator?.height??0)*separatorCount:baseHeight,width=region.item.area.direction==="across"?copies.reduce((sum,copy)=>sum+copy.width,0)+(separator?.width??0)*separatorCount:baseWidth;
  if(height>1_048_576||width>16_384)throw new Error(`Repeat area ${region.item.area.name} requests ${items.length} copies and exceeds the Excel worksheet limit.`);
  const cells:ExcelTemplateCell[]=[];let rowOffset=0,columnOffset=0;for(const [index,copy] of copies.entries()){for(const cell of copy.cells){const point=coordinate(cell.address);cells.push({...cell,address:address({row:point.row+rowOffset,column:point.column+columnOffset})});}if(region.item.area.direction==="down")rowOffset+=copy.height;else columnOffset+=copy.width;if(separator&&index<copies.length-1){const emitted=projectedSeparator(separator,copy,region.item.area.direction);for(const cell of emitted.cells){const point=coordinate(cell.address);cells.push({...cell,address:address({row:point.row+rowOffset,column:point.column+columnOffset})});}if(region.item.area.direction==="down")rowOffset+=separator.height;else columnOffset+=separator.width;}}return{cells,height,width};
}

export function renderExcelTemplateGrid(prototype:ExcelTemplatePrototype,context:TemplateContextObject):{worksheetName:string;cells:ExcelTemplateCell[];merges:string[];output?:{range:string;backgroundFill:string;cellCount:number}}{
  const validation=validateExcelTemplatePrototype(prototype);if(!validation.valid)throw new Error(validation.findings.map(({message})=>message).join("\n"));const repeats=repeatAreas(prototype,[]),roots=repeatTree(repeats),sourceCells=prototype.cells.map(cell=>({...cell,sourceAddress:cell.sourceAddress??cell.address})),renderable={...prototype,cells:sourceCells},points=sourceCells.map(({address:cellAddress})=>coordinate(cellAddress)),bottom=Math.max(1,...points.map(({row})=>row),...roots.map(({item})=>item.rectangle.bottom)),right=Math.max(1,...points.map(({column})=>column),...roots.map(({item})=>item.rectangle.right)),rendered=renderContainer(renderable,{top:1,left:1,bottom,right},roots,context);if(rendered.height>1_048_576||rendered.width>16_384)throw new Error("Template expansion exceeds the Excel worksheet limit.");
  const merges=prototype.merges.flatMap(merge=>{const bounds=rectangle(merge),members=rendered.cells.filter(cell=>pointInside(coordinate(cell.sourceAddress??cell.address),bounds)),deltas=new Map<string,Point>();for(const cell of members){const target=coordinate(cell.address),source=coordinate(cell.sourceAddress??cell.address),delta={row:target.row-source.row,column:target.column-source.column};deltas.set(`${delta.row}:${delta.column}`,delta);}return[...deltas.values()].map(delta=>`${address({row:bounds.top+delta.row,column:bounds.left+delta.column})}:${address({row:bounds.bottom+delta.row,column:bounds.right+delta.column})}`);});
  const output=projectedOutput(prototype,rendered,bottom,right);
  return{worksheetName:safeWorksheetName(String(templateValueAt(context,"section.name")??prototype.worksheetName)),cells:rendered.cells.sort((left,right)=>coordinate(left.address).row-coordinate(right.address).row||coordinate(left.address).column-coordinate(right.address).column),merges,...(output?{output}:{})};
}
