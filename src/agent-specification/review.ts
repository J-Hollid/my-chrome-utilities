import type {AgentProposal, AgentReview, ReviewDecision} from "./types.js";
import {parseProposal, stableJson} from "./contract.js";

export function setReviewDecision(review:AgentReview, id:string, decision:ReviewDecision, feedback=""):AgentReview {
  if (review.appliedIds.includes(id)) throw new Error("This item has already been applied.");
  return {...review, decisions:{...review.decisions, [id]:{decision, feedback}}, updatedAt:new Date().toISOString()};
}
export function mergeProposalRevision(review:AgentReview, input:AgentProposal):AgentReview {
  const proposal = parseProposal(input), decisions = {...review.decisions};
  // An agent cannot undo a user's accepted or rejected decision.
  for (const collection of ["changes", "templates"] as const) {
    const incoming = proposal[collection] as {id:string}[];
    for (const previous of review.proposal[collection]) {
      const decision = decisions[previous.id]?.decision;
      if (decision === "accepted" || decision === "rejected" || review.appliedIds.includes(previous.id)) {
        const index = incoming.findIndex(item=>item.id === previous.id);
        if (index < 0) incoming.push(structuredClone(previous));
        else incoming[index] = structuredClone(previous);
      } else if (incoming.some(item=>item.id === previous.id && stableJson(item) !== stableJson(previous))) {
        decisions[previous.id] = {decision:"pending", feedback:decisions[previous.id]?.feedback ?? ""};
      }
    }
  }
  return {...review, proposal, decisions, updatedAt:new Date().toISOString()};
}
export function editProposalItem(review:AgentReview, id:string, json:string):AgentReview {
  if (review.appliedIds.includes(id)) throw new Error("This item has already been applied.");
  const proposal = structuredClone(review.proposal), item = proposal.changes.find(item=>item.id === id);
  if (item) item.recordJson = json;
  else {
    const template = proposal.templates.find(item=>item.id === id);
    if (!template) throw new Error("Unknown proposal item.");
    template.prototypeJson = json;
  }
  return setReviewDecision({...review, proposal:parseProposal(proposal)}, id, "pending", review.decisions[id]?.feedback);
}
