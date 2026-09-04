import { publishReusableRuleSync, reviewReusableRuleSync, type ReusableRuleSyncReview } from "../../data-layer-reusable-rule-sync.js";
import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { ReusableSchemaRule } from "./contracts.js";
import type { SchemaRuleBehaviorPorts } from "./rule-behavior-contracts.js";

interface RuleAttachmentWorkflowPorts {
  behavior():SchemaRuleBehaviorPorts;
  stored(id:string):ReusableSchemaRule|undefined;
}

/** Owns pinned attachment upgrade and reusable-rule synchronization reviews. */
export class SchemaRuleAttachmentWorkflow {
  pendingUpgrade:{ id:string; schemaIds:readonly string[] }|undefined;
  pendingSync:{ rule:ReusableSchemaRule; review:ReusableRuleSyncReview }|undefined;
  approvedAttachmentUpdateId:string|undefined;
  constructor(private readonly ports:RuleAttachmentWorkflowPorts) {}
  review(rule:ReusableSchemaRule):ReusableRuleSyncReview { return reviewReusableRuleSync(this.ports.behavior().schemas(),rule); }
  requestUpgrade(id:string,schemaIds:readonly string[]):boolean { const rule=this.ports.stored(id),p=this.ports.behavior();if(!rule)return false;
    const affected=p.schemas().filter((schema) => schemaIds.includes(schema.id)&&schema.attachedRules?.some((item) => item.id===id));this.pendingUpgrade={id,schemaIds:[...schemaIds]};p.presentation.showUpgrade(rule,affected);return true; }
  confirmUpgrade():void { const pending=this.pendingUpgrade,p=this.ports.behavior();if(!pending)return;const rule=this.ports.stored(pending.id);if(!rule)return;
    p.replaceSchemas(p.schemas().map((schema) => !pending.schemaIds.includes(schema.id)||!schema.attachedRules ? schema:{...schema,attachedRules:schema.attachedRules.map((attached) => attached.id!==rule.id ? attached:{...attached,name:rule.name,version:rule.version,...(rule.operator?{operator:rule.operator}:{}),...(rule.parameters?{parameters:rule.parameters}:{}),...(rule.severity?{severity:rule.severity}:{}),...(rule.message?{message:rule.message}:{}),enabled:rule.enabled})}));
    this.approvedAttachmentUpdateId=pending.id;this.pendingUpgrade=undefined;p.persistLibrary();p.presentation.close("upgrade"); }
  cancelUpgrade():void { this.pendingUpgrade=undefined;this.ports.behavior().presentation.close("upgrade"); }
  requestSync(id:string):boolean { const rule=this.ports.stored(id),p=this.ports.behavior();if(!rule)return false;const review=this.review(rule);this.pendingSync={rule:structuredClone(rule),review};p.presentation.showSync(review);return true; }
  confirmSync():void { const pending=this.pendingSync,p=this.ports.behavior();if(!pending)return;const rule=this.ports.stored(pending.rule.id);if(!rule)throw new Error("The reusable rule was removed after review");const review=this.review(rule);if(JSON.stringify(review)!==JSON.stringify(pending.review))throw new Error("The attached schemas changed after review");p.replaceSchemas(publishReusableRuleSync(p.schemas(),rule,review));this.pendingSync=undefined;p.persistLibrary();p.renderAll();p.presentation.close("sync"); }
  cancelSync():void { this.pendingSync=undefined;this.ports.behavior().presentation.close("sync"); }
  dispose():void { this.pendingUpgrade=undefined;this.pendingSync=undefined;this.approvedAttachmentUpdateId=undefined; }
}
