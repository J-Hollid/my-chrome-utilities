import assert from "node:assert/strict";
import {
  canonicalCommandsFromCompactProjection,
  compactConditionalPresence,
  compactSchemaProjection,
  savedSchemaCanonicalDocument,
  savedSchemaFromCanonical,
} from "../dist/data-layer-side-panel-unified-schema-editor.js";
import {applyCanonicalCommand} from "../dist/data-layer-canonical-schema.js";
import {canonicalPredicateLeafFromInput, canonicalPredicateText, validateCanonicalPredicateTree} from "../dist/data-layer-canonical-predicate-editor.js";
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
const movedCompact=compactSchemaProjection(moved.document,{id:"schema:article",name:"Article",version:moved.document.revision});
movedCompact.documentation.properties["/category"]={...movedCompact.documentation.properties["/category"],comments:"Edited after rename and move"};
const movedDocumentationCommands=canonicalCommandsFromCompactProjection(moved.document,movedCompact,id);
assert.deepEqual(movedDocumentationCommands.map(({kind})=>kind),["set"],"documentation after rename and move remains one canonical command");
assert.deepEqual(Object.keys(movedDocumentationCommands[0].patch),["documentation"],"reparsed JSON facets retain their canonical rule identities after rename and move");

const libraryCanonical=savedSchemaCanonicalDocument({
  id:"schema:library",name:"Library",version:4,document:{type:"object",properties:{article_type:{type:"string",enum:["News","Guide"],rules:[{id:"source-rule",kind:"pattern",pattern:"^[A-Z]",severity:"error",message:"Capitalized type"}],description:"Article classification",examples:["News"]},metadata:{type:"object",properties:{}}}},
  attachedRules:[{id:"library-rule",version:1,propertyPath:"/article_type",operator:"regular-expression",parameters:"^[A-Z]"}],documentation:{description:"Library documentation"},
},id);
const libraryArticleType=Object.values(libraryCanonical.nodes).find(({name})=>name==="article_type"),libraryMetadata=Object.values(libraryCanonical.nodes).find(({name})=>name==="metadata");
const libraryRenamed=applyCanonicalCommand(libraryCanonical,{kind:"rename",baseRevision:libraryCanonical.revision,propertyId:libraryArticleType.id,name:"article_kind"});
const libraryMoved=applyCanonicalCommand(libraryRenamed.document,{kind:"move",baseRevision:libraryRenamed.document.revision,propertyId:libraryArticleType.id,parentId:libraryMetadata.id});
const libraryCompact=compactSchemaProjection(libraryMoved.document,{id:"schema:library",name:"Library",version:libraryMoved.document.revision});
libraryCompact.documentation.properties["/metadata/article_kind"]={...libraryCompact.documentation.properties["/metadata/article_kind"],comments:"Edited library documentation"};
const libraryDocumentationCommands=canonicalCommandsFromCompactProjection(libraryMoved.document,libraryCompact,id);
assert.deepEqual(Object.keys(libraryDocumentationCommands[0].patch),["documentation"],"embedded and attached saved-schema rules remain unchanged by documentation after rename and move");

const persistedRulesCanonical=savedSchemaCanonicalDocument({
  id:"schema:persisted-rules",name:"Persisted rules",version:4,document:{type:"object",properties:{article_type:{type:"string"}}},
  rules:[{id:"rule:types",name:"Article types",version:2,propertyPath:"/article_type",operator:"allowed-values",allowedValues:["News","Guide"],severity:"warning",message:"Choose an article type"}],
},id),persistedRuleNode=Object.values(persistedRulesCanonical.nodes)[0];
assert.deepEqual(persistedRuleNode.allowedValues.map(({value})=>value),["News","Guide"],"the Saved Schema Library rules field supplies canonical allowed values");
assert.equal(persistedRuleNode.rules[0].revision,2,"the Saved Schema Library rules field retains source revision metadata");

