import {mkdir,writeFile} from "node:fs/promises";
import {dirname,resolve} from "node:path";

import ExcelJS from "exceljs";

const outputPath=resolve(process.argv[2]??"artifacts/templates/flow-property-values-template.xlsx");
const workbook=new ExcelJS.Workbook();
workbook.creator="Twatility";
workbook.title="Flow property values template";

const template=workbook.addWorksheet("Template",{
  views:[{state:"frozen",xSplit:1,ySplit:3}],
  pageSetup:{orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0},
});

template.getCell("A1").value="{{section.name}}";
template.getCell("A1").font={name:"Arial",size:18,bold:true,color:{argb:"FF17324D"}};
template.getCell("A1").alignment={vertical:"middle"};
template.getRow(1).height=28;

template.getCell("A3").value="Property";
template.getCell("B3").value="{{column.heading}}";
template.getCell("A4").value="{{row.property}}";
template.getCell("B4").value="{{cell.value}}";

const headerStyle={
  font:{name:"Arial",size:11,bold:true,color:{argb:"FFFFFFFF"}},
  fill:{type:"pattern",pattern:"solid",fgColor:{argb:"FF245B78"}},
  alignment:{vertical:"middle",horizontal:"left",wrapText:true},
  border:{
    top:{style:"thin",color:{argb:"FFB8C5CE"}},
    left:{style:"thin",color:{argb:"FFB8C5CE"}},
    bottom:{style:"thin",color:{argb:"FFB8C5CE"}},
    right:{style:"thin",color:{argb:"FFB8C5CE"}},
  },
};
const propertyStyle={
  font:{name:"Arial",size:10,bold:true,color:{argb:"FF17324D"}},
  fill:{type:"pattern",pattern:"solid",fgColor:{argb:"FFEAF1F5"}},
  alignment:{vertical:"top",wrapText:true},
  border:{
    top:{style:"thin",color:{argb:"FFD4DDE3"}},
    left:{style:"thin",color:{argb:"FFD4DDE3"}},
    bottom:{style:"thin",color:{argb:"FFD4DDE3"}},
    right:{style:"thin",color:{argb:"FFD4DDE3"}},
  },
};
const valueStyle={
  font:{name:"Arial",size:10,color:{argb:"FF1F2933"}},
  alignment:{vertical:"top",wrapText:true},
  border:{
    top:{style:"thin",color:{argb:"FFD4DDE3"}},
    left:{style:"thin",color:{argb:"FFD4DDE3"}},
    bottom:{style:"thin",color:{argb:"FFD4DDE3"}},
    right:{style:"thin",color:{argb:"FFD4DDE3"}},
  },
};

template.getCell("A3").style=structuredClone(headerStyle);
template.getCell("B3").style=structuredClone(headerStyle);
template.getCell("A4").style=structuredClone(propertyStyle);
template.getCell("B4").style=structuredClone(valueStyle);
template.getRow(3).height=38;
template.getRow(4).height=34;
template.getColumn("A").width=34;
template.getColumn("B").width=30;
template.autoFilter="A3:B3";

workbook.definedNames.add("'Template'!$B$3","FlowColumnHeader");
workbook.definedNames.add("'Template'!$A$4:$B$4","PropertyRow");
workbook.definedNames.add("'Template'!$B$4","PropertyValue");

const guide=workbook.addWorksheet("Template Guide");
guide.getCell("A1").value="Flow property values template";
guide.getCell("A1").font={name:"Arial",size:16,bold:true};
guide.getCell("A2").value="The first column repeats configured properties. Flow columns repeat from left to right, with each value rendered beneath its named page or context.";
guide.getCell("A3").value="Keep all three named ranges and the TemplateAreas rows intact. You may change formatting, widths, labels, and surrounding static content.";
guide.getCell("A4").value="FlowColumnHeader and PropertyValue stay aligned because flow.columns and every row.cells collection use the same configured context order.";
guide.getColumn("A").width=115;

guide.addTable({
  name:"TemplateSettings",
  ref:"A6",
  headerRow:true,
  style:{theme:"TableStyleMedium2",showRowStripes:true},
  columns:[{name:"Setting"},{name:"Value"}],
  rows:[["Contract",2],["Kind","flow"]],
});
guide.addTable({
  name:"TemplateAreas",
  ref:"A11",
  headerRow:true,
  style:{theme:"TableStyleMedium2",showRowStripes:true},
  columns:[{name:"Area"},{name:"Type"},{name:"Source"},{name:"Direction"}],
  rows:[
    ["FlowColumnHeader","Repeat","flow.columns","Across"],
    ["PropertyRow","Repeat","flow.rows","Down"],
    ["PropertyValue","Repeat","row.cells","Across"],
  ],
});
guide.getColumn("B").width=22;
guide.getColumn("C").width=24;
guide.getColumn("D").width=18;

await mkdir(dirname(outputPath),{recursive:true});
await writeFile(outputPath,new Uint8Array(await workbook.xlsx.writeBuffer()));
console.log(outputPath);
