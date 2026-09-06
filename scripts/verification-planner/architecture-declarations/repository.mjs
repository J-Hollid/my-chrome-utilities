import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {declarationDelta,declarationPath} from './delta.mjs';

const run=promisify(execFile),evidence=new WeakMap();
const policyPath='scripts/verification-planner/architecture-declarations/repository.mjs';
const identity=value=>JSON.stringify(value);

// Only the canonical Git adapter supplies this object. Evidence is deliberately
// not serialized: reconstructed or caller-labelled change sets stay conservative.
export async function bindArchitectureDeclarations(changeSet,repositoryRoot) {
 if(!changeSet.paths.includes(declarationPath))return changeSet;
 if(changeSet.paths.some(file=>file.startsWith('scripts/verification-planner/')))return changeSet;
 const git=async args=>(await run('git',args,{cwd:repositoryRoot,encoding:'utf8',timeout:5000,
  maxBuffer:8*1024*1024})).stdout;
 try {
  if(![changeSet.baseCommit,changeSet.commit].every(value=>/^[a-f0-9]{40,64}$/u.test(value)))return changeSet;
  await git(['merge-base','--is-ancestor',changeSet.baseCommit,changeSet.commit]);
  const actual=(await git(['diff','--name-only','--no-renames',changeSet.baseCommit,changeSet.commit]))
   .trim().split('\n').filter(Boolean).sort();
  if(identity(actual)!==identity([...changeSet.paths].sort()))return changeSet;
  if(!changeSet.entries.some(entry=>entry.path===declarationPath&&entry.status==='M'))return changeSet;
  // The implementation cannot use its own new policy to narrow its delivery range.
  await git(['cat-file','-e',`${changeSet.baseCommit}:${policyPath}`]);
  const snapshots=await Promise.all([changeSet.baseCommit,changeSet.commit].map(async commit=>({
   declarations:JSON.parse(await git(['show',`${commit}:${declarationPath}`])),
   sources:new Set((await git(['ls-tree','-r','--name-only',commit,'--','src'])).trim().split('\n')),
  })));
  const delta=declarationDelta(snapshots[0].declarations,snapshots[1].declarations);
  if(!delta){evidence.set(changeSet,{identity:identity(changeSet),invalid:true});return changeSet;}
  if(delta.paths.some(file=>!snapshots.some(snapshot=>snapshot.sources.has(file))))return changeSet;
  evidence.set(changeSet,{identity:identity(changeSet),delta,snapshots});
 } catch { /* Unavailable or invalid repository evidence keeps the global rule. */ }
 return changeSet;
}

export function architectureDeclarationEvidence(changeSet) {
 const found=changeSet&&evidence.get(changeSet);
 return found?.identity===identity(changeSet)?found:null;
}
