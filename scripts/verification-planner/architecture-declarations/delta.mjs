import {isDeepStrictEqual} from 'node:util';
import {isRepositoryPath} from '../../verification-ownership-paths.mjs';

export const declarationPath='architecture/data-layer-boundaries.json';
const modules=new Set(['capture','live-inspection','event-library','schemas','defect-reporting','replay','flow-graph']);
const sourcePath=(value)=>typeof value==='string'&&value.startsWith('src/')&&
 value.endsWith('.ts')&&isRepositoryPath(value);
const record=(value)=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function validDeclarations(value) {
 return record(value)&&Object.entries(value).every(([file,entry])=>sourcePath(file)&&record(entry)&&
  Object.keys(entry).every(key=>['module','layer','contracts'].includes(key))&&modules.has(entry.module)&&
  ['core','application','browser'].includes(entry.layer)&&(entry.contracts===undefined||
   Array.isArray(entry.contracts)&&entry.contracts.every(sourcePath)&&
   new Set(entry.contracts).size===entry.contracts.length));
}

// Each path enters the queue once, including cyclic contract graphs.
export function declarationDelta(base,candidate) {
 if(!validDeclarations(base)||!validDeclarations(candidate))return null;
 const changed=Object.keys({...base,...candidate}).filter(file=>!isDeepStrictEqual(base[file],candidate[file]));
 const paths=new Set(changed),queue=[...changed];
 const reverse=new Map();
 for(const declarations of [base,candidate])for(const [file,entry] of Object.entries(declarations)) {
  for(const dependency of entry.contracts??[]) {
   if(!reverse.has(dependency))reverse.set(dependency,new Set());
   reverse.get(dependency).add(file);
  }
 }
 const add=file=>{if(!paths.has(file)){paths.add(file);queue.push(file);}};
 for(let index=0;index<queue.length;index+=1) {
  const file=queue[index];
  for(const declarations of [base,candidate])for(const dependency of declarations[file]?.contracts??[])add(dependency);
  for(const consumer of reverse.get(file)??[])add(consumer);
 }
 return {paths:[...paths].sort(),changed:changed.sort()};
}
