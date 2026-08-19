import assert from "node:assert/strict";
import {
  compileFlowDocumentationSnapshot,
  configureFlowDocumentationSnapshot,
  configureFlowDocumentationTable,
  documentationWorksheet,
  orderFlowDocumentationOccurrenceIds,
  renderFlowDocumentationClipboard,
  writeFlowDocumentationWorkbook,
} from "../dist/data-layer-flow-table-documentation-export.js";
import {
  compileProjectDocumentationSnapshot,
  createProjectDocumentationSet,
  createProjectDocumentationTheme,
  fitProjectDocumentationLogo,
  parseProjectDocumentationTheme,
  PROJECT_DOCUMENTATION_LOGO_DATA_URL_LIMIT,
  readProjectDocumentationLogoFile,
  selectProjectDocumentationTables,
  serializeProjectDocumentationTheme,
  themeFingerprint,
  writeProjectDocumentationWorkbook,
} from "../dist/data-layer-project-documentation-workspace.js";
import {
  groupProjectDocumentationConceptRows,
  reconcileProjectDocumentationConcepts,
} from "../dist/data-layer-project-documentation-compiler.js";
import {
  documentationExportPresentation,
  documentationExportSelection,
  documentationTabAfterKey,
} from "../dist/data-layer-project-documentation-workspace-ui.js";
import {appendProjectDocumentationSet} from "../dist/project-documentation/workspace-set-creation.js";
import {renderExcelTemplateGrid,validateExcelTemplatePrototype} from "../dist/documentation-templates/excel-template.js";
import {assignDocumentationTemplate,snapshotTemplateDigests} from "../dist/documentation-templates/template-library.js";
import {renderRichDocumentationTemplate} from "../dist/documentation-templates/rich-template.js";
const permutations=(values)=>values.length<2?[values]:values.flatMap((value,index)=>permutations(values.filter((_,candidate)=>candidate!==index)).map((rest)=>[value,...rest]));

