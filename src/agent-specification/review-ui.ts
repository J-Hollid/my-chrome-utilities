import type {AgentReview, ReviewDecision, TemplatePlan} from "./types.js";
import {editProposalItem,setReviewDecision} from "./review.js";
import {findDefinitionMatches} from "./matching.js";
import {entityRecord} from "./records.js";
import {element,button,field,select,showJson} from "./ui-elements.js";

export interface ReviewActions {
  save(review:AgentReview):Promise<void>;
  run(work:()=>Promise<void>):Promise<void>;
  template(plan:TemplatePlan, action:"preview"|"download"|"save"):Promise<void>;
}
export function renderAgentReview(root:HTMLElement, review:AgentReview, actions:ReviewActions):void {
  root.replaceChildren(element("h2","Proposal review"),element("p",review.proposal.summary));
  if(review.proposal.questions.length)root.append(element("p",`Open questions: ${review.proposal.questions.join("; ")}`));
  for (const item of [...review.proposal.changes,...review.proposal.templates]) {
    const panel=element("details"),applied=review.appliedIds.includes(item.id),decision=review.decisions[item.id];
    panel.dataset.decision=decision?.decision??"pending";
    panel.append(element("summary",`${item.name} · ${"recordJson" in item?item.kind:"Export template"} · ${applied?"saved":decision?.decision??"pending"}`));
    const feedback=element("textarea");feedback.rows=2;feedback.value=decision?.feedback??"";feedback.disabled=applied;
    const choice=select([["pending","Pending"],["accepted","Accept"],["rejected","Reject"],["needs-information","Needs information"]]);choice.value=decision?.decision??"pending";choice.disabled=applied;
    const controls=element("div");controls.className="agent-actions";
    controls.append(field("Decision",choice),button("Save decision",()=>actions.run(()=>actions.save(setReviewDecision(review,item.id,choice.value as ReviewDecision,feedback.value)))));
    panel.append(field("Feedback for this item",feedback),controls);
    if ("recordJson" in item) {
      panel.append(element("p",item.reason));
      if(item.questions.length) panel.append(element("p",`Needs answers: ${item.questions.join("; ")}`));
      const action=select([["create","Create"],["reuse","Reuse existing"],["update","Update existing"]]),target=select([["","Choose a definition"],...review.baseProject.collections[item.kind].filter(entity=>review.permittedIds.includes(entity.id)).map(entity=>[entity.id,entity.name] as [string,string]),...review.proposal.changes.filter(other=>other.id!==item.id&&other.kind===item.kind&&other.action==="create").map(other=>[other.id,`Proposed: ${other.name}`] as [string,string])]);
      action.value=item.action;target.value=item.targetId??"";action.disabled=target.disabled=applied;
      const matches=findDefinitionMatches(review.baseProject,item,review.sourceKey);
      if(matches.length) panel.append(element("p",`Matches: ${matches.map(match=>`${match.name} (${match.kind}): ${match.explanation}`).join("\n")}`));
      panel.append(field("Operation",action),field("Target definition",target),button("Save matching choice",()=>actions.run(async()=>{
        const next=structuredClone(review),change=next.proposal.changes.find(change=>change.id===item.id)!;
        change.action=action.value as typeof item.action;change.targetId=action.value==="create"?null:target.value||null;
        await actions.save(setReviewDecision(next,item.id,"pending",feedback.value));
      })));
      const grid=element("div");grid.className="agent-review-grid";
      const current=review.baseProject.collections[item.kind].find(entity=>entity.id===item.targetId);
      const before=element("section");before.append(element("h3","Current definition"),showJson(current?entityRecord(current,review.baseProject):{}));grid.append(before);
      const after=element("section");after.append(element("h3","Proposed fields"),showJson(JSON.parse(item.recordJson)));grid.append(after);panel.append(grid);
      if(item.sources.length)panel.append(element("p",`Source: ${item.sources.map(source=>`${source.fileId} / ${source.sheet}!${source.range}`).join("; ")}`));
      if(item.dependsOn.length)panel.append(element("p",`Depends on: ${item.dependsOn.join(", ")}`));
    } else {
      panel.append(element("p",`Source: ${item.fileId} / ${item.sheet}`),element("p",`Layout limits: ${item.limitations.join("; ")||"None reported. Check the preview."}`));
      const tools=element("div");tools.className="agent-actions";
      for(const [label,action] of [["Preview with project data","preview"],["Download template","download"],["Save accepted template to project","save"]] as const)tools.append(button(label,()=>actions.run(()=>actions.template(item,action))));
      panel.append(tools);
    }
    const editor=element("textarea");editor.rows=8;editor.value="recordJson" in item?item.recordJson:item.prototypeJson;editor.disabled=applied;
    const advanced=element("details");advanced.append(element("summary","Edit proposed fields"),field("Proposed JSON",editor),button("Save edited fields",()=>actions.run(()=>actions.save(editProposalItem(review,item.id,editor.value)))));panel.append(advanced);
    if(applied)panel.querySelectorAll<HTMLButtonElement>("button").forEach(button=>{button.disabled=true;});
    root.append(panel);
  }
  if(review.proposal.coverage.length){const detail=element("details");detail.append(element("summary","Source coverage"),showJson(review.proposal.coverage));root.append(detail);}
}
