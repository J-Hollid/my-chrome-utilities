import ExcelJS from 'exceljs';
import {createSpecificationProject} from '../dist/data-layer-specification-project.js';
export function project() {let sequence=0;return createSpecificationProject({name:'Agent test',site:'example.test',id:kind=>`${kind}-${++sequence}`});}
export const change=(id,kind,name,data={},extra={})=>({id,kind,name,recordJson:JSON.stringify(data),action:'create',targetId:null,reason:'Test proposal',sources:[],dependsOn:[],questions:[],...extra});
export const proposal=changes=>({summary:'Review this specification.',changes,templates:[],coverage:[],questions:[]});
export function review(state,changes,extra={}) {return {taskId:'test-task',projectId:state.project.id,baseRevision:1,baseProject:structuredClone(state.project),proposal:proposal(changes),decisions:Object.fromEntries(changes.map(item=>[item.id,{decision:'accepted',feedback:''}])),permittedIds:Object.values(state.project.collections).flat().map(item=>item.id),allowNewDefinitions:true,sourceKey:'source-spec',appliedIds:[],updatedAt:new Date().toISOString(),...extra};}
export async function workbookFile() {
  const workbook=new ExcelJS.Workbook(),sheet=workbook.addWorksheet('Specification');
  sheet.addRows([['Event','Property','Type'],['checkout','cart.total','number']]);
  sheet.getCell('A1').font={bold:true};sheet.getColumn('A').width=30;
  const notes=workbook.addWorksheet('Notes',{state:'hidden'});notes.getCell('A1').value='Scope: web checkout';notes.getCell('A2').value={formula:'1+1',result:2};
  return {id:'source-file',name:'specification.xlsx',mediaType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',base64:Buffer.from(await workbook.xlsx.writeBuffer()).toString('base64')};
}
export const templatePlan=()=>({id:'overview-template',name:'Source overview',kind:'overview',fileId:'source-file',sheet:'Specification',limitations:[],prototypeJson:JSON.stringify({kind:'overview',contractVersion:3,worksheetName:'Template',cells:[{address:'A1',sourceAddress:'A1',value:'{{project.name}}'},{address:'A2',value:'{{field.label}}'},{address:'B2',value:'{{field.value}}'}],areas:[{name:'OverviewFields',type:'repeat',source:'overview.fields',direction:'down',range:'A2:B2'}],merges:[]})});
export async function eventually(predicate,timeout=10000) {const deadline=Date.now()+timeout;while(Date.now()<deadline){const result=await predicate();if(result)return result;await new Promise(resolve=>setTimeout(resolve,40));}throw new Error('Timed out waiting for test condition.');}