let templateSeed=0x7e6d51a3;const templateRandom=()=>{templateSeed=(Math.imul(templateSeed,1664525)+1013904223)>>>0;return templateSeed;};
for(let sample=0;sample<160;sample+=1){const rowCount=templateRandom()%8,cellCount=templateRandom()%7,literal=["=SUM(1,2)","+1","-2","@name","{{cell.value}}","<script>\nline"][templateRandom()%6],rows=Array.from({length:rowCount},(_,row)=>({property:`/${row}`,cells:Array.from({length:cellCount},(_,column)=>({value:`${literal}:${row}:${column}`}))})),prototype={kind:"matrix",contractVersion:2,worksheetName:"Template",cells:[{address:"A2",value:"{{row.property}}"},{address:"B2",value:"{{cell.value}}"},{address:"A5",value:"tail"}],areas:[{name:"RowPattern",type:"repeat",source:"matrix.rows",direction:"down",range:"A2:C3"},{name:"CellPattern",type:"repeat",source:"row.cells",direction:"across",range:"B2:C2"}],merges:[]},rendered=renderExcelTemplateGrid(prototype,{section:{name:"Matrix"},matrix:{rows}}),values=rendered.cells.map(({value})=>value);assert.equal(values.filter(value=>String(value).startsWith("/")).length,rowCount,"nested row repetition conserves item count");assert.equal(values.filter(value=>String(value).startsWith(literal)).length,rowCount*cellCount,"nested cell repetition conserves the Cartesian item count");if(rowCount*cellCount&&literal==="<script>\nline")assert.equal(values.some(value=>String(value).includes("<script>")),true,"literal markup remains data");}
for(let sample=0;sample<180;sample+=1){const count=templateRandom()%9,start=2+templateRandom()%40,range=`A${start}:C${start+1}`,prototype={kind:"matrix",contractVersion:2,worksheetName:"Template",cells:[{address:`A${start}`,value:"{{row.property}}"},{address:`B${start}`,value:"{{cell.value}}"},{address:`D${start+3}`,value:"tail"}],areas:[{name:"RowPattern",type:"repeat",source:"matrix.rows",direction:"down",range},{name:"CellPattern",type:"repeat",source:"row.cells",direction:"across",range:`B${start}:C${start}`}],merges:[]},before=structuredClone(prototype),rows=Array.from({length:count},(_,row)=>({property:`/${sample}/${row}`,cells:Array.from({length:templateRandom()%6},(_,column)=>({value:`${row}:${column}`}))})),rendered=renderExcelTemplateGrid(prototype,{section:{name:"Matrix"},matrix:{rows}});assert.deepEqual(prototype,before,"rendering conserves moved and nested named-area definitions");assert.equal(rendered.cells.filter(({value})=>String(value).startsWith(`/${sample}/`)).length,count,"moved repeat areas round-trip every outer item");assert.equal(rendered.cells.filter(({value})=>value==="tail").length,1,"static cells remain singular");assert.equal(rendered.cells.find(({value})=>value==="tail")?.address,`D${start+1+count*2}`,"static cells shift by the repeated area's exact growth, including empty collections");}
for(const range of ["XFE1:XFE2","A1048577:A1048578"])assert.equal(validateExcelTemplatePrototype({kind:"matrix",contractVersion:2,worksheetName:"Template",cells:[],areas:[{name:"Rows",type:"repeat",source:"matrix.rows",direction:"down",range}],merges:[]}).valid,false,"named areas stay inside Excel worksheet limits");
for(let sample=0;sample<120;sample+=1){const template={id:`template:${sample}`,name:"Rich",format:"rich",kind:"overview",contractVersion:1,digest:`rich:${sample}`,blocks:[{id:`block:${sample}`,type:"paragraph",content:[{binding:"project.name"}]}]},literal=`<script data-sample="${sample}">\n{{project.name}}`,rendered=renderRichDocumentationTemplate(template,{project:{name:literal}});assert.equal(rendered.plain,literal,"rich plain output preserves exact literal values");assert.doesNotMatch(rendered.html,/<script/iu,"rich HTML never promotes literal markup");}
for(let sample=0;sample<100;sample+=1){const template={id:`template:${sample}`,name:"Excel",format:"excel",kind:"flow",contractVersion:2,digest:`sha256:${sample}`,body:{assetId:`asset:${sample}`,digest:`sha256:${sample}`,byteLength:sample+1},validation:{valid:true,findings:[]}},set={id:"set",name:"Set",themeId:"theme",sections:[]},documentation={sets:[set],themes:[],templates:[template]},once=assignDocumentationTemplate(documentation,"set","excel","flow",template.id),twice=assignDocumentationTemplate(once,"set","excel","flow",template.id);assert.deepEqual(twice,once,"repeating one assignment is idempotent");assert.deepEqual(snapshotTemplateDigests(twice,twice.sets[0]),snapshotTemplateDigests(once,once.sets[0]),"assignment idempotence preserves snapshot digest identity");}

