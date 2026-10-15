import ExcelJS from 'exceljs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {validateExcelTemplatePrototype, renderExcelTemplateGrid} from '../dist/documentation-templates/excel-template.js';
import {validateExcelTemplateWorkbook} from '../dist/documentation-templates/excel-workbook.js';
globalThis.ExcelJS ??= ExcelJS;

function areaProperties(area) {
  const properties=area.properties;if(!properties)return '';
  if(area.type==='output')return `background-fill: ${properties.backgroundFill}`;
  if(area.type==='repeat')return properties.separatorArea?`separator-area: ${properties.separatorArea.name}`:'';
  return `fit: ${properties.fit}; position: ${properties.position.horizontal} ${properties.position.vertical}; padding: ${properties.padding.top}px ${properties.padding.right}px ${properties.padding.bottom}px ${properties.padding.left}px`;
}

export async function writeTemplateArtifact(directory, plan, files, sampleContext) {
  const prototype=JSON.parse(plan.prototypeJson);
  if(prototype.kind!==plan.kind || prototype.contractVersion!==3) throw new Error('Template kind and contract do not match.');
  if(!Array.isArray(prototype.cells)||prototype.cells.length>30000) throw new Error('Template cell limit exceeded.');
  const check=validateExcelTemplatePrototype(prototype);
  if(!check.valid) throw new Error(check.findings.map(item=>item.message).join('\n'));
  const file=files.find(file=>file.id===plan.fileId && !file.image);
  if(!file) throw new Error('Template source workbook is unavailable.');
  const source=new ExcelJS.Workbook();await source.xlsx.load(await readFile(file.path));
  const sourceSheet=source.getWorksheet(plan.sheet);
  if(!sourceSheet) throw new Error('Template source sheet is unavailable.');
  const output=new ExcelJS.Workbook(),sheet=output.addWorksheet('Template'),guide=output.addWorksheet('Template Guide');
  for(const cell of prototype.cells) {
    const original=sourceSheet.getCell(cell.sourceAddress ?? cell.address),target=sheet.getCell(cell.address);
    target.value=cell.value;target.style=structuredClone(original.style);
    sheet.getColumn(target.col).width=sourceSheet.getColumn(original.col).width;
    sheet.getRow(target.row).height=sourceSheet.getRow(original.row).height;
  }
  for(const merge of prototype.merges) sheet.mergeCells(merge);
  sheet.pageSetup=structuredClone(sourceSheet.pageSetup);sheet.headerFooter=structuredClone(sourceSheet.headerFooter);
  for(const area of prototype.areas) {
    output.definedNames.add(`'Template'!${area.range.split(':').map(cell=>cell.replace(/^([A-Z]+)(\d+)$/u,'$$$1$$$2')).join(':')}`,area.name);
    if(area.type==='repeat'&&area.properties?.separatorArea) {
      const separator=area.properties.separatorArea;
      output.definedNames.add(`'Template'!${separator.range.split(':').map(cell=>cell.replace(/^([A-Z]+)(\d+)$/u,'$$$1$$$2')).join(':')}`,separator.name);
    }
  }
  guide.addTable({name:'TemplateSettings',ref:'A1',headerRow:true,columns:[{name:'Setting'},{name:'Value'}],rows:[['Contract',3],['Kind',plan.kind]]});
  guide.addTable({name:'TemplateAreas',ref:'A6',headerRow:true,columns:[{name:'Area'},{name:'Type'},{name:'Source'},{name:'Direction'},{name:'Properties'}],
    rows:prototype.areas.map(area=>[area.name,area.type==='repeat'?'Repeat':area.type==='image'?'Image':'Output',area.source,area.type==='repeat'?(area.direction==='down'?'Down':'Across'):'',areaProperties(area)])});
  const generated=join(directory,'generated');await mkdir(generated,{recursive:true,mode:0o700});
  const artifact=Buffer.from(await output.xlsx.writeBuffer());
  const validation=await validateExcelTemplateWorkbook(new Blob([artifact]),plan.kind);
  if(!validation.valid)throw new Error(validation.findings.map(item=>item.message).join('\n'));
  await writeFile(join(generated,plan.id+'.xlsx'),artifact,{mode:0o600});
  let preview;
  if(sampleContext) {
    preview=renderExcelTemplateGrid(prototype,sampleContext);
    const book=new ExcelJS.Workbook(),tab=book.addWorksheet('Preview');
    for(const cell of preview.cells) {const target=tab.getCell(cell.address);target.value=cell.value;target.style=structuredClone(sheet.getCell(cell.sourceAddress ?? cell.address).style);}
    for(const merge of preview.merges)tab.mergeCells(merge);
    await writeFile(join(generated,plan.id+'-preview.xlsx'),Buffer.from(await book.xlsx.writeBuffer()),{mode:0o600});
  }
  return {byteLength:artifact.length,previewCells:preview?.cells ?? []};
}
