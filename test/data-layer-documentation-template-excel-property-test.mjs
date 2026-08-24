import assert from "node:assert/strict";

import {imageLayoutInArea,parseExcelAreaProperties,renderExcelTemplateGrid} from "../dist/documentation-templates/excel-template.js";

const canonical={fit:"contain",position:{horizontal:"25%",vertical:"75%"},padding:{top:4,right:8,bottom:12,left:16}};
const declarations=["fit: contain","position: 25% 75%","padding: 4px 8px 12px 16px"];
for(const order of [declarations,[declarations[1],declarations[2],declarations[0]],[declarations[2],declarations[0],declarations[1]]]){
  assert.deepEqual(parseExcelAreaProperties("image",`  ${order.join(" ; ").toUpperCase()} ; `),canonical,"declaration order, case, and whitespace preserve normalized image Properties");
}
for(const [raw,expected] of [["3px",[3,3,3,3]],["3px 5px",[3,5,3,5]],["3px 5px 7px",[3,5,7,5]],["3px 5px 7px 11px",[3,5,7,11]]]){
  const {padding}=parseExcelAreaProperties("image",`padding: ${raw}`);
  assert.deepEqual([padding.top,padding.right,padding.bottom,padding.left],expected,"CSS-style padding shorthand expands deterministically");
}
for(let horizontal=0;horizontal<=100;horizontal+=5)for(let vertical=0;vertical<=100;vertical+=5){
  const properties=parseExcelAreaProperties("image",`fit: contain; position: ${horizontal}% ${vertical}%; padding: 2.5px 4px 6px 8px`),layout=imageLayoutInArea({width:137,height:89},{width:40,height:20},properties);
  assert.ok(layout.left>=properties.padding.left-1e-9&&layout.top>=properties.padding.top-1e-9,"position never crosses the leading padded edge");
  assert.ok(layout.left+layout.width<=137-properties.padding.right+1e-9&&layout.top+layout.height<=89-properties.padding.bottom+1e-9,"position never crosses the trailing padded edge");
}
for(const raw of ["fit contain","unknown: value","fit: contain; fit: scale-down","position: 101% 0%","position: -1% 50%","padding: -1px","padding: 1px 2px 3px 4px 5px"])assert.throws(()=>parseExcelAreaProperties("image",raw),undefined,`malformed Properties fail closed: ${raw}`);

const column=(number)=>{let result="";for(let value=number;value;value=Math.floor((value-1)/26))result=String.fromCharCode(65+(value-1)%26)+result;return result;};
for(const direction of ["across","down"])for(let count=0;count<=20;count+=1){
  const across=direction==="across",prototype={kind:"flow",contractVersion:3,worksheetName:"Template",cells:across?[{address:"A1",value:"{{page.pageName}}"},{address:"B1",value:">>"},{address:"C1",value:"tail"}]:[{address:"A1",value:"{{page.pageName}}"},{address:"A2",value:">>"},{address:"A3",value:"tail"}],areas:[{name:"PageStep",type:"repeat",source:"flow.pages",direction,range:across?"A1:B1":"A1:A2",properties:{separatorArea:{name:"PageSeparator",range:across?"B1:B1":"A2:A2"}}}],merges:[]},before=structuredClone(prototype),pages=Array.from({length:count},(_,index)=>({pageName:`Page ${index+1}`})),rendered=renderExcelTemplateGrid(prototype,{section:{name:"Flow",kind:"flow"},flow:{pages}}),separators=rendered.cells.filter(({value})=>value===">>"),items=rendered.cells.filter(({value})=>String(value).startsWith("Page ")),tail=rendered.cells.find(({value})=>value==="tail");
  assert.equal(items.length,count,"repeat rendering conserves item cardinality");
  assert.equal(separators.length,Math.max(count-1,0),"separator cardinality is max(items - 1, 0)");
  assert.equal(tail.address,across?`${column(count?count*2:1)}1`:`A${count?count*2:1}`,"later content shifts by exact item plus separator growth");
  assert.deepEqual(prototype,before,"repeat rendering leaves authored definitions immutable");
}

let outputSeed=0x51a9e7d3;const outputRandom=()=>{outputSeed=(Math.imul(outputSeed,1664525)+1013904223)>>>0;return outputSeed;};
for(let sample=0;sample<120;sample+=1){
  const pageCount=1+outputRandom()%9,rowCounts=Array.from({length:pageCount},()=>1+outputRandom()%7),pages=rowCounts.map((rowCount,pageIndex)=>({pageName:`Page ${pageIndex+1}`,rows:Array.from({length:rowCount},(_,rowIndex)=>({property:`/${pageIndex}/${rowIndex}`}))})),prototype={kind:"flow",contractVersion:3,worksheetName:"Template",cells:[{address:"A1",value:"{{page.pageName}}"},{address:"A3",value:"{{row.property}}"},{address:"B1",value:""},{address:"B2",value:">>"},{address:"B3",value:""},{address:"D5",value:"",style:{fill:{type:"pattern",pattern:"solid",fgColor:{argb:"FFFF0000"}}}}],areas:[{name:"PageStep",type:"repeat",source:"flow.pages",direction:"across",range:"A1:B3",properties:{separatorArea:{name:"PageSeparator",range:"B1:B3"}}},{name:"PropertyValue",type:"repeat",source:"page.rows",direction:"down",range:"A3:A3"},{name:"OutputCanvas",type:"output",source:"",range:"A1:C4",properties:parseExcelAreaProperties("output",sample%2?" BACKGROUND-FILL : #fFfFfF ; ":"background-fill:#FFFFFF")}],merges:[]},before=structuredClone(prototype),rendered=renderExcelTemplateGrid(prototype,{section:{name:"Flow",kind:"flow"},flow:{pages}}),maximumRows=Math.max(...rowCounts),expectedRight=pageCount*2,expectedBottom=3+maximumRows,projectedSeparatorCells=rendered.cells.filter(({sourceAddress})=>/^B[1-3]$/u.test(sourceAddress??""));
  assert.deepEqual(rendered.output,{range:`A1:${column(expectedRight)}${expectedBottom}`,backgroundFill:"#FFFFFF",cellCount:expectedRight*expectedBottom},"Output bounds conserve every randomized nested delta and authored margin");
  assert.equal(projectedSeparatorCells.length,rowCounts.slice(0,-1).reduce((sum,count)=>sum+2+count,0),"every separator presentation projects through the preceding randomized nested height");
  assert.equal(projectedSeparatorCells.filter(({value})=>value===">>").length,pageCount-1,"separator literals remain one-per-gap under randomized nested expansion");
  assert.equal(rendered.cells.some(({sourceAddress})=>sourceAddress==="D5"),false,"styled blanks outside Output never affect randomized geometry or copied cells");
  assert.deepEqual(prototype,before,"generated presentation rendering does not mutate Output or repeat definitions");
}

console.log("Excel Contract 3 parser, image layout, separator, and Output properties passed.");
