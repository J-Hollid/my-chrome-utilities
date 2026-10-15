// This opt-in test uses the installed Codex login and subscription.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {startCompanion} from '../companion/server.mjs';
import {project,change,review,workbookFile,eventually} from './agent-support.mjs';
import {agentCanonicalSchema} from '../dist/agent-specification/schema.js';
import {projectAgentContext} from '../dist/agent-specification/context.js';
import {applyAcceptedChanges} from '../dist/agent-specification/apply.js';
import {CompanionClient} from '../dist/agent-specification/client.js';
import {canonicalTableRows} from '../dist/data-layer-canonical-schema.js';
import {readFile} from 'node:fs/promises';

if(!process.argv.includes('--live'))throw new Error('Use --live to allow this test to use the installed Codex subscription.');
const root=resolve('tmp/codex-companion/live-test-'+Date.now());await mkdir(root,{recursive:true,mode:0o700});
const companion=await startCompanion({root,port:0});
try {
  const client=new CompanionClient(companion.url,(await readFile(companion.tokenPath,'utf8')).trim()),health=await client.health();
  assert.equal(health.auth,'chatgpt');
  const state=project();state.project.collections.pages.push({id:'existing-checkout',name:'Checkout',path:'/checkout',propertySetApplications:[]});
  const schema=agentCanonicalSchema('transaction','Transaction',{type:'object',properties:{cart:{type:'object',properties:{total:{type:'number',minimum:0}}}},required:['cart']});
  state.project.collections.profiles.push({id:'transaction',name:'Transaction',requirements:[],canonicalSchema:schema});
  const properties=canonicalTableRows(schema).map(row=>row.node.id),file=await workbookFile();
  const request={id:randomUUID(),projectId:state.project.id,baseRevision:1,mode:'both',sourceKey:'live-test-source',permittedIds:['transaction','existing-checkout'],allowNewDefinitions:true,
    description:'Read both workbook sheets using the supplied MCP tools. Import the checkout event in the Specification sheet. Its trigger is: User clicks Checkout. It runs on the existing Checkout page at /checkout. cart.total is required and uses the existing Transaction Shared Profile. Reuse the existing Checkout page and Transaction profile. Add a Flow with a page frame and event occurrence. The Notes sheet is source metadata; mark it excluded with a reason. Also create one overview export template, with a project name heading and an overview.fields repeat showing field.label and field.value. Use valid source ranges for all populated cells. These details are complete; do not invent new requirements.',
    context:projectAgentContext(state.project,['transaction','existing-checkout'],'',{transaction:properties}),files:[file]};
  await client.create(request);
  const finished=async()=>eventually(async()=>{const task=await client.task(request.id);return ['completed','failed','stopped'].includes(task.status)?task:false;},600000);
  const first=await finished();assert.equal(first.status,'completed',first.error);
  assert.ok(first.toolCalls?.filter(call=>call.tool==='read_sheet'&&call.status==='completed').length>=2,'MCP must read both sheets successfully');
  assert.ok(first.proposal.changes.some(item=>item.action==='reuse'));
  assert.ok(first.proposal.changes.some(item=>item.kind==='events'&&item.action==='create'));
  assert.ok(first.proposal.templates.length>0);
  let input=review(state,first.proposal.changes,{taskId:request.id,proposal:first.proposal,selectedProperties:{transaction:properties},sourceKey:request.sourceKey});
  for(const item of first.proposal.changes)input.decisions[item.id]={decision:item.action==='reuse'?'accepted':'pending',feedback:''};
  await client.revise(input,first.revision,'Change the event trigger and its flow occurrence trigger to: User clicks Pay. Keep the event name and data properties. Preserve accepted reuse items and return the full proposal.',request.context);
  const revised=await finished();assert.equal(revised.status,'completed',revised.error);
  assert.ok(revised.proposal.changes.some(item=>item.recordJson.includes('Pay')));
  input={...input,proposal:revised.proposal,decisions:Object.fromEntries(revised.proposal.changes.map(item=>[item.id,{decision:'accepted',feedback:''}]))};
  const applied=applyAcceptedChanges(state,input);assert.equal(applied.state.project.collections.pages.length,1);assert.equal(applied.state.project.collections.events.length,1);
  const plan=revised.proposal.templates[0],preview=await client.template(request.id,plan,{project:{name:'Live test project'},overview:{fields:[{label:'Site',value:'example.test'}]}});
  assert.ok(preview.previewCells.some(cell=>cell.value==='Live test project'));
  assert.ok((await client.artifact(request.id,plan.id)).size>0);
  const evidence={time:new Date().toISOString(),auth:health.auth,plan:health.plan,firstRevision:first.revision,revisedRevision:revised.revision,changes:applied.applied.length,templates:revised.proposal.templates.length,toolCalls:revised.toolCalls,coverage:revised.proposal.coverage,summary:revised.proposal.summary};
  await writeFile(join(root,'evidence.json'),JSON.stringify(evidence,null,2),{mode:0o600});
  console.log('PASS live Codex: authenticated bridge, workbook MCP reads, reuse, flow and event draft, revision, checked project apply, template render. Evidence: '+join(root,'evidence.json'));
} finally {await companion.close();}
