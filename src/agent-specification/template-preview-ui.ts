import {element} from "./ui-elements.js";
import {record} from "./contract.js";

export function templatePreview(value:unknown):HTMLElement {
  const panel=element("section");panel.append(element("h3","Export preview"));
  if(!record(value)||!Array.isArray(value.previewCells))return panel;
  const cells=new Map<string,string>();let rows=0,columns=0;
  for(const cell of value.previewCells) {
    if(!record(cell)||typeof cell.address!=="string")continue;
    const match=/^([A-Z]+)(\d+)$/u.exec(cell.address);if(!match)continue;
    const row=Number(match[2]),column=[...match[1]!].reduce((value,char)=>value*26+char.charCodeAt(0)-64,0);
    rows=Math.max(rows,row);columns=Math.max(columns,column);cells.set(`${row}:${column}`,String(cell.value??""));
  }
  const table=element("table");table.setAttribute("aria-label","Rendered export cells");
  for(let row=1;row<=Math.min(rows,200);row++) {
    const line=element("tr");line.append(element("th",String(row)));
    for(let column=1;column<=Math.min(columns,30);column++)line.append(element("td",cells.get(`${row}:${column}`)??""));
    table.append(line);
  }
  panel.append(table,element("p","This preview shows the exported values. Download the preview workbook to check cell styles and merged cells."));
  if(rows>200||columns>30)panel.append(element("p","The screen shows the first 200 rows and 30 columns. The preview workbook contains the full result."));
  return panel;
}
