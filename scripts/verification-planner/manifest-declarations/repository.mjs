import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile} from 'node:fs/promises';
import {manifestDeclarationDelta,parseUnambiguousJson} from './delta.mjs';

const run=promisify(execFile),evidence=new WeakMap(),identity=JSON.stringify;
const policyFiles=[
  'scripts/verification-planner/manifest-declarations/delta.mjs',
  'scripts/verification-planner/manifest-declarations/repository.mjs',
  'scripts/verification-planner/manifest-declarations/impact.mjs',
  'scripts/verification-planner/manifest-declarations/slice-mapping.mjs',
  'scripts/verification-planner/history/changes.mjs',
  'scripts/verification-planner/tasks/planner.mjs',
  'scripts/verification-shared-boundaries.mjs',
  'scripts/build.mjs','scripts/build-delivered-dependencies.mjs',
];
const policyChange=file=>file.startsWith('scripts/verification-')||file.startsWith('verification/')||
  policyFiles.includes(file);

async function packagedEntry(git,commit,resource) {
  if(resource===null)return true;
  const files=(await git(['ls-tree','-r','--name-only',commit,'--',resource])).trim().split('\n');
  if(!files.includes(resource))return false;
  const entry=await git(['ls-tree',commit,'--',resource]);
  if(!/^100(?:644|755) blob /u.test(entry))return false;
  const text=await git(['show',`${commit}:${resource}`]);
  if(!text.trim())return false;
  // These are the only HTML entries copied directly by the unchanged build.
  if(['side-panel.html','specification-builder.html'].includes(resource))return true;
  const delivery=parseUnambiguousJson(await git(['show',`${commit}:build-delivered-dependencies.json`]));
  if(!Array.isArray(delivery))return false;
  const matches=delivery.filter(item=>item.destination===resource);
  return matches.length===1&&matches[0].source===resource;
}

async function canonicalRange(git,changeSet) {
  if(![changeSet.baseCommit,changeSet.commit].every(value=>/^[a-f0-9]{40,64}$/u.test(value)))return false;
  await git(['merge-base','--is-ancestor',changeSet.baseCommit,changeSet.commit]);
  const actual=(await git(['diff','--name-only','--no-renames','-z',changeSet.baseCommit,changeSet.commit]))
    .split('\0').filter(Boolean).sort();
  if(identity(actual)!==identity([...changeSet.paths].sort()))return false;
  const status=await git(['diff','--name-status','-z','--find-renames','--find-copies',
    `${changeSet.baseCommit}...${changeSet.commit}`]);
  const recorded=changeSet.entries.flatMap(entry=>entry.oldPath?
    [`${entry.status}${String(entry.score).padStart(3,'0')}`,entry.oldPath,entry.newPath]:
    [entry.status,entry.path]).join('\0')+'\0';
  if(status!==recorded)return false;
  const manifestStatus=await git(['diff','--name-status','--no-renames',changeSet.baseCommit,
    changeSet.commit,'--','manifest.json']);
  if(manifestStatus!=='M\tmanifest.json\n')return false;
  return changeSet.entries.filter(entry=>entry.path==='manifest.json').length===1&&
    changeSet.entries.some(entry=>entry.path==='manifest.json'&&entry.status==='M');
}

export async function bindManifestDeclarations(changeSet,repositoryRoot) {
  if(!changeSet.paths.includes('manifest.json')||changeSet.paths.some(policyChange))return changeSet;
  const git=async args=>(await run('git',args,{cwd:repositoryRoot,encoding:'utf8',timeout:5000,
    maxBuffer:16*1024*1024})).stdout;
  try {
    if(!await canonicalRange(git,changeSet))return changeSet;
    for(const file of policyFiles) {
      const accepted=await git(['show',`${changeSet.baseCommit}:${file}`]);
      const executing=await readFile(new URL(`../../../${file}`,import.meta.url),'utf8');
      if(accepted!==executing)return changeSet;
    }
    const snapshots=await Promise.all([changeSet.baseCommit,changeSet.commit].map(async commit=>({
      manifest:await git(['show',`${commit}:manifest.json`]),
      registry:parseUnambiguousJson(await git(['show',`${commit}:verification/packs.json`])),
    })));
    const delta=manifestDeclarationDelta(snapshots[0].manifest,snapshots[1].manifest);
    if(!delta||!await packagedEntry(git,changeSet.baseCommit,delta.before)||
      !await packagedEntry(git,changeSet.commit,delta.after))return changeSet;
    const registries=snapshots.map(snapshot=>identity(snapshot.registry));
    if(registries[0]!==registries[1])return changeSet;
    evidence.set(changeSet,Object.freeze({identity:identity(changeSet),delta:Object.freeze(delta),
      registries:Object.freeze(registries)}));
  } catch { /* Unavailable canonical evidence retains global ownership. */ }
  return changeSet;
}

export function manifestDeclarationEvidence(changeSet,registry) {
  const result=changeSet&&evidence.get(changeSet);
  return result?.identity===identity(changeSet)&&result.registries.includes(identity(registry))?result:null;
}
