import {join} from 'node:path';
import Ajv from 'ajv';
import {proposalSchema} from './proposal-schema.mjs';
import {parseProposal,parseRecord} from '../dist/agent-specification/contract.js';
import {validateAgentRecord} from '../dist/agent-specification/record-validation.js';
import {mergeProposalRevision} from '../dist/agent-specification/review.js';
import {validateSourceCoverage,validateSourceReads} from './proposal-validation.mjs';
import {writeTemplateArtifact} from './template-export.mjs';
import {readJson} from './task-files.mjs';
const validate=new Ajv({strict:false}).compile(proposalSchema);

export async function checkProposalResult(job,raw,files) {
  if(!validate(raw))throw new Error('Agent output does not match the proposal contract: '+JSON.stringify(validate.errors));
  let proposal=parseProposal(raw);
  if(job.review)proposal=mergeProposalRevision(job.review,proposal).proposal;
  for(const change of proposal.changes)if(change.action!=='reuse')validateAgentRecord(parseRecord(change.recordJson));
  const workbooks=await readJson(join(job.directory,'workbooks.json'));
  validateSourceReads(workbooks,job.task.toolCalls);
  validateSourceCoverage(proposal,workbooks,job.request.mode);
  for(const plan of proposal.templates) {
    await writeTemplateArtifact(job.directory,plan,files);
    const source=workbooks.find(file=>file.id===plan.fileId)?.sheets.find(sheet=>sheet.name===plan.sheet);
    if(source?.images.length)plan.limitations=[...new Set([...plan.limitations,'Source workbook images are not copied. Add supported logo or page visual bindings in the template editor.'])];
  }
  return proposal;
}
