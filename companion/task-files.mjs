import {mkdir, writeFile, readFile, rename} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {inspectWorkbook} from './workbook.mjs';

export const safeId=value=>typeof value==='string' && /^[a-zA-Z0-9_-]{1,100}$/u.test(value);
export async function writeJson(path,value) {
  const temporary=path+'.'+randomUUID()+'.new';
  await writeFile(temporary,JSON.stringify(value,null,2)+'\n',{mode:0o600});
  await rename(temporary,path);
}
export async function readJson(path) {return JSON.parse(await readFile(path,'utf8'));}
export async function prepareTaskFiles(directory,request) {
  await mkdir(join(directory,'files'),{recursive:true,mode:0o700});
  const files=[],workbooks=[],findings=[];
  let total=0;
  const ids=new Set();
  for(const file of request.files) {
    if(!safeId(file.id) || ids.has(file.id) || typeof file.base64!=='string' || !/^[A-Za-z0-9+/]*={0,2}$/u.test(file.base64)) throw new Error('Invalid file identity or encoding.');
    ids.add(file.id);
    const bytes=Buffer.from(file.base64,'base64');total+=bytes.length;
    if(bytes.length>10*1024*1024 || total>25*1024*1024) throw new Error('Use files below 10 MiB each and 25 MiB total.');
    const workbook=file.name.toLowerCase().endsWith('.xlsx');
    const image=file.mediaType==='image/png' && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png'
      :file.mediaType==='image/jpeg' && bytes[0]===255 && bytes[1]===216 && bytes[2]===255 ? 'jpg'
      :file.mediaType==='image/webp' && bytes.subarray(0,4).toString()==='RIFF' && bytes.subarray(8,12).toString()==='WEBP' ? 'webp' : undefined;
    if(!workbook && !image) throw new Error('Choose .xlsx, PNG, JPEG, or WebP files.');
    const path=join(directory,'files',file.id+'.'+(workbook?'xlsx':image));
    await writeFile(path,bytes,{mode:0o600});
    files.push({id:file.id,name:file.name,mediaType:file.mediaType,path,digest:createHash('sha256').update(bytes).digest('hex'),image:Boolean(image)});
    if(workbook) {const inspected=await inspectWorkbook(file);workbooks.push(inspected);findings.push(...inspected.findings);}
  }
  await writeJson(join(directory,'workbooks.json'),workbooks);
  await writeJson(join(directory,'context.json'),request.context);
  await writeJson(join(directory,'files.json'),files);
  return {files,workbook:{files:workbooks.map(({id,name,sheets})=>({id,name,sheets:sheets.map(({name,rows,columns})=>({name,rows,columns}))})),findings}};
}
