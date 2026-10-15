// Opt-in test: temporarily use an unused Tailscale Serve port, then restore it.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {startCompanion} from '../companion/server.mjs';
import {eventually} from './agent-support.mjs';

if(!process.argv.includes('--live'))throw new Error('Use --live to test a temporary Tailscale Serve endpoint.');
const status=()=>JSON.parse(execFileSync('tailscale',['serve','status','--json'],{encoding:'utf8'}));
const before=status(),port=8444;
const usesPort=value=>value&&typeof value==='object'&&(Boolean(value.TCP?.[port])||Object.values(value).some(usesPort));
if(usesPort(before))throw new Error('Port 8444 is in use. Existing services were not changed.');
const root=await mkdtemp(join(tmpdir(),'twatility-tailscale-')),token='temporary-test-token';
const companion=await startCompanion({root,port:0,token,accountProvider:async()=>({protocol:1,service:'twatility-companion',auth:'test-provider',checkedAt:Date.now()})});
const host=JSON.parse(execFileSync('tailscale',['status','--json'],{encoding:'utf8'})).Self.DNSName.replace(/\.$/u,'');
const serve=spawn('tailscale',['serve',`--https=${port}`,companion.url],{stdio:['ignore','pipe','pipe']});let output='';serve.stdout.on('data',chunk=>{output+=chunk;});serve.stderr.on('data',chunk=>{output+=chunk;});
try {
  await eventually(()=>{if(serve.exitCode!==null)throw new Error(output);return usesPort(status());},15000);
  const url=`https://${host}:${port}/v1/health`;
  assert.equal((await fetch(url,{signal:AbortSignal.timeout(15000)})).status,401);
  const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`,Origin:'chrome-extension://'+'a'.repeat(32)},signal:AbortSignal.timeout(15000)});
  assert.equal(response.status,200);assert.equal((await response.json()).service,'twatility-companion');
  assert.equal(response.headers.get('access-control-allow-origin'),'chrome-extension://'+'a'.repeat(32));
  console.log(`PASS Tailscale HTTPS and bearer/CORS path on ${url}. Same-host test; no second-device test.`);
} catch(error) {console.error(output);throw error;} finally {
  const stopped=new Promise(resolve=>serve.once('exit',resolve));if(serve.exitCode===null){serve.kill('SIGINT');await stopped;}
  await companion.close();await rm(root,{recursive:true,force:true});
  assert.deepEqual(status(),before,'Tailscale services must be unchanged after this test.');
}
