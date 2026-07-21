import assert from "node:assert/strict";
import {
  canonicalCommandsFromCompactProjection,
  compactConditionalPresence,
  compactSchemaProjection,
  savedSchemaCanonicalDocument,
  savedSchemaFromCanonical,
} from "../dist/data-layer-side-panel-unified-schema-editor.js";
import {applyCanonicalCommand} from "../dist/data-layer-canonical-schema.js";
import {createSchemaWorkingDraft,publishSchemaWorkingDraft} from "../dist/data-layer-schema-verification.js";

let sequence=0;
const id=(kind)=>`${kind}:${++sequence}`;
const saved={
  id:"schema:article",name:"Article",version:3,published:true,assignments:[],
  document:{
    type:"object",additionalProperties:false,typeMismatchTreatment:"warning",required:["article"],
    properties:{
      article:{
        type:"object",propertyOrigin:"manual",required:["category"],
        properties:{
          category:{type:"string",enum:["News","Guide"],description:"Editorial category",examples:["News"],minimum:2,maximum:20,"x-editor-hint":"headline"},
          items:{type:"array",items:{type:"object",additionalProperties:false,properties:{sku:{type:"string"}}}},
        },
      },
    },
  },
  attachedRules:[
    {id:"rule:category",version:2,propertyPath:"article.category",operator:"pattern",parameters:"^[A-Z]",severity:"warning",message:"Use title case"},
    {id:"rule:length",version:1,propertyPath:"article.category",operator:"numeric-range",parameters:"2,20",severity:"error",message:"Use a useful length"},
  ],
  documentation:{properties:{"/article/category":{displayName:"Category",description:"Editorial category",comments:"Shown in reporting",example:{value:"News",selectionMethod:"allowed value"}}}},
};
const canonical=savedSchemaCanonicalDocument(saved,id),category=Object.values(canonical.nodes).find(({name})=>name==="category");
assert.equal(category.type,"string");
assert.deepEqual(category.allowedValues.map(({value})=>value),["News","Guide"]);
assert.equal(category.documentation.description,"Editorial category");
assert.equal(category.documentation.displayText,"Category");
assert.equal(category.documentation.comments,"Shown in reporting");
assert.equal(category.documentation.example.value,"News");
assert.equal(category.rules.find(({id})=>id==="rule:category").message,"Use title case");
assert.deepEqual(category.rules.find(({id})=>id==="rule:length"),{id:"rule:length",kind:"range",minimum:2,maximum:20,severity:"error",message:"Use a useful length",reusableRuleId:"rule:length"});
const roundTrip=savedSchemaFromCanonical(saved,canonical);
assert.deepEqual(roundTrip.document,saved.document,"the complete JSON-schema structure survives the canonical adapter");
assert.deepEqual(roundTrip.attachedRules,saved.attachedRules,"saved-schema rules survive the canonical adapter");
assert.deepEqual(roundTrip.documentation,saved.documentation,"rich saved-schema documentation survives the canonical adapter");
assert.deepEqual(roundTrip.canonicalSchema,canonical,"the canonical document and its node identities are persisted with the saved-schema draft");
const reloaded=savedSchemaCanonicalDocument(roundTrip,()=>{throw new Error("reload must not regenerate canonical identities");});
assert.deepEqual(reloaded,canonical,"reloading a saved schema restores the exact canonical document");
const published=publishSchemaWorkingDraft(createSchemaWorkingDraft(roundTrip));
assert.deepEqual(published.canonicalSchema,canonical,"publishing carries canonical identities and rich facets into the immutable saved revision");

const article=Object.values(canonical.nodes).find(({name})=>name==="article");
const renamed=applyCanonicalCommand(canonical,{kind:"rename",baseRevision:canonical.revision,propertyId:article.id,name:"story"});
assert.equal(renamed.status,"applied");
const afterRename=savedSchemaFromCanonical(saved,renamed.document);
assert.deepEqual(afterRename.attachedRules.map(({propertyPath})=>propertyPath),["/story/category","/story/category"],"rename atomically rebases every attached-rule path from stable canonical identities");
const moved=applyCanonicalCommand(renamed.document,{kind:"move",baseRevision:renamed.document.revision,propertyId:category.id});
assert.equal(moved.status,"applied");
const afterMove=savedSchemaFromCanonical(afterRename,moved.document);
assert.deepEqual(afterMove.attachedRules.map(({propertyPath})=>propertyPath),["/category","/category"],"move atomically rebases every attached-rule path from stable canonical identities");

