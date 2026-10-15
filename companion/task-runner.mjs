import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CodexClient, isolatedCodexArguments} from './codex-client.mjs';
import {readJson} from './task-files.mjs';
import {instructions,taskPrompt} from './prompt.mjs';
import {proposalSchema} from './proposal-schema.mjs';
import {checkProposalResult} from './proposal-result.mjs';

export async function runTask(job,onProgress,onClient) {
  const client=new CodexClient(job.directory,await isolatedCodexArguments(job.directory,fileURLToPath(new URL('./mcp.mjs',import.meta.url))));
  onClient(client);
  job.task.toolCalls ??= [];
  client.on('notification',message=>{
    const item=message.params?.item;
    if(message.method==='item/completed'&&item?.type==='mcpToolCall'&&item.server==='twatility') {
      job.task.toolCalls.push({tool:item.tool,status:item.status,...(item.tool==='read_sheet'?{input:item.arguments}:{})});
    }
  });
  try {
    await client.initialize();
    const account=await client.request('account/read');
    if(!account.account) throw new Error('Sign in to Codex on the companion machine first.');
    let thread;
    if(job.threadId) {
      try {thread=await client.request('thread/resume',{threadId:job.threadId,cwd:job.directory,sandbox:'read-only',approvalPolicy:'never'});} catch { /* Fresh context below retains the review after missing/expired history. */ }
    }
    thread ??= await client.request('thread/start',{cwd:job.directory,sandbox:'read-only',approvalPolicy:'never',developerInstructions:instructions});
    job.threadId=thread.thread.id;
    onProgress('Drafting specification');
    const files=await readJson(join(job.directory,'files.json'));
    const input=[{type:'text',text:taskPrompt(job.request,job.task.workbook,job.review,job.feedback)},
      ...files.filter(file=>file.image).flatMap(file=>[{type:'text',text:`Source screenshot: ${file.name}; fileId: ${file.id}.`},{type:'localImage',path:file.path}])];
    let turnInput=input;
    for(let attempt=0;attempt<2;attempt++) {
      const raw=await client.turn(job.threadId,turnInput,proposalSchema,delta=>onProgress('Drafting specification',delta));
      onProgress('Checking proposal and templates');
      try {return await checkProposalResult(job,raw,files);}
      catch(error) {
        if(attempt===1)throw error;
        onProgress('Repairing proposal validation error');
        turnInput=[{type:'text',text:JSON.stringify({repair:'The proposal failed validation. Correct the error and return the full proposal. Keep accepted, rejected, and applied review items unchanged.',validationError:error.message})}];
      }
    }
    throw new Error('The proposal could not be validated.');
  } finally {await client.close();onClient(undefined);}
}
