import assert from "node:assert/strict";
import {
  compileFlowDocumentationSnapshot,
  configureFlowDocumentationSnapshot,
  configureFlowDocumentationTable,
  orderFlowDocumentationOccurrenceIds,
  renderFlowDocumentationClipboard,
  writeFlowDocumentationWorkbook,
} from "../dist/data-layer-flow-table-documentation-export.js";
import {
  compileProjectDocumentationSnapshot,
  createProjectDocumentationSet,
  createProjectDocumentationTheme,
  parseProjectDocumentationTheme,
  selectProjectDocumentationTables,
  serializeProjectDocumentationTheme,
  themeFingerprint,
} from "../dist/data-layer-project-documentation-workspace.js";

const permutations=(values)=>values.length<2?[values]:values.flatMap((value,index)=>permutations(values.filter((_,candidate)=>candidate!==index)).map((rest)=>[value,...rest]));
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
}

console.log("Flow table documentation export property tests passed");
