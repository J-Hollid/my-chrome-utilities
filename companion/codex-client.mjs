import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {EventEmitter} from 'node:events';
import {readFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {specificationReadTools} from './tool-policy.mjs';

export async function isolatedCodexArguments(taskDirectory, mcpPath) {
  const args = ['app-server', '--listen', 'stdio://', '-c', 'web_search="disabled"', '-c', 'features.apps=false', '-c', 'features.multi_agent=false'];
  for(const feature of ['shell_tool','unified_exec','plugins','hooks','skill_search','browser_use','computer_use','image_generation']) args.push('-c',`features.${feature}=false`);
  args.push('-c','features.skip_host_skill_discovery=true');
  // Disable personal MCP connections only in this child process.
  const config = await readFile(join(process.env.CODEX_HOME ?? join(homedir(),'.codex'), 'config.toml'),'utf8').catch(()=> '');
  for (const match of config.matchAll(/^\[mcp_servers\.([A-Za-z0-9_-]+)\]/gmu)) args.push('-c', `mcp_servers.${match[1]}.enabled=false`);
  if (mcpPath) {
    args.push('-c', 'mcp_servers.twatility.enabled=true', '-c', `mcp_servers.twatility.command=${JSON.stringify(process.execPath)}`,
      '-c', `mcp_servers.twatility.args=${JSON.stringify([mcpPath,taskDirectory])}`, '-c',`mcp_servers.twatility.enabled_tools=${JSON.stringify(specificationReadTools)}`);
    for(const name of specificationReadTools)args.push('-c',`mcp_servers.twatility.tools.${name}.approval_mode="approve"`);
  }
  return args;
}

export class CodexClient extends EventEmitter {
  pending = new Map();
  sequence = 0;
  closed = false;

  constructor(cwd, args) {
    super();
    this.child = spawn('codex', args, {cwd, stdio:['pipe','pipe','pipe']});
    this.child.stderr.on('data',()=>{});
    this.child.stdin.on('error',error=>this.fail(error));
    this.child.on('error',error=>this.fail(error));
    this.child.on('exit',(code,signal)=>{
      this.closed = true;
      this.fail(new Error(`Codex stopped (${code ?? signal}).`));
      this.emit('closed');
    });
    createInterface({input:this.child.stdout}).on('line',line=>{
      let message;
      try { message = JSON.parse(line); } catch { return; }
      if (message.method && message.id !== undefined) {
        this.send({id:message.id,error:{code:-32601,message:'Use the supplied specification tools. This task does not grant additional permissions.'}});
      } else if (message.id !== undefined) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        clearTimeout(pending.timer);
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
      } else this.emit('notification',message);
    });
  }
  fail(error) {
    for (const pending of this.pending.values()) {clearTimeout(pending.timer);pending.reject(error);}
    this.pending.clear();
  }
  send(value) {
    if (this.closed) throw new Error('Codex is disconnected.');
    this.child.stdin.write(JSON.stringify(value)+'\n');
  }
  request(method,params={},timeout=30000) {
    const id=++this.sequence;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error(`Codex request timed out: ${method}`));},timeout);
      this.pending.set(id,{resolve,reject,timer});
      try {this.send({id,method,params});} catch(error) {clearTimeout(timer);this.pending.delete(id);reject(error);}
    });
  }
  async initialize() {
    const result=await this.request('initialize',{clientInfo:{name:'twatility_companion',title:'Twatility Belt companion',version:'1.0.0'}});
    this.send({method:'initialized'});
    return result;
  }
  async turn(threadId,input,outputSchema,onMessage,timeout=600000) {
    let listener, closed, timer;
    const completion=new Promise((resolve,reject)=>{
      timer=setTimeout(()=>reject(new Error('The agent task exceeded ten minutes. Split the task and retry.')),timeout);
      closed=()=>reject(new Error('Codex disconnected during the task.'));
      listener=message=>{
        if (message.params?.threadId !== threadId) return;
        if (message.method==='item/agentMessage/delta') onMessage(message.params.delta);
        if (message.method==='turn/completed') resolve(message.params.turn);
      };
      this.on('notification',listener);
      this.once('closed',closed);
    });
    completion.catch(()=>{});
    try {
      await this.request('turn/start',{threadId,input,outputSchema});
      const result=await completion;
      if (result.status!=='completed') throw new Error(result.error?.message ?? `Agent turn ${result.status}.`);
      const answer=result.items.filter(item=>item.type==='agentMessage').at(-1)?.text;
      if (!answer) throw new Error('The agent returned no proposal.');
      return JSON.parse(answer);
    } finally {
      clearTimeout(timer);this.off('notification',listener);this.off('closed',closed);
    }
  }
  async close() {
    if (this.closed) return;
    await new Promise(resolve=>{
      const timer=setTimeout(()=>this.child.kill('SIGKILL'),3000);
      this.once('closed',()=>{clearTimeout(timer);resolve();});
      this.child.kill('SIGTERM');
    });
  }
}
