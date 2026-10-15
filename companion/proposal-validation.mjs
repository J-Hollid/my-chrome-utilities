function point(address) {
  const match=/^\$?([A-Z]{1,3})\$?([1-9]\d{0,6})$/u.exec(address);
  if(!match)throw new Error(`Invalid source cell ${address}.`);
  return {column:[...match[1]].reduce((sum,char)=>sum*26+char.charCodeAt(0)-64,0),row:Number(match[2])};
}
function bounds(range) {
  const pieces=range.split(':');if(pieces.length>2)throw new Error('Use a cell range for source coverage.');
  const start=point(pieces[0]),end=point(pieces[1]??pieces[0]);
  if(start.column>end.column||start.row>end.row)throw new Error('Invalid source range order.');
  return {start,end};
}
const contains=(range,cell)=>cell.column>=range.start.column&&cell.column<=range.end.column&&cell.row>=range.start.row&&cell.row<=range.end.row;
export function validateSourceReads(workbooks,calls) {
  for(const workbook of workbooks)for(const sheet of workbook.sheets) {
    const reads=calls.filter(call=>call.tool==='read_sheet'&&call.status==='completed'&&call.input?.fileId===workbook.id&&call.input.sheet===sheet.name);
    const unread=sheet.cells.find(cell=>!reads.some(call=>{const row=point(cell.address).row;return row>=call.input.startRow&&row<=call.input.endRow;}));
    if(unread)throw new Error(`The agent did not read ${workbook.name} / ${sheet.name}!${unread.address} through MCP. Check the companion tool settings, then request a revision.`);
  }
}
export function validateSourceCoverage(proposal,workbooks,mode) {
  if(mode==='template'&&proposal.changes.length)throw new Error('A template task cannot change project definitions.');
  if(mode==='import'&&proposal.templates.length)throw new Error('An import task cannot create export templates.');
  for(const reference of [...proposal.coverage,...proposal.changes.flatMap(change=>change.sources)]) {
    const sheet=workbooks.find(file=>file.id===reference.fileId)?.sheets.find(sheet=>sheet.name===reference.sheet);
    if(!sheet)throw new Error('The proposal refers to an unknown source sheet.');
    bounds(reference.range);
  }
  for(const workbook of workbooks)for(const sheet of workbook.sheets) {
    const entries=proposal.coverage.filter(entry=>entry.fileId===workbook.id&&entry.sheet===sheet.name).map(entry=>bounds(entry.range));
    const uncovered=sheet.cells.filter(cell=>!entries.some(range=>contains(range,point(cell.address))));
    if(uncovered.length)throw new Error(`Source coverage is incomplete: ${workbook.name} / ${sheet.name}!${uncovered[0].address}. Request a revision that accounts for all source cells.`);
  }
}
