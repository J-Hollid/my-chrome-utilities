import assert from "node:assert/strict";
import ExcelJS from "exceljs";

import {
  parseExcelTemplateDirective,
  renderExcelTemplateGrid,
  validateExcelTemplatePrototype,
} from "../dist/documentation-templates/excel-template.js";
import {validateExcelTemplateWorkbook} from "../dist/documentation-templates/excel-workbook.js";
import {writeDocumentationTemplateStarter,writeProjectDocumentationWorkbookWithTemplates} from "../dist/documentation-templates/excel-renderer.js";

globalThis.ExcelJS=ExcelJS;

const flowContext={
  project:{name:"Shop",purpose:"",website:"shop.example"},
  section:{name:"Checkout journey",kind:"flow"},
  flow:{pages:[
    {stepLabel:"1",pageName:"Cart",events:[{eventName:"view_cart"}]},
    {stepLabel:"2",pageName:"Payment",events:[{eventName:"purchase"}]},
  ]},
};

assert.deepEqual(
  parseExcelTemplateDirective('tw:each(items="flow.pages" var="page" direction="right" lastCell="B2")'),
  {kind:"each",items:"flow.pages",variable:"page",direction:"right",lastCell:"B2"},
);

const prototype={
  kind:"flow",contractVersion:1,worksheetName:"Prototype",
  cells:[
    {address:"A1",value:"{{section.name}}"},
    {address:"A2",value:"Step {{page.stepLabel}}"},
    {address:"B2",value:"{{page.pageName}}"},
  ],
  directives:[{cell:"A2",text:'tw:each(items="flow.pages" var="page" direction="right" lastCell="B2")'}],
  merges:[],
};
assert.deepEqual(validateExcelTemplatePrototype(prototype).findings,[]);
const rendered=renderExcelTemplateGrid(prototype,flowContext);
assert.equal(rendered.worksheetName,"Checkout journey");
assert.deepEqual(rendered.cells.map(({address,value})=>[address,value]),[
  ["A1","Checkout journey"],
  ["A2","Step 1"],["B2","Cart"],
  ["C2","Step 2"],["D2","Payment"],
]);
assert.equal(rendered.cells.some(({value})=>String(value).includes("{{")),false);

const unsafe=renderExcelTemplateGrid({...prototype,cells:[{address:"A1",value:"{{project.name}}"}],directives:[]},{...flowContext,project:{...flowContext.project,name:"=1+1\n{{page.id}}"}});
assert.equal(unsafe.cells[0].value,"=1+1\n{{page.id}}","project values remain literal and are never reparsed as template syntax");

const crossing={...prototype,directives:[
  {cell:"A2",text:'tw:each(items="flow.pages" var="page" direction="right" lastCell="B3")'},
  {cell:"B1",text:'tw:each(items="table.rows" var="row" direction="down" lastCell="C2")'},
]};
assert.match(validateExcelTemplatePrototype(crossing).findings.map(({message})=>message).join("\n"),/A2.*B1|B1.*A2/u);

const nested={kind:"matrix",contractVersion:1,worksheetName:"Matrix",cells:[
  {address:"A1",value:"{{section.name}}"},
  {address:"A2",value:"{{row.property}}"},
  {address:"B2",value:"{{cell.value}}"},
  {address:"D5",value:"After matrix"},
],directives:[
  {cell:"A2",text:'tw:each(items="matrix.rows" var="row" direction="down" lastCell="C3")'},
  {cell:"B2",text:'tw:each(items="row.cells" var="cell" direction="right" lastCell="C2")'},
],merges:[]};
const nestedContext={section:{name:"Coverage",kind:"matrix"},matrix:{rows:[
  {property:"/cart",cells:[{value:"Mandatory"},{value:"Optional"},{value:"Blocked"}]},
  {property:"/order",cells:[{value:"Optional"},{value:"Mandatory"},{value:"Not defined"}]},
]}};
assert.equal(validateExcelTemplatePrototype(nested).valid,true);
const nestedRendered=renderExcelTemplateGrid(nested,nestedContext);
assert.deepEqual(nestedRendered.cells.filter(({value})=>String(value).startsWith("/")).map(({address,value})=>[address,value]),[["A2","/cart"],["A4","/order"]]);
assert.deepEqual(nestedRendered.cells.filter(({value})=>["Mandatory","Optional","Blocked","Not defined"].includes(value)).map(({address,value})=>[address,value]),[
  ["B2","Mandatory"],["D2","Optional"],["F2","Blocked"],
  ["B4","Optional"],["D4","Mandatory"],["F4","Not defined"],
]);
assert.deepEqual(nestedRendered.cells.find(({value})=>value==="After matrix")?.address,"D7","later static content shifts after every outer copy");