const compactSource={
  ...canonical,
  revision:8,
  nodes:{
    ...canonical.nodes,
    [category.id]:{
      ...category,
      presence:{mode:"required-when",condition:{kind:"predicate",propertyId:article.id,operator:"Equals",value:"News"}},
      rules:category.rules.map((rule)=>rule.id==="rule:category"?{...rule,condition:{kind:"predicate",propertyId:article.id,operator:"Equals",value:"News"}}:rule),
    },
  },
};
const compact=compactSchemaProjection(compactSource,{id:"schema:article",name:"Article",version:8});
assert.equal(compact.canonicalSchema,undefined,"the compact renderer receives a projection instead of a nested standalone-editor payload");
const compactConditionalRule=compact.attachedRules.find(({id})=>id==="rule:category");
assert.deepEqual(compactConditionalRule.conditionGroup,{operator:"All",predicates:[{propertyPath:"/article",operator:"Equals",comparison:{type:"string",value:"News"},detectedType:"object"}]},"the compact rich rule builder receives the canonical condition as editable structured controls");
compact.documentation.properties["/article/category"]={
  ...compact.documentation.properties["/article/category"],
  description:"Changed through compact panel",
};
const compactCommands=canonicalCommandsFromCompactProjection(compactSource,compact,id);
assert.deepEqual(compactCommands.map(({kind})=>kind),["set"],"one compact facet edit emits one property-scoped canonical command");
assert.equal(compactCommands[0].propertyId,category.id,"compact edits retain the canonical property identity");
const compactResult=applyCanonicalCommand(compactSource,compactCommands[0]);
assert.equal(compactResult.document.nodes[category.id].documentation.description,"Changed through compact panel");
assert.equal(compactResult.document.nodes[category.id].presence.mode,"required-when","projection edits preserve conditional presence owned by canonical state");
assert.equal(compactResult.document.nodes[category.id].presence.condition.propertyId,article.id);
assert.deepEqual(compactResult.document.nodes[category.id].rules.find(({id})=>id==="rule:category").condition,{kind:"predicate",propertyId:article.id,operator:"Equals",value:"News"},"compact projection edits round-trip the rendered canonical rule condition");
const editedRuleProjection=compactSchemaProjection(compactSource,{id:"schema:article",name:"Article",version:8}),editedConditionalRule=editedRuleProjection.attachedRules.find(({id})=>id==="rule:category");
editedConditionalRule.conditionGroup.predicates[0].comparison.value="Guide";
const editedRuleCommands=canonicalCommandsFromCompactProjection(compactSource,editedRuleProjection,id),editedRuleResult=applyCanonicalCommand(compactSource,editedRuleCommands[0]);
assert.equal(editedRuleResult.document.nodes[category.id].rules.find(({id})=>id==="rule:category").condition.value,"Guide","editing the rendered rich condition writes the typed predicate back to the canonical rule model");

const addedProjection=structuredClone(compactSchemaProjection(compactSource,{id:"schema:article",name:"Article",version:8}));
addedProjection.document.properties.article.properties.section={type:"string",description:"Nested section"};
const addedCommands=canonicalCommandsFromCompactProjection(compactSource,addedProjection,id);
assert.equal(addedCommands.some(({kind,name})=>kind==="add"&&name==="section"),true,"compact assisted property creation emits a canonical add command");
let addedResult=compactSource;
for(const command of addedCommands){const result=applyCanonicalCommand(addedResult,command);assert.notEqual(result.status,"conflict");assert.notEqual(result.status,"confirmation-required");addedResult=result.document;}
const section=Object.values(addedResult.nodes).find((node)=>node.name==="section");
assert.equal(section.parentId,article.id);
assert.equal(section.documentation.description,"Nested section","new compact properties retain their canonical facets");

const removedProjection=structuredClone(compactSchemaProjection(compactSource,{id:"schema:article",name:"Article",version:8}));
delete removedProjection.document.properties.article.properties.category;
const removedCommands=canonicalCommandsFromCompactProjection(compactSource,removedProjection,id);
assert.deepEqual(removedCommands.map(({kind})=>kind),["delete"],"compact removal emits one canonical subtree command");
assert.equal(removedCommands[0].propertyId,category.id);

assert.deepEqual(compactConditionalPresence("required-when",article.id,"Equals","News"),{
  mode:"required-when",condition:{kind:"predicate",propertyId:article.id,operator:"Equals",value:"News"},
},"compact conditional controls author the chosen typed predicate instead of an Exists fallback");

console.log("data-layer unified side-panel schema editor tests passed");
