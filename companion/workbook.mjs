import ExcelJS from 'exceljs';
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';

export function inspectXlsxPackage(bytes) {
  if (bytes.length>10*1024*1024) throw new Error('Workbook exceeds 10 MiB.');
  let end=-1;
  for (let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--) if(bytes.readUInt32LE(i)===0x06054b50){end=i;break;}
  if(end<0) throw new Error('Choose an unencrypted .xlsx workbook.');
  const count=bytes.readUInt16LE(end+10), offset=bytes.readUInt32LE(end+16);
  if(count>2000) throw new Error('Workbook has too many parts.');
  let cursor=offset,total=0;
  const names=new Set();
  for(let i=0;i<count;i++) {
    if(cursor+46>bytes.length || bytes.readUInt32LE(cursor)!==0x02014b50) throw new Error('Invalid workbook directory.');
    const flags=bytes.readUInt16LE(cursor+8),method=bytes.readUInt16LE(cursor+10),size=bytes.readUInt32LE(cursor+24),length=bytes.readUInt16LE(cursor+28);
    const name=bytes.subarray(cursor+46,cursor+46+length).toString();
    if(flags&1 || ![0,8].includes(method) || name.startsWith('/') || name.includes('\\') || name.split('/').includes('..') || names.has(name)) throw new Error('Unsupported workbook package.');
    if(/vbaProject|activeX|embeddings/iu.test(name)) throw new Error('Remove macros and embedded applications before import.');
    names.add(name);total+=size;
    if(total>50*1024*1024) throw new Error('Workbook expands beyond 50 MiB.');
    const local=bytes.readUInt32LE(cursor+42),compressed=bytes.readUInt32LE(cursor+20);
    if(local+30>bytes.length||bytes.readUInt32LE(local)!==0x04034b50)throw new Error('Invalid workbook part.');
    const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28);
    if(start+compressed>offset)throw new Error('Workbook part is out of bounds.');
    const data=bytes.subarray(start,start+compressed),inflated=method===8?inflateRawSync(data,{maxOutputLength:Math.max(1,size)}):data;
    if(inflated.length!==size)throw new Error('Workbook part size does not match its directory.');
    cursor+=46+length+bytes.readUInt16LE(cursor+30)+bytes.readUInt16LE(cursor+32);
  }
  return {parts:count,unpackedBytes:total};
}
function cellValue(value, findings, location) {
  if(value===null || value===undefined) return '';
  if(typeof value!=='object') return value;
  if(value instanceof Date) return value.toISOString();
  if('formula' in value || 'sharedFormula' in value) {
    findings.push(`${location}: formula was not executed; its cached result may be stale.`);
    return value.result ?? '';
  }
  if(value.richText) return value.richText.map(part=>part.text).join('');
  if(value.hyperlink) {findings.push(`${location}: hyperlink retained as text only.`);return value.text ?? value.hyperlink;}
  return JSON.stringify(value);
}
export async function inspectWorkbook(file) {
  const bytes=Buffer.from(file.base64,'base64');
  inspectXlsxPackage(bytes);
  const workbook=new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const findings=[],sheets=[];
  let cellsRead=0;
  for(const sheet of workbook.worksheets) {
    const cells=[];
    sheet.eachRow({includeEmpty:false},row=>row.eachCell({includeEmpty:false},cell=>{
      if(++cellsRead>30000) throw new Error('Workbook has more than 30,000 populated cells. Import selected sheets in smaller files.');
      cells.push({address:cell.address,value:cellValue(cell.value,findings,`${sheet.name}!${cell.address}`),
        ...(cell.fill?.fgColor?.argb?{fill:cell.fill.fgColor.argb}:{}),...(cell.font?.bold?{bold:true}:{}),
        ...(cell.note?{note:typeof cell.note==='string'?cell.note:JSON.stringify(cell.note)}:{})});
    }));
    sheets.push({name:sheet.name,state:sheet.state,rows:sheet.rowCount,columns:sheet.columnCount,merges:sheet.model.merges ?? [],cells,
      images:sheet.getImages().map(image=>({imageId:image.imageId,range:image.range}))});
  }
  return {id:file.id,name:file.name,digest:createHash('sha256').update(bytes).digest('hex'),sheets,findings};
}