const compactSource={
  ...canonical,
  revision:8,
  nodes:{
    ...canonical.nodes,
    [category.id]:{
      ...category,
      presence:{mode:"required-when",condition:{kind:"all",children:[{kind:"predicate",propertyId:article.id,operator:"Equals",value:"News"},{kind:"not",children:[{kind:"predicate",propertyId:category.id,operator:"Contains",value:"Draft"}]}]}},
      rules:category.rules.map((rule)=>rule.id==="rule:category"?{...rule,condition:{kind:"all",children:[{kind:"any",children:[{kind:"predicate",propertyId:category.id,operator:"Equals",value:"News"},{kind:"predicate",propertyId:category.id,operator:"Starts with",value:"Guide"}]},{kind:"not",children:[{kind:"predicate",propertyId:category.id,operator:"Contains",value:"Draft"}]}]}}:rule),
    },
  },
};
const compact=compactSchemaProjection(compactSource,{id:"schema:article",name:"Article",version:8});
assert.equal(compact.canonicalSchema,undefined,"the compact renderer receives a projection instead of a nested standalone-editor payload");
const descriptionOnlySource={...compactSource,nodes:{...compactSource.nodes,[category.id]:{...compactSource.nodes[category.id],documentation:{displayText:"",description:"Migrated description",comments:"",example:{method:"custom",value:"MIGRATED"}}}}};
const descriptionOnlyProjection=compactSchemaProjection(descriptionOnlySource,{id:"schema:migrated",name:"Migrated",version:1});
assert.deepEqual(descriptionOnlyProjection.documentation.properties["/article/category"],{displayName:"",description:"Migrated description",example:{value:"MIGRATED",selectionMethod:"custom"}},"description-only migration documentation and custom examples remain visible in the compact projection");
const compactConditionalRule=compact.attachedRules.find(({id})=>id==="rule:category");
assert.equal(compactConditionalRule.conditionGroup,undefined,"the compact adapter never translates canonical predicates through the legacy flat conditionGroup");
compact.documentation.properties["/article/category"]={
  ...compact.documentation.properties["/article/category"],
  description:"Changed through compact panel",
};
const compactCommands=canonicalCommandsFromCompactProjection(compactSource,compact,id);
assert.deepEqual(compactCommands.map(({kind})=>kind),["set"],"one compact facet edit emits one property-scoped canonical command");
assert.equal(compactCommands[0].propertyId,category.id,"compact edits retain the canonical property identity");
assert.deepEqual(Object.keys(compactCommands[0].patch),["documentation"],"the compact adapter sends only the facet the operator changed");
const compactResult=applyCanonicalCommand(compactSource,compactCommands[0]);
assert.equal(compactResult.document.nodes[category.id].documentation.description,"Changed through compact panel");
assert.equal(compactResult.document.nodes[category.id].presence.mode,"required-when","projection edits preserve conditional presence owned by canonical state");
assert.deepEqual(compactResult.document.nodes[category.id].presence.condition,compactSource.nodes[category.id].presence.condition,"compact projection edits preserve the nested conditional-presence tree unchanged");
assert.deepEqual(compactResult.document.nodes[category.id].rules.find(({id})=>id==="rule:category").condition,compactSource.nodes[category.id].rules.find(({id})=>id==="rule:category").condition,"compact projection edits preserve the nested rule tree unchanged");
const nestedRule=compactSource.nodes[category.id].rules.find(({id})=>id==="rule:category").condition;
assert.equal(validateCanonicalPredicateTree(compactSource,nestedRule).ready,true);
assert.equal(canonicalPredicateText(compactSource,nestedRule),"All (Any (category Equals News or category Starts with Guide) and Not (category Contains Draft))");
assert.deepEqual(canonicalPredicateLeafFromInput(compactSource,category.id,"Equals","News"),{ready:true,predicate:{kind:"predicate",propertyId:category.id,operator:"Equals",value:"News"}},"the simple Equals News operand remains supported by the canonical editor");
assert.deepEqual(canonicalPredicateLeafFromInput(compactSource,category.id,"Starts with","/news/"),{ready:true,predicate:{kind:"predicate",propertyId:category.id,operator:"Starts with",value:"/news/"}},"typed string operators are authored directly in the canonical tree");
assert.equal(canonicalPredicateLeafFromInput(compactSource,article.id,"Starts with","/news/").ready,false,"an incompatible typed operator blocks the exact canonical predicate operand");
assert.equal(canonicalPredicateLeafFromInput(compactSource,category.id,"Matches pattern","[").ready,false,"an invalid regular expression blocks the exact canonical predicate operand");

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
