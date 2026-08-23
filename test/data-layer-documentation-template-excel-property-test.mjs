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

console.log("Excel Contract 3 parser, image layout, and separator properties passed.");
