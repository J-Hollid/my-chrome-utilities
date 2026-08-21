import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import JSZip from "jszip";

import {
  excelTemplateGuideFor,
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
const enclosingMerge={...prototype,areas:[{name:"PageCard",type:"repeat",source:"flow.pages",direction:"across",range:"B2:C3"}],merges:["A1:D4"]};
assert.match(validateExcelTemplatePrototype(enclosingMerge).findings.map(({message})=>message).join("\n"),/[Mm]erged range A1:D4.*PageCard/u,"a merge may not enclose a repeat area");

const workbook=new ExcelJS.Workbook(),worksheet=workbook.addWorksheet("Template"),guide=workbook.addWorksheet("Template Guide");
worksheet.getCell("A1").value="{{project.name}}";
guide.addTable({name:"TemplateSettings",ref:"A1",headerRow:true,columns:[{name:"Setting"},{name:"Value"}],rows:[["Contract",2],["Kind","flow"]]});
guide.addTable({name:"TemplateAreas",ref:"A6",headerRow:true,columns:[{name:"Area"},{name:"Type"},{name:"Source"},{name:"Direction"}],rows:[]});
const workbookBytes=await workbook.xlsx.writeBuffer(),validated=await validateExcelTemplateWorkbook(new Blob([workbookBytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),"flow");
assert.equal(validated.valid,true,validated.findings.map(({message})=>message).join("\n"));
assert.equal(validated.kind,"flow");
assert.equal(validated.contractVersion,2);
assert.deepEqual(validated.inspection.bindings,[{cell:"A1",path:"project.name"}],"inspection preserves the editable cell location for every binding");

const printerSettingsContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.printerSettings",printerSettingsRelationshipType="http://schemas.openxmlformats.org/officeDocument/2006/relationships/printerSettings";
async function withPrinterSettings(bytes,{worksheet="Template",part="xl/printerSettings/printerSettings1.bin",contentType=printerSettingsContentType,relationshipType=printerSettingsRelationshipType,relationshipTarget,targetMode,includePart=true,includeRelationship=true,duplicateRelationship=false}={}){
  const zip=await JSZip.loadAsync(bytes),sheetNumber=worksheet==="Template"?1:worksheet==="Template Guide"?2:undefined,relationshipName=sheetNumber?`xl/worksheets/_rels/sheet${sheetNumber}.xml.rels`:"xl/_rels/workbook.xml.rels",contentTypes=await zip.file("[Content_Types].xml").async("string"),partName=`/${part}`;
  if(includePart){zip.file("[Content_Types].xml",contentTypes.replace("</Types>",`<Override PartName="${partName}" ContentType="${contentType}"/></Types>`));zip.file(part,new Uint8Array([0x00,0x01,0x50,0x53,0xff]));}
  if(includeRelationship){
    const target=relationshipTarget??(sheetNumber?`../printerSettings/${part.split("/").at(-1)}`:`printerSettings/${part.split("/").at(-1)}`),mode=targetMode?` TargetMode="${targetMode}"`:"",relationships=[`<Relationship Id="rIdPrinterSettings" Type="${relationshipType}" Target="${target}"${mode}/>`];
    if(duplicateRelationship)relationships.push(`<Relationship Id="rIdPrinterSettingsDuplicate" Type="${relationshipType}" Target="${target}"/>`);
    const existingRelationships=zip.file(relationshipName)?await zip.file(relationshipName).async("string"):'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
    zip.file(relationshipName,existingRelationships.replace("</Relationships>",`${relationships.join("")}</Relationships>`));
    if(sheetNumber){const sheetName=`xl/worksheets/sheet${sheetNumber}.xml`,sheet=await zip.file(sheetName).async("string"),related=sheet.includes("<pageSetup")?sheet.replace("<pageSetup",'<pageSetup r:id="rIdPrinterSettings"'):sheet.replace("</worksheet>",'<pageSetup r:id="rIdPrinterSettings"/></worksheet>');zip.file(sheetName,related);}
  }
  return zip.generateAsync({type:"uint8array",compression:"DEFLATE"});
}
for(const sample of [
  {worksheet:"Template",part:"xl/printerSettings/printerSettings1.bin"},
  {worksheet:"Template Guide",part:"xl/printerSettings/printerSettings27.bin"},
]){
  const bytes=await withPrinterSettings(workbookBytes,sample),result=await validateExcelTemplateWorkbook(new Blob([bytes]),"flow");
  assert.equal(result.valid,true,`${sample.worksheet} standard printer settings: ${result.findings.map(({location,message})=>`${location}: ${message}`).join("\n")}`);
}
for(const [label,options] of [
  ["unrecognized binary content",{contentType:"application/octet-stream"}],
  ["nonstandard printer-settings part name",{part:"xl/printerSettings/device.bin"}],
  ["unrelated binary relationship",{relationshipType:"http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject"}],
  ["missing printer-settings relationship",{includeRelationship:false}],
  ["external printer-settings relationship",{targetMode:"External"}],
  ["printer settings related from an unapproved package source",{worksheet:"Workbook"}],
  ["ambiguous printer-settings relationships",{duplicateRelationship:true}],
  ["printer-settings relationship targeting a non-printer part",{includePart:false,relationshipTarget:"../styles.xml"}],
]){
  const bytes=await withPrinterSettings(workbookBytes,options),result=await validateExcelTemplateWorkbook(new Blob([bytes]),"flow");
  assert.equal(result.valid,false,label);
  assert.match(result.findings.map(({location,message})=>`${location}: ${message}`).join("\n"),/printer|binary|macro|active|unsupported/iu,label);
}

const labelledZip=await JSZip.loadAsync(workbookBytes),contentTypes=await labelledZip.file("[Content_Types].xml").async("string"),relationships=await labelledZip.file("_rels/.rels").async("string"),labelId="2f5f16bb-bf25-4d92-9fce-87f9a2dd4e76";labelledZip.file("[Content_Types].xml",contentTypes.replace("</Types>",'<Override PartName="/docProps/custom.xml" ContentType="application/vnd.openxmlformats-officedocument.custom-properties+xml"/></Types>'));labelledZip.file("_rels/.rels",relationships.replace("</Relationships>",'<Relationship Id="purviewCustomProperties" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" Target="docProps/custom.xml"/></Relationships>'));labelledZip.file("docProps/custom.xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="MSIP_Label_${labelId}_Enabled"><vt:lpwstr>true</vt:lpwstr></property><property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="3" name="MSIP_Label_${labelId}_Name"><vt:lpwstr>Confidential</vt:lpwstr></property><property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="4" name="Sensitivity"><vt:lpwstr>3</vt:lpwstr></property></Properties>`);const labelledBytes=await labelledZip.generateAsync({type:"uint8array",compression:"DEFLATE"}),labelledValidation=await validateExcelTemplateWorkbook(new Blob([labelledBytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),"flow"),reopenedLabelled=await JSZip.loadAsync(labelledBytes),labelXml=await reopenedLabelled.file("docProps/custom.xml").async("string");assert.equal(labelledValidation.valid,true,labelledValidation.findings.map(({message})=>message).join("\n"));assert.match(labelXml,/MSIP_Label_.*_Enabled/u);assert.match(labelXml,/<vt:lpwstr>Confidential<\/vt:lpwstr>/u,"non-encrypting Purview custom properties remain inert package metadata in the exact selected bytes");

const legacyBook=new ExcelJS.Workbook(),legacySheet=legacyBook.addWorksheet("Template");legacySheet.getCell("A1").note='tw:template(kind="flow" contract="1")';const legacyBytes=await legacyBook.xlsx.writeBuffer(),legacy=await validateExcelTemplateWorkbook(new Blob([legacyBytes]),"flow");assert.equal(legacy.valid,false);assert.match(legacy.findings.map(({message})=>message).join("\n"),/guided starter/u,"worksheet Notes never declare current template behavior");

const activeBytes=await writeDocumentationTemplateStarter("flow"),activeBook=new ExcelJS.Workbook();await activeBook.xlsx.load(activeBytes);activeBook.getWorksheet("Template").getCell("A1").value={formula:"1+1"};activeBook.getWorksheet("Template").getCell("E1").value={text:"External workbook",hyperlink:"https://example.test/source.xlsx"};const activeValidation=await validateExcelTemplateWorkbook(new Blob([await activeBook.xlsx.writeBuffer()]),"flow"),formulaFinding=activeValidation.findings.find(({location})=>location==="Template A1"),relationshipFinding=activeValidation.findings.find(({location})=>location.includes("relationship"));assert.ok(formulaFinding,"formula finding identifies its Template cell");assert.ok(relationshipFinding,"external content finding identifies its relationship part");for(const finding of [formulaFinding,relationshipFinding]){assert.match(finding.rule,/formulas.*external workbook/iu);assert.match(finding.repair,/literal text.*remove active or external workbook content/iu);assert.ok(finding.technical,"active-content details remain available to the collapsed UI control");}

for(const kind of ["overview","flow","matrix","profile"]){
  const starter=await writeDocumentationTemplateStarter(kind),openedStarter=new ExcelJS.Workbook();await openedStarter.xlsx.load(starter);assert.deepEqual(openedStarter.worksheets.map(sheet=>sheet.name),["Template","Template Guide"]);assert.equal(openedStarter.getWorksheet("Template Guide").state,"visible");assert.equal(openedStarter.getWorksheet("Template Guide").getCell("B6").value,2);assert.ok(openedStarter.getWorksheet("Template Guide").getTable("TemplateAreas"));const guideText=[];openedStarter.getWorksheet("Template Guide").eachRow({includeEmpty:true},row=>row.eachCell({includeEmpty:true},cell=>guideText.push(String(cell.value??""))));const joinedGuide=guideText.join("\n"),catalogue=excelTemplateGuideFor(kind);for(const entry of catalogue.values)for(const value of [entry.placeholder,entry.meaning,entry.example,entry.available])assert.ok(joinedGuide.includes(value),`${kind} starter explains ${entry.path} ${value}`);for(const entry of catalogue.collections)for(const value of [entry.path,entry.meaning,entry.itemPrefix,...entry.fields,...entry.nestedCollections,...entry.directions,entry.emptyResult,entry.copyBehavior])assert.ok(joinedGuide.includes(value),`${kind} starter explains ${entry.path} ${value}`);const result=await validateExcelTemplateWorkbook(new Blob([starter],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),kind);
  assert.equal(result.valid,true,`${kind} starter: ${result.findings.map(({location,message})=>`${location}: ${message}`).join("\n")}`);
}

const matrixBook=new ExcelJS.Workbook(),matrixSheet=matrixBook.addWorksheet("Template"),matrixGuide=matrixBook.addWorksheet("Template Guide");
matrixSheet.getCell("A1").value="{{section.name}}";matrixSheet.getCell("A3").value="{{row.property}}";matrixSheet.getCell("B3").value="{{cell.value}}";matrixSheet.getColumn(1).width=31;matrixSheet.getColumn(3).width=37;matrixSheet.getRow(3).height=27;matrixSheet.getRow(4).height=42;matrixBook.definedNames.add("'Template'!$A$3:$C$4","RowPattern");matrixBook.definedNames.add("'Template'!$B$3:$C$3","CellPattern");matrixGuide.addTable({name:"TemplateSettings",ref:"A1",headerRow:true,columns:[{name:"Setting"},{name:"Value"}],rows:[["Contract",2],["Kind","matrix"]]});matrixGuide.addTable({name:"TemplateAreas",ref:"A6",headerRow:true,columns:[{name:"Area"},{name:"Type"},{name:"Source"},{name:"Direction"}],rows:[["RowPattern","Repeat","matrix.rows","Down"],["CellPattern","Repeat","row.cells","Across"]]});
const matrixBytes=await matrixBook.xlsx.writeBuffer(),matrixBlob=new Blob([matrixBytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),matrixDigest="sha256:matrix",matrixTemplate={id:"template:matrix",name:"Matrix",format:"excel",kind:"matrix",contractVersion:2,digest:matrixDigest,body:{assetId:"asset:matrix",digest:matrixDigest,byteLength:matrixBlob.size},validation:{valid:true,findings:[]}},matrixRows=nestedContext.matrix.rows.map(row=>({...row,concept:"",cells:row.cells.map((cell,index)=>({columnKey:String(index),heading:String(index),value:cell.value}))})),matrixSnapshot={projectId:"project",projectName:"Shop",projectPurpose:"",projectWebsite:"shop.example",generatedAt:"2026-08-17T00:00:00.000Z",title:"Client specification",incomplete:false,snapshotHash:"snapshot",sourceRevisions:{},set:{id:"set",name:"Client specification",themeId:"theme",sections:[{id:"matrix",name:"Coverage",kind:"matrix",selected:true}],templateAssignments:{"excel:matrix":matrixTemplate.id}},theme:{id:"theme",name:"Theme",clientName:"",logo:"",headerText:"",footerText:"",typography:{family:"Arial",headingSize:16,bodySize:11},colors:{heading:"#000000",accent:"#000000",stripe:"#ffffff"},density:"comfortable",borders:true,striping:true,highlightedHeadings:true,columnWidths:{}},templateDigests:{"excel:matrix":matrixDigest},templates:[matrixTemplate],tables:[{id:"matrix",title:"Coverage",headings:["Property","One","Two","Three"],rows:[],templateData:{columns:[{key:"property",heading:"Property"},{key:"1",heading:"One"},{key:"2",heading:"Two"},{key:"3",heading:"Three"}],rows:matrixRows,concepts:[],legend:""}}],diagnostics:[]};
const generated=await writeProjectDocumentationWorkbookWithTemplates(matrixSnapshot,{scope:"current",currentSectionId:"matrix"},async()=>matrixBlob),opened=new ExcelJS.Workbook();await opened.xlsx.load(generated);const generatedSheet=opened.worksheets[0];
const generatedAddresses=new Map();generatedSheet.eachRow({includeEmpty:true},row=>row.eachCell({includeEmpty:true},cell=>generatedAddresses.set(String(cell.value),cell.address)));
assert.deepEqual(["/cart","/order"].map(value=>generatedAddresses.get(value)),["A3","A5"]);
assert.equal(generatedSheet.getColumn(1).width,31);assert.equal(generatedSheet.getRow(3).height,27);assert.equal(generatedSheet.getRow(4).height,42,"blank formatted row height is preserved");assert.equal(generatedSheet.getRow(6).height,42,"blank formatted row height is preserved in every repeat");for(const column of [3,5,7])assert.equal(generatedSheet.getColumn(column).width,37,"blank formatted column width is preserved in nested repeats");
const collidingName="A very long / matrix name that collides",collidingSnapshot={...matrixSnapshot,set:{...matrixSnapshot.set,sections:[{...matrixSnapshot.set.sections[0],name:collidingName},{...matrixSnapshot.set.sections[0],id:"matrix:second",name:collidingName}]},tables:[{...matrixSnapshot.tables[0],title:collidingName},{...matrixSnapshot.tables[0],id:"matrix:second",title:collidingName}]},collidingBytes=await writeProjectDocumentationWorkbookWithTemplates(collidingSnapshot,{scope:"complete"},async()=>matrixBlob),collidingBook=new ExcelJS.Workbook();await collidingBook.xlsx.load(collidingBytes);assert.deepEqual(collidingBook.worksheets.map(({name})=>name),["A very long matrix name that co","A very long matrix name tha (2)"],"custom section names are safely and deterministically unique after truncation");

const movedBook=new ExcelJS.Workbook(),movedSheet=movedBook.addWorksheet("Template"),movedGuide=movedBook.addWorksheet("Template Guide");movedSheet.getCell("E10").value="{{row.property}}";movedSheet.getCell("F10").value="{{cell.value}}";movedBook.definedNames.add("'Template'!$E$10:$G$11","RowPattern");movedBook.definedNames.add("'Template'!$F$10:$G$10","CellPattern");movedGuide.addTable({name:"TemplateSettings",ref:"A1",headerRow:true,columns:[{name:"Setting"},{name:"Value"}],rows:[["Contract",2],["Kind","matrix"]]});movedGuide.addTable({name:"TemplateAreas",ref:"A6",headerRow:true,columns:[{name:"Area"},{name:"Type"},{name:"Source"},{name:"Direction"}],rows:[["RowPattern","Repeat","matrix.rows","Down"],["CellPattern","Repeat","row.cells","Across"]]});const movedBytes=await movedBook.xlsx.writeBuffer(),movedValidation=await validateExcelTemplateWorkbook(new Blob([movedBytes]),"matrix");assert.equal(movedValidation.valid,true);assert.deepEqual(movedValidation.inspection.bindings,[{cell:"E10",path:"row.property"},{cell:"F10",path:"cell.value"}]);assert.deepEqual(movedValidation.inspection.areas.map(({name,range,parent})=>({name,range,parent})),[{name:"RowPattern",range:"E10:G11",parent:undefined},{name:"CellPattern",range:"F10:G10",parent:"RowPattern"}],"cut/pasted complete areas retain geometry, nesting, and binding locations after Excel round-trip");

const flowStarter=await writeDocumentationTemplateStarter("flow"),flowBlob=new Blob([flowStarter],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),flowDigest="sha256:flow-logo",flowTemplate={id:"template:flow-logo",name:"Flow logo",format:"excel",kind:"flow",contractVersion:2,digest:flowDigest,body:{assetId:"asset:flow-logo",digest:flowDigest,byteLength:flowBlob.size},validation:{valid:true,findings:[]}},flowSection={id:"flow",name:"Journey",kind:"flow",selected:true},flowTable={id:"flow",title:"Journey",headings:[],rows:[],templateData:{name:"Journey",pages:[],columns:[],rows:[]}},logo="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+XkZ8WQAAAABJRU5ErkJggg==",flowSnapshot={...matrixSnapshot,set:{...matrixSnapshot.set,sections:[flowSection],templateAssignments:{"excel:flow":flowTemplate.id}},theme:{...matrixSnapshot.theme,logo},templateDigests:{"excel:flow":flowDigest},templates:[flowTemplate],tables:[flowTable]},logoOutput=await writeProjectDocumentationWorkbookWithTemplates(flowSnapshot,{scope:"current",currentSectionId:"flow"},async()=>flowBlob),logoBook=new ExcelJS.Workbook();await logoBook.xlsx.load(logoOutput);assert.equal(logoBook.worksheets[0].getImages().length,1,"theme logo renders into an otherwise empty named image area");const noLogoOutput=await writeProjectDocumentationWorkbookWithTemplates({...flowSnapshot,theme:{...flowSnapshot.theme,logo:""}},{scope:"current",currentSectionId:"flow"},async()=>flowBlob),noLogoBook=new ExcelJS.Workbook();await noLogoBook.xlsx.load(noLogoOutput);assert.equal(noLogoBook.worksheets[0].getImages().length,0,"empty theme logo leaves the named image area empty");

console.log("documentation Excel template unit test passed");
