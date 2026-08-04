import assert from "node:assert/strict";
import {
  canonicalCommandsFromCompactProjection,
  compactCanonicalCommandPolicy,
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
assert.deepEqual(compactCanonicalCommandPolicy("select",true),{semantic:false,allowed:true,settles:false},"selection remains navigable while an unrelated semantic save settles");
assert.deepEqual(compactCanonicalCommandPolicy("view",true),{semantic:false,allowed:true,settles:false},"view changes remain navigable and never start settlement");
assert.deepEqual(compactCanonicalCommandPolicy("set",true),{semantic:true,allowed:false,settles:true},"overlapping semantic changes remain blocked until settlement completes");
assert.deepEqual(compactCanonicalCommandPolicy("rename",false),{semantic:true,allowed:true,settles:true},"semantic changes settle normally when no save is pending");
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
const projectionMetadataSource=structuredClone(saved);projectionMetadataSource.document.properties.article.properties.category.typeMismatchTreatment="ignore";projectionMetadataSource.document.properties.article.properties.category.propertyOrigin="manual";
const projectionMetadataRoundTrip=savedSchemaFromCanonical(projectionMetadataSource,canonical);
assert.equal(projectionMetadataRoundTrip.document.properties.article.properties.category.typeMismatchTreatment,"ignore","projection-only type-mismatch treatment survives a canonical render made from an older source snapshot");
assert.equal(projectionMetadataRoundTrip.document.properties.article.properties.category.propertyOrigin,"manual","projection-only property origin survives a canonical render made from an older source snapshot");
const projectionMetadataRename=applyCanonicalCommand(canonical,{kind:"rename",baseRevision:canonical.revision,propertyId:category.id,name:"classification"}),renamedProjectionMetadata=savedSchemaFromCanonical(projectionMetadataSource,projectionMetadataRename.document);
assert.equal(renamedProjectionMetadata.document.properties.article.properties.classification.typeMismatchTreatment,"ignore","projection-only type-mismatch treatment follows stable identity through a canonical rename");
assert.equal(renamedProjectionMetadata.document.properties.article.properties.classification.propertyOrigin,"manual","projection-only property origin follows stable identity through a canonical rename");
const reloaded=savedSchemaCanonicalDocument(roundTrip,()=>{throw new Error("reload must not regenerate canonical identities");});
assert.deepEqual(reloaded,canonical,"reloading a saved schema restores the exact canonical document");
const published=publishSchemaWorkingDraft(createSchemaWorkingDraft(roundTrip));
assert.deepEqual(published.canonicalSchema,canonical,"publishing carries canonical identities and rich facets into the immutable saved revision");

const arraySource={id:"schema:array-item-type",name:"Array item type",version:1,assignments:[],document:{type:"object",properties:{tags:{type:"array",items:{type:"string"}}}}};
const unconstrainedArrayCanonical=savedSchemaCanonicalDocument(arraySource,id),tagsNode=Object.values(unconstrainedArrayCanonical.nodes).find(({name})=>name==="tags");
delete tagsNode.itemType;
assert.equal(savedSchemaFromCanonical(arraySource,unconstrainedArrayCanonical).document.properties.tags.items,undefined,"clearing an array item type keeps the JSON array unconstrained instead of silently restoring string items");

const pathKeyedSource={id:"schema:path-keyed-types",name:"Path-keyed types",version:1,assignments:[],document:{type:"object",required:["/page_type"],properties:{"/page_type":{type:"string"},"/page_levels":{type:"array"},"/page_levels/0":{type:"string"}}}};
const pathKeyedCanonical=savedSchemaCanonicalDocument(pathKeyedSource,id),pathKeyedPageType=Object.values(pathKeyedCanonical.nodes).find(({name,parentId})=>name==="page_type"&&!parentId),pathKeyedPageLevels=Object.values(pathKeyedCanonical.nodes).find(({name,parentId})=>name==="page_levels"&&!parentId),pathKeyedFirstLevel=Object.values(pathKeyedCanonical.nodes).find(({name,parentId})=>name==="0"&&parentId===pathKeyedPageLevels?.id);
assert.equal(pathKeyedPageType?.type,"string","a flat /page_type definition retains its declared scalar type during canonical migration");
assert.equal(pathKeyedPageType?.presence.mode,"required","a flat /page_type required declaration retains its presence during canonical migration");
assert.equal(pathKeyedPageLevels?.type,"array","a flat /page_levels definition retains its declared array type during canonical migration");
assert.equal(pathKeyedFirstLevel?.type,"string","a flat /page_levels/0 definition is resolved by its complete path instead of an absent nested property");
const pathKeyedPolicyCanonical=applyCanonicalCommand(pathKeyedCanonical,{kind:"policy",baseRevision:pathKeyedCanonical.revision,onlyDefinedFields:true});
assert.equal(pathKeyedPolicyCanonical.status,"applied");
const pathKeyedPolicyProjection=savedSchemaFromCanonical(pathKeyedSource,pathKeyedPolicyCanonical.document);
assert.deepEqual(pathKeyedPolicyProjection.document,{...pathKeyedSource.document,additionalProperties:false},"a policy-only canonical edit preserves path-keyed properties and required declarations byte-for-byte");

const identityDocument={type:"object",properties:{"/page_type":{type:"string",propertyOrigin:"manual"},"/page_levels":{type:"array"},"/page_levels/0":{type:"string"},products:{type:"array",items:{type:"object",properties:{name:{type:"string"}}}}}};
const identitySource={id:"schema:identity",name:"Identity",version:4,assignments:[],document:identityDocument,attachedRules:[],documentation:{properties:{"/page_type":{displayName:"Page classification",description:"Business page type"}}}};
const identityCanonical=savedSchemaCanonicalDocument(identitySource,id);
assert.deepEqual(savedSchemaFromCanonical(identitySource,identityCanonical).document,identityDocument,"separate property documentation does not normalize or annotate the source JSON document during a no-op projection");
const projectIdentityAttachment=(attachment)=>{
  const projection={...savedSchemaFromCanonical(identitySource,identityCanonical),attachedRules:[attachment]};
  let current=identityCanonical;
  for(const command of canonicalCommandsFromCompactProjection(identityCanonical,projection,id)){
    const result=applyCanonicalCommand(current,{...command,baseRevision:current.revision});
    assert.notEqual(result.status,"conflict");assert.notEqual(result.status,"confirmation-required");current=result.document;
  }
  return savedSchemaFromCanonical(projection,current);
};
const identityRequired=projectIdentityAttachment({id:"local-rule:required",name:"Required for /page_type",version:1,propertyPath:"/page_type",operator:"required",severity:"error",enabled:true});
assert.deepEqual(identityRequired.document,identityDocument,"attaching a Required rule preserves the path-keyed source document byte-for-byte");
const identityReusable=projectIdentityAttachment({id:"rule:approved-page-types",name:"Approved page types",version:2,propertyPath:"/page_type",operator:"allowed-values",parameters:"homepage,checkout",severity:"error",enabled:true});
assert.deepEqual(identityReusable.document,identityDocument,"attaching a reusable Allowed values rule preserves the path-keyed source document byte-for-byte");

const conditionalSource={
  id:"schema:conditional-projection",name:"Conditional projection",version:2,published:true,assignments:[],
  document:{type:"object",properties:{market:{type:"string"},minimum:{type:"number"},target:{type:"string"}}},
  attachedRules:[
    {id:"rule:flat-condition",name:"Flat condition",version:4,propertyPath:"/target",operator:"exact-value",parameters:"ready",severity:"warning",conditionGroup:{operator:"Any",predicates:[
      {propertyPath:"market",operator:"Equals",comparison:{type:"string",value:"retail"},detectedType:"string"},
      {propertyPath:"/minimum",operator:"Is at least",comparison:{type:"number",value:3},detectedType:"number"},
    ]}},
    {id:"rule:partial-condition",name:"Partially unresolved condition",version:5,propertyPath:"/target",operator:"required",severity:"error",conditionGroup:{operator:"All",predicates:[
      {propertyPath:"/market",operator:"Exists",detectedType:"string"},
      {propertyPath:"/missing-trigger",operator:"Does not exist",detectedType:"string"},
    ]},opaqueMetadata:{source:"extension-v1"}},
    {id:"rule:dangling-condition",name:"Dangling opaque condition",version:6,propertyPath:"/removed-target",operator:"vendor-condition",severity:"warning",conditionGroup:{operator:"All",predicates:[{propertyPath:"/vendor-trigger",operator:"Vendor equals",comparison:{type:"string",value:"opaque"}}]},vendorPayload:{mode:"strict"}},
  ],
};
const conditionalCanonical=savedSchemaCanonicalDocument(conditionalSource,id),conditionalTarget=Object.values(conditionalCanonical.nodes).find(({name})=>name==="target"),conditionalMarket=Object.values(conditionalCanonical.nodes).find(({name})=>name==="market"),conditionalMinimum=Object.values(conditionalCanonical.nodes).find(({name})=>name==="minimum"),conditionalRoundTrip=savedSchemaFromCanonical(conditionalSource,conditionalCanonical);
assert.deepEqual(conditionalRoundTrip.attachedRules,conditionalSource.attachedRules,"flat conditions plus partially and wholly unresolved attachments survive a no-op canonical projection losslessly");
assert.deepEqual(conditionalRoundTrip.attachedRules.map(({id})=>id),["rule:flat-condition","rule:partial-condition","rule:dangling-condition"],"retained opaque attachments are ordered once alongside canonical-projected rules");

const changedFlatCanonical=structuredClone(conditionalCanonical),changedFlatRule=changedFlatCanonical.nodes[conditionalTarget.id].rules.find(({id})=>id==="rule:flat-condition");
changedFlatRule.condition={kind:"all",children:[
  {kind:"predicate",propertyId:conditionalMarket.id,operator:"Does not equal",value:"wholesale"},
  {kind:"predicate",propertyId:conditionalMinimum.id,operator:"At most",value:7},
]};
const changedFlatProjection=savedSchemaFromCanonical(conditionalSource,changedFlatCanonical),changedFlatAttachment=changedFlatProjection.attachedRules.find(({id})=>id==="rule:flat-condition");
assert.deepEqual(changedFlatAttachment.conditionGroup,{operator:"All",predicates:[
  {propertyPath:"/market",operator:"Does not equal",comparison:{type:"string",value:"wholesale"},detectedType:"string"},
  {propertyPath:"/minimum",operator:"Is at most",comparison:{type:"number",value:7},detectedType:"number"},
]},"a changed flat canonical All tree is projected back with legacy operators, typed values, and detected property types");

const nestedCanonical=structuredClone(changedFlatCanonical),nestedFlatRule=nestedCanonical.nodes[conditionalTarget.id].rules.find(({id})=>id==="rule:flat-condition");
nestedFlatRule.condition={kind:"all",children:[{kind:"not",children:[{kind:"predicate",propertyId:conditionalMarket.id,operator:"Equals",value:"retail"}]}]};
const nestedProjection=savedSchemaFromCanonical(conditionalSource,nestedCanonical),nestedAttachment=nestedProjection.attachedRules.find(({id})=>id==="rule:flat-condition");
assert.equal(nestedAttachment.conditionGroup,undefined,"nested and Not canonical predicates are never flattened into the legacy conditionGroup shape");
assert.deepEqual(nestedProjection.canonicalSchema.nodes[conditionalTarget.id].rules.find(({id})=>id==="rule:flat-condition").condition,nestedFlatRule.condition,"a canonical-only nested predicate remains intact in persisted canonical state");

const ruleOwned={
  id:"schema:rule-owned",name:"Rule owned",version:4,published:true,assignments:[],
  document:{type:"object",properties:{required_value:{type:"string"},allowed_value:{type:"string"}}},
  attachedRules:[
    {id:"rule:required-value",name:"Required value",version:3,propertyPath:"/required_value",operator:"required",severity:"error"},
    {id:"rule:allowed-value",name:"Allowed value",version:5,propertyPath:"/allowed_value",operator:"allowed-values",parameters:"one,two",severity:"error"},
  ],
};
const ruleOwnedRoundTrip=savedSchemaFromCanonical(ruleOwned,savedSchemaCanonicalDocument(ruleOwned,id));
assert.equal(ruleOwnedRoundTrip.document.required,undefined,"an attached required rule is not duplicated into the JSON required facet");
assert.equal(ruleOwnedRoundTrip.document.properties.allowed_value.enum,undefined,"an attached allowed-values rule is not duplicated into the JSON enum facet");
assert.deepEqual(ruleOwnedRoundTrip.attachedRules,ruleOwned.attachedRules,"source-owned validation facets retain their rule identity and revision");

const intentionalJsonAndRule={
  ...ruleOwned,id:"schema:intentional-json-and-rule",name:"Intentional JSON and rule",
  document:{type:"object",required:["required_value"],properties:{required_value:{type:"string"},allowed_value:{type:"string",enum:["json-one","json-two"]},container:{type:"object",properties:{anchor:{type:"boolean"}}}}},
};
const intentionalDualCanonical=savedSchemaCanonicalDocument(intentionalJsonAndRule,id),intentionalDualAllowed=Object.values(intentionalDualCanonical.nodes).find(({name})=>name==="allowed_value");
assert.deepEqual(intentionalDualAllowed.allowedValues.map(({value})=>value),["one","two"],"canonical validation uses the attached allowed-values rule without replacing its independent JSON enum source");
const intentionalJsonAndRuleRoundTrip=savedSchemaFromCanonical(intentionalJsonAndRule,intentionalDualCanonical);
assert.deepEqual(intentionalJsonAndRuleRoundTrip.document,intentionalJsonAndRule.document,"intentional source JSON facets remain alongside source-owned rules without being removed");
assert.deepEqual(intentionalJsonAndRuleRoundTrip.attachedRules,intentionalJsonAndRule.attachedRules,"intentional source JSON plus rule ownership retains every rule field and order");
const intentionalDualRequired=Object.values(intentionalDualCanonical.nodes).find(({name})=>name==="required_value"),intentionalDualContainer=Object.values(intentionalDualCanonical.nodes).find(({name})=>name==="container");
const renamedDualRequired=applyCanonicalCommand(intentionalDualCanonical,{kind:"rename",baseRevision:intentionalDualCanonical.revision,propertyId:intentionalDualRequired.id,name:"renamed_required"});
const renamedDualAllowed=applyCanonicalCommand(renamedDualRequired.document,{kind:"rename",baseRevision:renamedDualRequired.document.revision,propertyId:intentionalDualAllowed.id,name:"renamed_allowed"});
const movedDualRequired=applyCanonicalCommand(renamedDualAllowed.document,{kind:"move",baseRevision:renamedDualAllowed.document.revision,propertyId:intentionalDualRequired.id,parentId:intentionalDualContainer.id});
const movedDualAllowed=applyCanonicalCommand(movedDualRequired.document,{kind:"move",baseRevision:movedDualRequired.document.revision,propertyId:intentionalDualAllowed.id,parentId:intentionalDualContainer.id,afterId:intentionalDualRequired.id});
const intentionalDualRebased=savedSchemaFromCanonical(intentionalJsonAndRule,movedDualAllowed.document),intentionalDualRules=Object.fromEntries(intentionalDualRebased.attachedRules.map((rule)=>[rule.id,rule]));
assert.equal(intentionalDualRebased.document.required,undefined,"moving a dual-owned required property removes its JSON membership from the old container");
assert.deepEqual(intentionalDualRebased.document.properties.container.required,["renamed_required"],"the independently owned JSON required facet follows stable identity across rename and move");
assert.deepEqual(intentionalDualRebased.document.properties.container.properties.renamed_allowed.enum,["json-one","json-two"],"the divergent JSON enum follows stable identity without adopting attached-rule values");
assert.equal(intentionalDualRules["rule:required-value"].propertyPath,"/container/renamed_required","the attached required rule independently rebases to the current canonical path");
assert.equal(intentionalDualRules["rule:allowed-value"].propertyPath,"/container/renamed_allowed","the attached allowed-values rule independently rebases to the current canonical path");
assert.equal(intentionalDualRules["rule:allowed-value"].parameters,"one,two","rebasing preserves the divergent attached allowed-values payload");

const nestedRuleOwned={
  id:"schema:nested-rule-owned",name:"Nested rule owned",version:2,published:true,assignments:[],
  document:{type:"object",properties:{context:{type:"object",required:["required_value"],properties:{required_value:{type:"string"},allowed_value:{type:"string",enum:["json-nested"]}}},items:{type:"array",items:{type:"object",required:["required_sku"],properties:{required_sku:{type:"string"},allowed_sku:{type:"string",enum:["json-sku"]}}}}}},
  attachedRules:[
    {id:"rule:nested-required",name:"Nested required",version:2,propertyPath:"/context/required_value",operator:"required",severity:"error"},
    {id:"rule:nested-allowed",name:"Nested allowed",version:3,propertyPath:"/context/allowed_value",operator:"allowed-values",parameters:"one,two",severity:"error"},
    {id:"rule:array-required",name:"Array required",version:4,propertyPath:"/items/*/required_sku",operator:"required",severity:"error"},
    {id:"rule:array-allowed",name:"Array allowed",version:5,propertyPath:"/items/*/allowed_sku",operator:"allowed-values",parameters:"A,B",severity:"error"},
  ],
};
const nestedRuleOwnedRoundTrip=savedSchemaFromCanonical(nestedRuleOwned,savedSchemaCanonicalDocument(nestedRuleOwned,id));
assert.deepEqual(nestedRuleOwnedRoundTrip.document.properties.context.required,["required_value"],"nested object JSON required ownership remains independent from its attached rule");
assert.deepEqual(nestedRuleOwnedRoundTrip.document.properties.context.properties.allowed_value.enum,["json-nested"],"nested object JSON enum remains independent from divergent attached values");
assert.deepEqual(nestedRuleOwnedRoundTrip.document.properties.items.items.required,["required_sku"],"array-item JSON required ownership remains independent from its attached rule");
assert.deepEqual(nestedRuleOwnedRoundTrip.document.properties.items.items.properties.allowed_sku.enum,["json-sku"],"array-item JSON enum remains independent from divergent attached values");
assert.deepEqual(nestedRuleOwnedRoundTrip.attachedRules,nestedRuleOwned.attachedRules,"nested object and array-item rule identities, revisions, paths, and order survive projection");
const nestedDualCanonical=savedSchemaCanonicalDocument(nestedRuleOwned,id),nestedRequiredSku=Object.values(nestedDualCanonical.nodes).find(({name})=>name==="required_sku"),nestedAllowedSku=Object.values(nestedDualCanonical.nodes).find(({name})=>name==="allowed_sku"),nestedContext=Object.values(nestedDualCanonical.nodes).find(({name})=>name==="context");
const renamedNestedRequired=applyCanonicalCommand(nestedDualCanonical,{kind:"rename",baseRevision:nestedDualCanonical.revision,propertyId:nestedRequiredSku.id,name:"sku_required"});
const movedNestedAllowed=applyCanonicalCommand(renamedNestedRequired.document,{kind:"move",baseRevision:renamedNestedRequired.document.revision,propertyId:nestedAllowedSku.id,parentId:nestedContext.id});
const nestedDualRebased=savedSchemaFromCanonical(nestedRuleOwned,movedNestedAllowed.document),nestedDualRules=Object.fromEntries(nestedDualRebased.attachedRules.map((rule)=>[rule.id,rule]));
assert.deepEqual(nestedDualRebased.document.properties.items.items.required,["sku_required"],"array-item JSON required membership rebases after a canonical rename");
assert.deepEqual(nestedDualRebased.document.properties.context.properties.allowed_sku.enum,["json-sku"],"an array-item JSON enum survives an identity-preserving move into an object");
assert.equal(nestedDualRules["rule:array-required"].propertyPath,"/items/*/sku_required","the parallel array-item required rule rebases independently");
assert.equal(nestedDualRules["rule:array-allowed"].propertyPath,"/context/allowed_sku","the parallel allowed-values rule follows the moved node independently");
assert.equal(nestedDualRules["rule:array-allowed"].parameters,"A,B","the moved JSON enum never overwrites the attached rule's divergent values");

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
const inheritedProvenance={source:"path-constraint",sourceId:"profile:sitewide",contributorId:"profile:sitewide",contributorName:"Sitewide",scope:"Shared Profile",state:"inherited"},composedTargetId="property:composed:lineOfCustomer",composedBlankId="property:composed:shippingLabel",composedProjectionSource={id:"canonical:effective:shipping",revision:73,state:"Draft",contributorId:"page:shipping",contributorName:"Shipping",rootIds:[composedTargetId,composedBlankId],view:"tree",nodes:{
  [composedTargetId]:{id:composedTargetId,name:"lineOfCustomer",order:0,type:"string",presence:{mode:"required"},allowedValues:[{id:"allowed-value:retail",value:"retail",provenance:[inheritedProvenance]}],rules:[{id:"rule:retail",name:"Retail customer pattern",kind:"pattern",pattern:"^retail",condition:{kind:"all",id:"condition:retail",children:[{kind:"predicate",id:"condition:retail:leaf",propertyId:composedTargetId,operator:"Equals",value:"retail"}]},severity:"error",message:"Use a retail customer code",provenance:inheritedProvenance}],documentation:{displayText:"",description:"Customer classification",comments:"",example:{method:"custom",value:"retail"}},provenance:[inheritedProvenance],overrideReferences:[]},
  [composedBlankId]:{id:composedBlankId,name:"shippingLabel",order:1,type:"string",presence:{mode:"optional"},allowedValues:[{id:"allowed-value:blank",value:"",provenance:[inheritedProvenance]}],rules:[],documentation:{displayText:"",description:"Presented shipping options",comments:"",example:{method:"custom",value:"C:\\Temp"}},provenance:[inheritedProvenance],overrideReferences:[]},
}},composedDocumentationProjection=compactSchemaProjection(composedProjectionSource,{id:"page:shipping",name:"Shipping",version:73});
composedDocumentationProjection.documentation.properties["/lineOfCustomer"]={...composedDocumentationProjection.documentation.properties["/lineOfCustomer"],description:"Changed composed documentation"};
const composedDocumentationCommands=canonicalCommandsFromCompactProjection(composedProjectionSource,composedDocumentationProjection,id);
assert.equal(composedDocumentationCommands.length,1,"a composed documentation edit does not materialize unchanged inherited values as extra commands");
assert.equal(composedDocumentationCommands[0].propertyId,composedTargetId,"the composed documentation command remains scoped to the edited property");
assert.deepEqual(Object.keys(composedDocumentationCommands[0].patch),["documentation"],"the composed projection preserves inherited value and rule ownership metadata outside the edited documentation facet");
const openDocument={...compactSource,onlyDefinedFields:false},closedProjection=structuredClone(compactSchemaProjection(openDocument,{id:"schema:article",name:"Article",version:8}));closedProjection.document.additionalProperties=false;
assert.deepEqual(canonicalCommandsFromCompactProjection(openDocument,closedProjection,id).map(({kind})=>kind),["policy"],"closing undeclared properties emits one canonical schema-policy command");
const closedDocument={...compactSource,onlyDefinedFields:true},openProjection=structuredClone(compactSchemaProjection(closedDocument,{id:"schema:article",name:"Article",version:8}));delete openProjection.document.additionalProperties;
assert.deepEqual(canonicalCommandsFromCompactProjection(closedDocument,openProjection,id).map(({kind})=>kind),["policy"],"reopening undeclared properties emits one canonical schema-policy command");
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
const addedProjectionSource=compactSchemaProjection(compactSource,{id:"schema:article",name:"Article",version:8}),addedSavedSchema=savedSchemaFromCanonical(addedProjectionSource,addedResult);
assert.equal(addedSavedSchema.document.properties.article.properties.section.propertyOrigin,"manual","an operator-created canonical property remains identified as Manual when projected into the Saved Schema working draft");

const arrayParentSource={id:"schema:array-parent",name:"Array parent",version:1,assignments:[],document:{type:"object",properties:{products:{type:"array",items:{type:"object",properties:{name:{type:"string"}}}}}}};
const arrayParentCanonical=savedSchemaCanonicalDocument(arrayParentSource,id),productsNode=Object.values(arrayParentCanonical.nodes).find(({name})=>name==="products"),arrayParentProjection=compactSchemaProjection(arrayParentCanonical,{id:arrayParentSource.id,name:arrayParentSource.name,version:1});
arrayParentProjection.document.properties.products.items.properties.product_id={type:"number"};
const arrayChildCommands=canonicalCommandsFromCompactProjection(arrayParentCanonical,arrayParentProjection,id),arrayChildAdd=arrayChildCommands.find(({kind,name})=>kind==="add"&&name==="product_id");
assert.equal(arrayChildAdd?.parentId,productsNode.id,"a wildcard item path resolves to its structural array node instead of adding the property at the schema root");

const removedProjection=structuredClone(compactSchemaProjection(compactSource,{id:"schema:article",name:"Article",version:8}));
delete removedProjection.document.properties.article.properties.category;
const removedCommands=canonicalCommandsFromCompactProjection(compactSource,removedProjection,id);
assert.deepEqual(removedCommands.map(({kind})=>kind),["delete"],"compact removal emits one canonical subtree command");
assert.equal(removedCommands[0].propertyId,category.id);

assert.deepEqual(compactConditionalPresence("required-when",article.id,"Equals","News"),{
  mode:"required-when",condition:{kind:"predicate",propertyId:article.id,operator:"Equals",value:"News"},
},"compact conditional controls author the chosen typed predicate instead of an Exists fallback");

console.log("data-layer unified side-panel schema editor tests passed");
