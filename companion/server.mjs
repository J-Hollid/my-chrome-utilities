import {createServer} from 'node:http';
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import {TaskStore} from './task-store.mjs';
import {authorize,cors,readBody,json} from './http.mjs';
import {safeId,readJson,prepareTaskFiles} from './task-files.mjs';
import {readAccount} from './account.mjs';
import {writeTemplateArtifact} from './template-export.mjs';
import {parseProposal} from '../dist/agent-specification/contract.js';

export async function startCompanion({root,port=46117,token,allowedOrigins=[],runner,accountProvider=readAccount}={}) {
  root=resolve(root ?? 'tmp/codex-companion');
  await mkdir(root,{recursive:true,mode:0o700});
  const tokenPath=join(root,'connection-token');
  token ??= await readFile(tokenPath,'utf8').then(value=>value.trim()).catch(()=>undefined);
  if(!token){token=randomBytes(32).toString('base64url');await writeFile(tokenPath,token+'\n',{mode:0o600,flag:'wx'});}
  const store=new TaskStore(join(root,'tasks'),runner);await store.open();
  let mutation=Promise.resolve(),accountCache;
  const serialize=work=>{const next=mutation.then(work);mutation=next.catch(()=>{});return next;};
  const server=createServer(async(request,response)=>{
    cors(request,response,allowedOrigins);
    if(request.method==='OPTIONS'){response.writeHead(response.hasHeader('Access-Control-Allow-Origin')?204:403);response.end();return;}
    try {authorize(request,token,allowedOrigins);} catch(error){json(response,401,{error:error.message});return;}
    try {
      const url=new URL(request.url,'http://localhost'),parts=url.pathname.split('/').filter(Boolean);
      if(url.pathname==='/v1/health' && request.method==='GET') {
        if(!accountCache || Date.now()-accountCache.checkedAt>60000) {
          accountCache=await accountProvider(root);
        }
        json(response,200,accountCache);return;
      }
      if(url.pathname==='/v1/inspect' && request.method==='POST') {
        const body=await readBody(request),directory=join(root,'inspect-'+randomUUID());
        try {const result=await prepareTaskFiles(directory,{files:body.files,context:{}});json(response,200,result.workbook);}
        finally {await rm(directory,{recursive:true,force:true});}
        return;
      }
      if(url.pathname==='/v1/tasks' && request.method==='POST') {const body=await readBody(request);json(response,202,await serialize(()=>store.create(body)));return;}
      if(parts[0]==='v1' && parts[1]==='tasks' && safeId(parts[2])) {
        const job=store.get(parts[2]);
        if(parts.length===3 && request.method==='GET'){json(response,200,job.task);return;}
        if(parts[3]==='sources' && request.method==='GET'){json(response,200,await readJson(join(job.directory,'workbooks.json')));return;}
        if(parts[3]==='revise' && request.method==='POST'){const body=await readBody(request);parseProposal(body.review?.proposal);json(response,202,await serialize(()=>store.revise(parts[2],body)));return;}
        if(parts[3]==='stop' && request.method==='POST'){json(response,200,await serialize(()=>store.stop(parts[2])));return;}
        if(parts[3]==='template' && request.method==='POST') {
          const body=await readBody(request),proposal=parseProposal({summary:'',changes:[],templates:[body.plan],coverage:[],questions:[]});
          const plan=proposal.templates[0];
          if(!safeId(plan.id))throw new Error('Invalid template identity.');
          const files=await readJson(join(job.directory,'files.json'));
          json(response,200,await serialize(()=>writeTemplateArtifact(job.directory,plan,files,body.context)));return;
        }
        if(parts[3]==='artifacts' && safeId(parts[4]) && request.method==='GET') {
          const path=join(job.directory,'generated',parts[4]+'.xlsx'),bytes=await readFile(path);
          response.writeHead(200,{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="${parts[4]}.xlsx"`});response.end(bytes);return;
        }
      }
      json(response,404,{error:'Unknown companion endpoint.'});
    } catch(error) {if(!response.headersSent)json(response,400,{error:error.message});else response.end();}
  });
  server.requestTimeout=120000;
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  return {server,store,tokenPath,url:`http://127.0.0.1:${server.address().port}`,close:async()=>{await store.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