const crossingMerge={...prototype,merges:["A1:A2"]};
assert.match(validateExcelTemplatePrototype(crossingMerge).findings.map(({message})=>message).join("\n"),/[Mm]erged range A1:A2.*A2/u);

const workbook=new ExcelJS.Workbook(),worksheet=workbook.addWorksheet("Prototype");
worksheet.getCell("A1").value="{{project.name}}";
worksheet.getCell("A1").note='tw:template(kind="flow" contract="1")';
const workbookBytes=await workbook.xlsx.writeBuffer(),validated=await validateExcelTemplateWorkbook(new Blob([workbookBytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),"flow");
assert.equal(validated.valid,true,validated.findings.map(({message})=>message).join("\n"));
assert.equal(validated.kind,"flow");
assert.equal(validated.contractVersion,1);

for(const kind of ["overview","flow","matrix","profile"]){
  const starter=await writeDocumentationTemplateStarter(kind),result=await validateExcelTemplateWorkbook(new Blob([starter],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),kind);
  assert.equal(result.valid,true,`${kind} starter: ${result.findings.map(({location,message})=>`${location}: ${message}`).join("\n")}`);
}

const matrixBook=new ExcelJS.Workbook(),matrixSheet=matrixBook.addWorksheet("Prototype");
matrixSheet.getCell("A1").value="{{section.name}}";matrixSheet.getCell("A1").note='tw:template(kind="matrix" contract="1")';
matrixSheet.getCell("A3").value="{{row.property}}";matrixSheet.getCell("A3").note='tw:each(items="matrix.rows" var="row" direction="down" lastCell="C4")';
matrixSheet.getCell("B3").value="{{cell.value}}";matrixSheet.getCell("B3").note='tw:each(items="row.cells" var="cell" direction="right" lastCell="C3")';matrixSheet.getColumn(1).width=31;matrixSheet.getRow(3).height=27;
const matrixBytes=await matrixBook.xlsx.writeBuffer(),matrixBlob=new Blob([matrixBytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),matrixDigest="sha256:matrix",matrixTemplate={id:"template:matrix",name:"Matrix",format:"excel",kind:"matrix",contractVersion:1,digest:matrixDigest,body:{assetId:"asset:matrix",digest:matrixDigest,byteLength:matrixBlob.size},validation:{valid:true,findings:[]}},matrixRows=nestedContext.matrix.rows.map(row=>({...row,concept:"",cells:row.cells.map((cell,index)=>({columnKey:String(index),heading:String(index),value:cell.value}))})),matrixSnapshot={projectId:"project",projectName:"Shop",projectPurpose:"",projectWebsite:"shop.example",generatedAt:"2026-08-17T00:00:00.000Z",title:"Client specification",incomplete:false,snapshotHash:"snapshot",sourceRevisions:{},set:{id:"set",name:"Client specification",themeId:"theme",sections:[{id:"matrix",name:"Coverage",kind:"matrix",selected:true}],templateAssignments:{"excel:matrix":matrixTemplate.id}},theme:{id:"theme",name:"Theme",clientName:"",logo:"",headerText:"",footerText:"",typography:{family:"Arial",headingSize:16,bodySize:11},colors:{heading:"#000000",accent:"#000000",stripe:"#ffffff"},density:"comfortable",borders:true,striping:true,highlightedHeadings:true,columnWidths:{}},templateDigests:{"excel:matrix":matrixDigest},templates:[matrixTemplate],tables:[{id:"matrix",title:"Coverage",headings:["Property","One","Two","Three"],rows:[],templateData:{columns:[{key:"property",heading:"Property"},{key:"1",heading:"One"},{key:"2",heading:"Two"},{key:"3",heading:"Three"}],rows:matrixRows,concepts:[],legend:""}}],diagnostics:[]};
const generated=await writeProjectDocumentationWorkbookWithTemplates(matrixSnapshot,{scope:"current",currentSectionId:"matrix"},async()=>matrixBlob),opened=new ExcelJS.Workbook();await opened.xlsx.load(generated);const generatedSheet=opened.worksheets[0];
const generatedAddresses=new Map();generatedSheet.eachRow({includeEmpty:true},row=>row.eachCell({includeEmpty:true},cell=>generatedAddresses.set(String(cell.value),cell.address)));
assert.deepEqual(["/cart","/order"].map(value=>generatedAddresses.get(value)),["A3","A5"]);
assert.equal(generatedSheet.getColumn(1).width,31);assert.equal(generatedSheet.getRow(3).height,27);

console.log("documentation Excel template unit test passed");

