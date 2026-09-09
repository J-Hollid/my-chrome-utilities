import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export function runChecks(base,files) {
  const evidence={};
  for(const file of files) {
    const result=spawnSync(process.execPath,[fileURLToPath(new URL(file,base))],{encoding:'utf8',maxBuffer:8*1024*1024,env:process.env});
    if(result.status!==0)throw Error(`${file} failed (${result.status}): ${result.error??''}\n${result.stdout}\n${result.stderr}`);
    for(const line of result.stdout.split('\n').filter(line=>line.startsWith('{')))Object.assign(evidence,JSON.parse(line));
  }
  return evidence;
}