const documentationTabs=["build","preview","export"];
for(const tab of documentationTabs){
  const right=documentationTabAfterKey(tab,"ArrowRight"),left=documentationTabAfterKey(tab,"ArrowLeft");
  assert.equal(documentationTabAfterKey(right,"ArrowLeft"),tab,"right then left is inverse navigation");
  assert.equal(documentationTabAfterKey(left,"ArrowRight"),tab,"left then right is inverse navigation");
  assert.equal(documentationTabAfterKey(documentationTabAfterKey(documentationTabAfterKey(tab,"ArrowRight"),"ArrowRight"),"ArrowRight"),tab,"three right moves cycle through every tab");
}
let presentationSeed=0x45a3bc21;
const presentationRandom=()=>{presentationSeed=(Math.imul(presentationSeed,1664525)+1013904223)>>>0;return presentationSeed;};
for(let sample=0;sample<180;sample+=1){
  const sections=Array.from({length:1+presentationRandom()%12},(_,index)=>({id:`section:${sample}:${index}`,name:`Section ${sample}.${index}`})),selectedSectionIds=Array.from({length:presentationRandom()%20},()=>presentationRandom()%4===0?`missing:${presentationRandom()}`:sections[presentationRandom()%sections.length].id),scope=["current","selected","complete"][presentationRandom()%3],currentSectionId=presentationRandom()%4===0?"missing":sections[presentationRandom()%sections.length].id,presentation=documentationExportPresentation({scope,currentSectionId,selectedSectionIds,sections}),available=new Set(sections.map(({id})=>id)),expected=scope==="complete"?sections.map(({id})=>id):scope==="selected"?selectedSectionIds.filter((id)=>available.has(id)):[currentSectionId].filter((id)=>available.has(id));
  assert.deepEqual(presentation.sectionIds,expected,"export filtering preserves requested/configured order");
  assert.equal(presentation.checklistVisible,scope==="selected","only selected scope exposes the checklist");
  assert.match(presentation.summary,new RegExp(`^${expected.length} section${expected.length===1?"":"s"} — `),"the scope summary reports its filtered count");
  const selection=documentationExportSelection({scope,currentSectionId,selectedSectionIds,fallbackSectionId:sections[0].id});
  assert.deepEqual(selection,scope==="complete"?{scope:"complete"}:scope==="selected"?{scope:"selected",selectedSectionIds}:{scope:"current",currentSectionId},"export selection preserves the requested scope and identities");
}
for(let sample=0;sample<180;sample+=1){
  const existingSet=createProjectDocumentationSet({id:`documentation-set:existing:${sample}`,name:`Existing ${sample}`,themeId:`documentation-theme:existing:${sample}`,sections:[{id:`existing:${sample}:overview`,kind:"overview",name:"Overview",selected:true},{id:`existing:${sample}:matrix`,kind:"matrix",name:"Data capture matrix",selected:true,configuration:{contextIds:[]}}]}),existingTheme=createProjectDocumentationTheme({id:`documentation-theme:existing:${sample}`,name:`Existing theme ${sample}`}),records={sets:[existingSet],themes:[existingTheme]},before=JSON.stringify(records),setName=sample%3===0?"   ":` Partner ${sample} `,themeName=sample%4===0?"   ":` Theme ${sample} `,created=appendProjectDocumentationSet(records,{setId:`documentation-set:new:${sample}`,themeId:`documentation-theme:new:${sample}`,setName,themeName});
  assert.equal(JSON.stringify(records),before,"Documentation Set creation never mutates its input records");
  assert.deepEqual(created.records.sets.slice(0,-1),records.sets,"Documentation Set creation conserves every existing Set");
  assert.deepEqual(created.records.themes.slice(0,-1),records.themes,"Documentation Set creation conserves every existing theme");
  assert.equal(created.records.sets.length,records.sets.length+1,"Documentation Set creation appends exactly one Set");
  assert.equal(created.records.themes.length,records.themes.length+1,"Documentation Set creation appends exactly one theme");
  assert.deepEqual(created.records.sets.at(-1),created.set,"the appended Set is the returned Set");
  assert.deepEqual(created.records.themes.at(-1),created.theme,"the appended theme is the returned theme");
  assert.equal(created.set.name,setName.trim()||"Client specification","Set names trim with the stable empty-name default");
  assert.equal(created.theme.name,themeName.trim()||"Project theme","theme names trim with the stable empty-name default");
  assert.deepEqual(created.set.sections.map(({kind,name,selected})=>({kind,name,selected})),[{kind:"overview",name:"Overview",selected:true},{kind:"matrix",name:"Data capture matrix",selected:true}],"every new Set has one selected Overview and matrix");
}
const unzipStored=(bytes)=>{const files=new Map(),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let offset=0;while(offset+30<=bytes.length&&view.getUint32(offset,true)===0x04034b50){const size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true),name=new TextDecoder().decode(bytes.slice(offset+30,offset+30+nameLength)),start=offset+30+nameLength+extraLength;files.set(name,new TextDecoder().decode(bytes.slice(start,start+size)));offset=start+size;}return files;};
const workbookSheetNames=(files)=>[...files.get("xl/workbook.xml").matchAll(/<sheet name="([^"]+)"/gu)].map((match)=>match[1]);
const assertWorkbookPackage=(bytes,expectedSheets)=>{const files=unzipStored(bytes);assert.match(files.get("_rels/.rels"),/Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/officeDocument"/);assert.deepEqual(workbookSheetNames(files),expectedSheets);};
const occurrences=[{id:"cart",pageGroupId:"checkout"},{id:"shipping",pageGroupId:"shipping"},{id:"payment",pageGroupId:"payment"},{id:"confirmation",pageGroupId:"confirmation"}];
const relationships=[{sourceNodeId:"cart",targetNodeId:"shipping",kind:"alternative"},{sourceNodeId:"cart",targetNodeId:"payment",kind:"alternative"},{sourceNodeId:"shipping",targetNodeId:"confirmation",kind:"merge"},{sourceNodeId:"payment",targetNodeId:"confirmation",kind:"merge"}];
for(const shuffledOccurrences of permutations(occurrences))for(const shuffledRelationships of permutations(relationships))assert.deepEqual(orderFlowDocumentationOccurrenceIds(shuffledOccurrences,shuffledRelationships,["checkout","shipping","payment","confirmation"]),{ids:["cart","shipping","payment","confirmation"],labels:{cart:"1",shipping:"2a",payment:"2b",confirmation:"3"}});

const compiled=(value)=>({status:"ready",properties:{"/unsafe":{presence:"required",expectedValue:value,origins:[{contributorId:"profile",contributorName:"Profile",scope:"Shared Profile"}],superseded:[]}},conflicts:[],provenance:[],exclusions:[]});
const context=(id,value)=>({id:`context:${id}`,kind:"interaction",pageFrameId:`frame:${id}`,occurrenceId:id,pageName:id,eventName:`event_${id}`,stepLabel:id,effectiveRevision:1,compiled:compiled(value)});
const snapshot=compileFlowDocumentationSnapshot({projectId:"project",projectName:"Shop",flowId:"flow",flowName:"Checkout",graphRevision:3,sourceState:"published",generatedAt:"2026-07-20T00:00:00.000Z",contexts:[context("a","=SUM(1,2)\t<strong>\nline"),context("b","+1"),context("c","-2"),context("d","@name")]});
const propertyConfiguration={selectedPaths:["/unsafe"],metadata:["type","description"],pathDisplay:"canonical",headingParts:{step:true,page:true,event:true}};
for(const order of permutations(snapshot.contexts.map(({id})=>id))){const configured=configureFlowDocumentationSnapshot(snapshot,{contextOrder:order}),table=configureFlowDocumentationTable(configured,"values",propertyConfiguration),plain=renderFlowDocumentationClipboard(table,{includeHeadings:true}).plain,rows=plain.split("\n").map((row)=>row.split("\t"));assert.equal(rows.every((row)=>row.length===table.headings.length),true);assert.deepEqual(table.headings.slice(3).map((heading)=>heading.split(" ")[1]),order.map((id)=>id.slice(8)));assert.equal(plain.includes("<strong>"),true);}

const configured=configureFlowDocumentationSnapshot(snapshot,{contextOrder:["context:d","context:b"]}),table=configureFlowDocumentationTable(configured,"values",propertyConfiguration),copy=renderFlowDocumentationClipboard(configureFlowDocumentationTable(snapshot,"values",{selectedPaths:["/unsafe"]}),{includeHeadings:true,style:"highlighted"}),workbook=writeFlowDocumentationWorkbook(configured,{valueTable:table,matrixTable:configureFlowDocumentationTable(configured,"matrix",propertyConfiguration)}),binary=new TextDecoder().decode(workbook);
for(const prefix of ["'=SUM(1,2)","'+1","'-2","'@name"])assert.equal(renderFlowDocumentationClipboard(configureFlowDocumentationTable(snapshot,"values",{selectedPaths:["/unsafe"]})).plain.includes(prefix),true);
assert.match(copy.html,/&lt;strong&gt;<br>line/);assert.doesNotMatch(copy.html,/<strong>/);assert.doesNotMatch(binary,/<f>/);assert.match(binary,/Checkout · Published/);
assert.deepEqual(snapshot.contexts.map(({id})=>id),["context:a","context:b","context:c","context:d"]);

const logoMediaTypes=["image/png","image/jpeg","image/gif"];
const logoPayloadPrefixes={"image/png":"iVBORw0KGgo","image/jpeg":"/9j/","image/gif":"R0lGODlh"};
let logoSeed=0x10c0f11e;
const logoRandom=()=>{
  logoSeed=(Math.imul(logoSeed,1664525)+1013904223)>>>0;
  return logoSeed;
};
for(let sample=0;sample<240;sample+=1){
  const intrinsicWidth=1+(logoRandom()%10000),intrinsicHeight=1+(logoRandom()%10000),maxWidth=1+(logoRandom()%1000),maxHeight=1+(logoRandom()%1000);
  const fitted=fitProjectDocumentationLogo(intrinsicWidth,intrinsicHeight,maxWidth,maxHeight),scale=Math.min(1,maxWidth/intrinsicWidth,maxHeight/intrinsicHeight);
  assert.ok(fitted.width<=maxWidth+1e-9&&fitted.height<=maxHeight+1e-9,"fitted logos stay within both bounds");
  assert.ok(Math.abs(fitted.width-intrinsicWidth*scale)<1e-9&&Math.abs(fitted.height-intrinsicHeight*scale)<1e-9,"fitted logos preserve aspect ratio");
  if(scale===1)assert.deepEqual(fitted,{width:intrinsicWidth,height:intrinsicHeight},"logos that already fit are not enlarged");
  else assert.ok(Math.abs(fitted.width-maxWidth)<1e-9||Math.abs(fitted.height-maxHeight)<1e-9,"a reduced logo touches one limiting edge");
}
for(const dimensions of [[0,1],[1,0],[-1,1],[1,-1],[Number.NaN,1]])assert.deepEqual(fitProjectDocumentationLogo(...dimensions),{width:0,height:0});
for(let sample=0;sample<120;sample+=1){
  const type=logoMediaTypes[logoRandom()%logoMediaTypes.length],name=`logo-${sample}.${type.split("/")[1]}`,payload=logoPayloadPrefixes[type]+"A".repeat((logoRandom()%1024)*4),dataUrl=`data:${type};base64,${payload}`;
  assert.deepEqual(
    await readProjectDocumentationLogoFile({name,type},async()=>dataUrl,async()=>({width:1,height:1})),
    {fileName:name,dataUrl},
    "every supported media type preserves the human name and exact converted bytes",
  );
}
let unsupportedReadCount=0;
for(const type of ["","image/svg+xml","text/plain","application/octet-stream"]){
  await assert.rejects(
    readProjectDocumentationLogoFile({name:"unsupported",type},async()=>{unsupportedReadCount+=1;return`data:${type};base64,AA==`;}),
    {message:"Choose a PNG, JPEG, or GIF image"},
  );
}
assert.equal(unsupportedReadCount,0,"unsupported media is rejected before reading its bytes");
const boundaryPrefix="data:image/png;base64,iVBORw0KGgo",boundaryDataUrl=boundaryPrefix+"A".repeat(PROJECT_DOCUMENTATION_LOGO_DATA_URL_LIMIT-boundaryPrefix.length);
assert.equal(
  (await readProjectDocumentationLogoFile({name:"boundary.png",type:"image/png"},async()=>boundaryDataUrl,async()=>({width:1,height:1}))).dataUrl.length,
  PROJECT_DOCUMENTATION_LOGO_DATA_URL_LIMIT,
  "the documented inclusive data-URL limit is accepted",
);
await assert.rejects(
  readProjectDocumentationLogoFile({name:"oversize.png",type:"image/png"},async()=>`${boundaryDataUrl}A`),
  {message:"The logo is too large"},
);

for(let index=0;index<100;index+=1){
  const inputLogo=index%4===0?"data:image/png;base64,AA==":index%4===1?"https://example.test/logo.png":"javascript:unsafe";
  const theme=createProjectDocumentationTheme({
    id:` theme:${index}\u0000 `,
    name:` Theme ${index} `,
    clientName:index%2?" Client ":"",
    logo:inputLogo,
    colors:{heading:index%2?"#123abc":"invalid",accent:"#336699",stripe:"#f4f4f4"},
    typography:{family:index%4?" Inter ":"",headingSize:index-20,bodySize:30-index},
    density:index%2?"compact":"comfortable",
    borders:index%3===0,
    striping:index%5===0,
    highlightedHeadings:index%7===0,
    columnWidths:{Property:index-10,Description:20+index},
    headerText:` Header ${index} `,
    footerText:` Footer ${index} `,
  });
  assert.equal(theme.logo,inputLogo.startsWith("data:image/")?inputLogo:"");
  assert.deepEqual(createProjectDocumentationTheme(theme),theme);
  assert.equal(themeFingerprint(createProjectDocumentationTheme(theme)),themeFingerprint(theme));
  assert.equal(Object.isFrozen(theme)&&Object.isFrozen(theme.colors)&&Object.isFrozen(theme.typography),true);
  const copiedTheme=parseProjectDocumentationTheme(serializeProjectDocumentationTheme(theme),{id:`copied-theme:${index}`,name:theme.name});
  assert.deepEqual({...copiedTheme,id:theme.id},theme);

  const sections=[
    {id:`overview:${index}`,kind:"overview",name:"Overview",selected:true},
    {id:`flow:${index}`,kind:"flow",name:"Flow",targetId:`flow-target:${index}`,selected:index%2===0},
    {id:`matrix:${index}`,kind:"matrix",name:"Matrix",selected:true},
    {id:`profile:${index}`,kind:"profile",name:"Profile",targetId:`profile-target:${index}`,selected:true},
  ];
  const set=createProjectDocumentationSet({id:`set:${index}`,name:`Set ${index}`,themeId:theme.id,sections});
  assert.deepEqual(createProjectDocumentationSet(set),set);
  const tables=sections.map(({id,name})=>({id,title:name,headings:["Property"],rows:[[id]]}));
  const projectSnapshot=compileProjectDocumentationSnapshot({projectId:"project",projectName:"Shop",set,theme,sourceRevisions:{project:index},generatedAt:"2026-07-26T00:00:00.000Z",tables,diagnostics:[]});
  const requested=sections.map(({id})=>id).reverse();
  assert.deepEqual(selectProjectDocumentationTables(projectSnapshot,{scope:"selected",selectedSectionIds:requested}).map(({id})=>id),sections.map(({id})=>id));
  assert.deepEqual(selectProjectDocumentationTables(projectSnapshot,{scope:"complete"}).map(({id})=>id),sections.filter(({selected})=>selected).map(({id})=>id));
  const selection=index%3===0
    ?{scope:"current",currentSectionId:sections[index%sections.length].id}
    :index%3===1
      ?{scope:"selected",selectedSectionIds:requested.filter((_,candidate)=>candidate%2===0)}
      :{scope:"complete"};
  assertWorkbookPackage(
    writeProjectDocumentationWorkbook(projectSnapshot,selection),
    selectProjectDocumentationTables(projectSnapshot,selection).map(({title})=>title),
  );
}

let conceptSeed=0xd0c5e7;
const conceptRandom=()=>((conceptSeed=(Math.imul(conceptSeed,1103515245)+12345)>>>0)/0x100000000);
const shuffled=(values)=>{const result=[...values];for(let index=result.length-1;index>0;index-=1){const target=Math.floor(conceptRandom()*(index+1));[result[index],result[target]]=[result[target],result[index]];}return result;};
for(let example=0;example<250;example+=1){
  const names=Array.from({length:2+Math.floor(conceptRandom()*6)},(_,index)=>`Concept ${example}-${index}`),configuredOrder=shuffled(names),configured=configuredOrder.map((name,index)=>({name,included:(index+example)%3!==0})),ungrouped={name:"Ungrouped",included:example%4!==0},ungroupedIndex=Math.floor(conceptRandom()*(configured.length+1)),savedConcepts=[...configured.slice(0,ungroupedIndex),ungrouped,...configured.slice(ungroupedIndex)],set=createProjectDocumentationSet({
    id:`set:concept-property:${example}`,name:`Concept property ${example}`,themeId:`theme:${example}`,sections:[{id:`matrix:concept-property:${example}`,kind:"matrix",name:"Data capture matrix",selected:true}],
    concepts:savedConcepts,includeConceptSubheadings:true,
  }),newNames=[`Acquisition ${example}`,`Behavior ${example}`],available=[
    ...shuffled(names).flatMap((name)=>[` ${name.toUpperCase()} `,name.toLowerCase()]),
    ...newNames.flatMap((name)=>[name,` ${name.toUpperCase()} `]),
  ],reconciled=reconcileProjectDocumentationConcepts(set,available);
  assert.deepEqual(reconciled.slice(0,savedConcepts.length),savedConcepts,"reconciliation preserves the complete saved order and inclusion, including Ungrouped");
  assert.deepEqual(reconciled.slice(savedConcepts.length).map(({name})=>name),newNames,"new normalized concepts append alphabetically after every saved entry");

  const itemCount=5+Math.floor(conceptRandom()*25),items=Array.from({length:itemCount},(_,index)=>{
    const concept=index%5===0?undefined:names[Math.floor(conceptRandom()*names.length)],path=`/${String(Math.floor(conceptRandom()*12)).padStart(2,"0")}/${String(index).padStart(2,"0")}`;
    return{path,...(concept?{concept:index%2?concept.toUpperCase():` ${concept.toLowerCase()} `}:{}),cells:[`row:${index}`,path]};
  }),headingsOn=groupProjectDocumentationConceptRows(set,items),headingsOff=groupProjectDocumentationConceptRows({...set,includeConceptSubheadings:false},items),included=new Map(set.concepts.map(({name,included})=>[name.toLocaleLowerCase(),included])),expectedItems=items.filter(({concept})=>included.get(concept?.trim().toLocaleLowerCase()||"ungrouped")!==false);
  assert.deepEqual(headingsOff,headingsOn,"filtering and configured order are independent of heading visibility");
  assert.equal(headingsOn.rows.length,expectedItems.length,"grouping conserves every included row exactly once");
  assert.deepEqual(new Set(headingsOn.rows.map(([id])=>id)),new Set(expectedItems.map(({cells})=>cells[0])),"grouping neither duplicates nor substitutes rows");
  for(const group of headingsOn.groups){
    const paths=headingsOn.rows.slice(group.start,group.start+group.count).map(([,path])=>path);
    assert.deepEqual(paths,[...paths].sort(),"paths remain ordered within every configured concept");
  }
  assert.deepEqual(
    headingsOn.groups.map(({name})=>name),
    set.concepts.filter(({name,included})=>included&&items.some(({concept})=>(concept?.trim().toLocaleLowerCase()||"ungrouped")===name.toLocaleLowerCase())).map(({name})=>name),
    "non-empty groups retain stable configured order and suppress zero-row headings",
  );
  const groupedTable={title:`Concept property ${example}`,headings:["Property","Path"],rows:headingsOn.rows,conceptGroups:headingsOn.groups},rendered=renderFlowDocumentationClipboard(groupedTable,{includeHeadings:true}),worksheet=documentationWorksheet(groupedTable);
  assert.equal((rendered.plain.match(/^Property\tPath$/gmu)??[]).length,1,"plain grouped output emits its standard headings once");
  assert.equal((rendered.html.match(/<thead><tr>/gu)??[]).length,1,"rich grouped output emits one standard heading row");
  assert.equal((rendered.html.match(/data-concept-columns/gu)??[]).length,0,"rich grouped output never repeats columns per concept");
  assert.equal((worksheet.match(/data-concept-columns/gu)??[]).length,0,"worksheet grouped output never repeats columns per concept");
  assert.equal((rendered.html.match(/scope="rowgroup"/gu)??[]).length,headingsOn.groups.length,"rich grouped output conserves every non-empty concept divider");
  assert.equal((worksheet.match(/data-concept-heading="true"/gu)??[]).length,headingsOn.groups.length,"worksheet grouped output conserves every non-empty concept divider");
}

console.log("Flow table documentation export property tests passed");
