import assert from "node:assert/strict";
import ExcelJS from "exceljs";

import {
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

const prototype={
  kind:"flow",contractVersion:2,worksheetName:"Template",
  cells:[
    {address:"A1",value:"{{section.name}}"},
    {address:"A2",value:"Step {{page.stepLabel}}"},
    {address:"B2",value:"{{page.pageName}}"},
  ],
  areas:[{name:"PageCard",type:"repeat",source:"flow.pages",direction:"across",range:"A2:B2"}],
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

const unsafe=renderExcelTemplateGrid({...prototype,cells:[{address:"A1",value:"{{project.name}}"}],areas:[]},{...flowContext,project:{...flowContext.project,name:"=1+1\n{{page.id}}"}});
assert.equal(unsafe.cells[0].value,"=1+1\n{{page.id}}","project values remain literal and are never reparsed as template syntax");

const fixedPrefixes={...prototype,cells:[{address:"A2",value:"{{page.pageName}}"},{address:"A3",value:"{{event.eventName}}"}],areas:[{name:"PageCard",type:"repeat",source:"flow.pages",direction:"across",range:"A2:B3"},{name:"EventRow",type:"repeat",source:"page.events",direction:"down",range:"A3:A3"}]};
assert.equal(validateExcelTemplatePrototype(fixedPrefixes).valid,true,"collection item prefixes are fixed by the public catalogue");
assert.deepEqual(renderExcelTemplateGrid(fixedPrefixes,flowContext).cells.map(({address,value})=>[address,value]),[["A2","Cart"],["C2","Payment"],["A3","view_cart"],["C3","purchase"]]);

const crossing={...prototype,areas:[
  {name:"PageCard",type:"repeat",source:"flow.pages",direction:"across",range:"A2:B3"},
  {name:"Rows",type:"repeat",source:"table.rows",direction:"down",range:"B1:C2"},
]};
assert.match(validateExcelTemplatePrototype(crossing).findings.map(({message})=>message).join("\n"),/PageCard.*Rows|Rows.*PageCard/u);
const invalidParent={...fixedPrefixes,areas:[{name:"PageCard",type:"repeat",source:"matrix.rows",direction:"across",range:"A2:B3"},{name:"EventRow",type:"repeat",source:"page.events",direction:"down",range:"A3:A3"}]},invalidParentMessages=validateExcelTemplatePrototype(invalidParent).findings.map(({message})=>message).join("\n");assert.match(invalidParentMessages,/PageCard cannot repeat that data here/u);assert.doesNotMatch(invalidParentMessages,/event\.eventName/u,"dependent binding findings wait until the containing repeat is valid");

const nested={kind:"matrix",contractVersion:2,worksheetName:"Template",cells:[
  {address:"A1",value:"{{section.name}}"},
  {address:"A2",value:"{{row.property}}"},
  {address:"B2",value:"{{cell.value}}"},
  {address:"D5",value:"After matrix"},
],areas:[
  {name:"RowPattern",type:"repeat",source:"matrix.rows",direction:"down",range:"A2:C3"},
  {name:"CellPattern",type:"repeat",source:"row.cells",direction:"across",range:"B2:C2"},
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
assert.match(validateExcelTemplatePrototype(crossingMerge).findings.map(({message})=>message).join("\n"),/[Mm]erged range A1:A2.*PageCard/u);

const workbook=new ExcelJS.Workbook(),worksheet=workbook.addWorksheet("Template"),guide=workbook.addWorksheet("Template Guide");
worksheet.getCell("A1").value="{{project.name}}";
guide.addTable({name:"TemplateSettings",ref:"A1",headerRow:true,columns:[{name:"Setting"},{name:"Value"}],rows:[["Contract",2],["Kind","flow"]]});
guide.addTable({name:"TemplateAreas",ref:"A6",headerRow:true,columns:[{name:"Area"},{name:"Type"},{name:"Source"},{name:"Direction"}],rows:[]});
const workbookBytes=await workbook.xlsx.writeBuffer(),validated=await validateExcelTemplateWorkbook(new Blob([workbookBytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),"flow");
assert.equal(validated.valid,true,validated.findings.map(({message})=>message).join("\n"));
assert.equal(validated.kind,"flow");
assert.equal(validated.contractVersion,2);

const legacyBook=new ExcelJS.Workbook(),legacySheet=legacyBook.addWorksheet("Template");legacySheet.getCell("A1").note='tw:template(kind="flow" contract="1")';const legacyBytes=await legacyBook.xlsx.writeBuffer(),legacy=await validateExcelTemplateWorkbook(new Blob([legacyBytes]),"flow");assert.equal(legacy.valid,false);assert.match(legacy.findings.map(({message})=>message).join("\n"),/guided starter/u,"worksheet Notes never declare current template behavior");

for(const kind of ["overview","flow","matrix","profile"]){
  const starter=await writeDocumentationTemplateStarter(kind),openedStarter=new ExcelJS.Workbook();await openedStarter.xlsx.load(starter);assert.deepEqual(openedStarter.worksheets.map(sheet=>sheet.name),["Template","Template Guide"]);assert.equal(openedStarter.getWorksheet("Template Guide").state,"visible");assert.equal(openedStarter.getWorksheet("Template Guide").getCell("B6").value,2);assert.ok(openedStarter.getWorksheet("Template Guide").getTable("TemplateAreas"));const result=await validateExcelTemplateWorkbook(new Blob([starter],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),kind);
  assert.equal(result.valid,true,`${kind} starter: ${result.findings.map(({location,message})=>`${location}: ${message}`).join("\n")}`);
}

const matrixBook=new ExcelJS.Workbook(),matrixSheet=matrixBook.addWorksheet("Template"),matrixGuide=matrixBook.addWorksheet("Template Guide");
matrixSheet.getCell("A1").value="{{section.name}}";matrixSheet.getCell("A3").value="{{row.property}}";matrixSheet.getCell("B3").value="{{cell.value}}";matrixSheet.getColumn(1).width=31;matrixSheet.getRow(3).height=27;matrixBook.definedNames.add("'Template'!$A$3:$C$4","RowPattern");matrixBook.definedNames.add("'Template'!$B$3:$C$3","CellPattern");matrixGuide.addTable({name:"TemplateSettings",ref:"A1",headerRow:true,columns:[{name:"Setting"},{name:"Value"}],rows:[["Contract",2],["Kind","matrix"]]});matrixGuide.addTable({name:"TemplateAreas",ref:"A6",headerRow:true,columns:[{name:"Area"},{name:"Type"},{name:"Source"},{name:"Direction"}],rows:[["RowPattern","Repeat","matrix.rows","Down"],["CellPattern","Repeat","row.cells","Across"]]});
const matrixBytes=await matrixBook.xlsx.writeBuffer(),matrixBlob=new Blob([matrixBytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),matrixDigest="sha256:matrix",matrixTemplate={id:"template:matrix",name:"Matrix",format:"excel",kind:"matrix",contractVersion:2,digest:matrixDigest,body:{assetId:"asset:matrix",digest:matrixDigest,byteLength:matrixBlob.size},validation:{valid:true,findings:[]}},matrixRows=nestedContext.matrix.rows.map(row=>({...row,concept:"",cells:row.cells.map((cell,index)=>({columnKey:String(index),heading:String(index),value:cell.value}))})),matrixSnapshot={projectId:"project",projectName:"Shop",projectPurpose:"",projectWebsite:"shop.example",generatedAt:"2026-08-17T00:00:00.000Z",title:"Client specification",incomplete:false,snapshotHash:"snapshot",sourceRevisions:{},set:{id:"set",name:"Client specification",themeId:"theme",sections:[{id:"matrix",name:"Coverage",kind:"matrix",selected:true}],templateAssignments:{"excel:matrix":matrixTemplate.id}},theme:{id:"theme",name:"Theme",clientName:"",logo:"",headerText:"",footerText:"",typography:{family:"Arial",headingSize:16,bodySize:11},colors:{heading:"#000000",accent:"#000000",stripe:"#ffffff"},density:"comfortable",borders:true,striping:true,highlightedHeadings:true,columnWidths:{}},templateDigests:{"excel:matrix":matrixDigest},templates:[matrixTemplate],tables:[{id:"matrix",title:"Coverage",headings:["Property","One","Two","Three"],rows:[],templateData:{columns:[{key:"property",heading:"Property"},{key:"1",heading:"One"},{key:"2",heading:"Two"},{key:"3",heading:"Three"}],rows:matrixRows,concepts:[],legend:""}}],diagnostics:[]};
const generated=await writeProjectDocumentationWorkbookWithTemplates(matrixSnapshot,{scope:"current",currentSectionId:"matrix"},async()=>matrixBlob),opened=new ExcelJS.Workbook();await opened.xlsx.load(generated);const generatedSheet=opened.worksheets[0];
const generatedAddresses=new Map();generatedSheet.eachRow({includeEmpty:true},row=>row.eachCell({includeEmpty:true},cell=>generatedAddresses.set(String(cell.value),cell.address)));
assert.deepEqual(["/cart","/order"].map(value=>generatedAddresses.get(value)),["A3","A5"]);
assert.equal(generatedSheet.getColumn(1).width,31);assert.equal(generatedSheet.getRow(3).height,27);
const collidingName="A very long / matrix name that collides",collidingSnapshot={...matrixSnapshot,set:{...matrixSnapshot.set,sections:[{...matrixSnapshot.set.sections[0],name:collidingName},{...matrixSnapshot.set.sections[0],id:"matrix:second",name:collidingName}]},tables:[{...matrixSnapshot.tables[0],title:collidingName},{...matrixSnapshot.tables[0],id:"matrix:second",title:collidingName}]},collidingBytes=await writeProjectDocumentationWorkbookWithTemplates(collidingSnapshot,{scope:"complete"},async()=>matrixBlob),collidingBook=new ExcelJS.Workbook();await collidingBook.xlsx.load(collidingBytes);assert.deepEqual(collidingBook.worksheets.map(({name})=>name),["A very long matrix name that co","A very long matrix name tha (2)"],"custom section names are safely and deterministically unique after truncation");

console.log("documentation Excel template unit test passed");
