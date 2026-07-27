import assert from "node:assert/strict";
import {activateFocusedOwnershipSection,focusedConditionLabel,focusedDefinitionFieldLabels,focusedOwnershipActionTarget,focusedOwnershipActions,focusedOwnershipSectionEditable,focusedPropertyLayerSequence,focusedPropertyLifecycleOperation,focusedPropertyProvenanceSummary,focusedPropertySections,focusedRuleFields,focusedSectionOwnershipActions,focusedSparseDelta} from "../dist/data-layer-focused-schema-property-ui.js";
import {applyCanonicalCommand,canonicalPredicateIds,canonicalPredicateWithStableIds,createCanonicalSchema} from "../dist/data-layer-canonical-schema.js";
import {canonicalFlatPredicateIssue} from "../dist/canonical-schema/predicate-policy.js";
import {canonicalNavigatorRows} from "../dist/canonical-schema-focused/navigator-rows.js";
import {focusedSourceState} from "../dist/data-layer-canonical-schema-focused-drafts.js";
import {schemaTableCellMetadata,schemaTableColumns,schemaTableEditableFacets,schemaTableExpectedOrAllowed,schemaTableOverlayPlacement,schemaTableOverlayStyle,schemaTableQuickEditDestination,schemaTableQuickEditIntent,schemaTableRuleConditionSummary,schemaTableValueFacet} from "../dist/data-layer-schema-table.js";
import {sharedConditionOperators,sharedFlatConditionResult,sharedFlatConditionRows} from "../dist/data-layer-shared-condition-tree-editor.js";

assert.deepEqual(focusedPropertySections,["definition","rules","structure"]);
assert.deepEqual(focusedDefinitionFieldLabels,["Type","Array item type","Presence","Allowed values","Display text","Description","Comments","Example method","Example value"],"the in-panel Definition child exposes the complete canonical definition capability");
assert.deepEqual(focusedPropertyLayerSequence(),["menu"],"opening property actions mounts only the first menu layer");
assert.deepEqual(focusedPropertyLayerSequence("definition"),["menu","definition"],"opening Definition retains the first menu beside its child");
assert.deepEqual(focusedPropertyLayerSequence("rules","review"),["menu","rules","review"],"Review remains nested after the retained menu and Rules child");
assert.deepEqual(schemaTableColumns.map(({label})=>label),["Property","Path","Type","Presence","Description","Allowed values","Example","Source","Local/effective state","Validation state"],"every contributor table exposes the same information-rich columns");
assert.deepEqual(schemaTableCellMetadata,schemaTableColumns.map(({key,label})=>({key,label})),"every narrow stacked cell retains its visible column identity");
assert.equal(new Set(schemaTableCellMetadata.map(({key})=>key)).size,schemaTableColumns.length,"stacked cell identities remain unique");
assert.match(schemaTableOverlayStyle,/position:fixed/,"the property overlay is placed against the browser viewport");
assert.doesNotMatch(schemaTableOverlayStyle,/position:absolute/,"the property overlay is never positioned by a property row");
assert.deepEqual(
  schemaTableOverlayPlacement(
    {left:40,right:64,top:120,bottom:144,width:24,height:24},
    {width:280,height:220},
    {width:800,height:600},
  ),
  {left:72,top:120,width:280,height:220,maxHeight:584},
  "the overlay opens beside its invoking property action when the viewport has room",
);
assert.deepEqual(
  schemaTableOverlayPlacement(
    {left:336,right:356,top:760,bottom:780,width:20,height:20},
    {width:540,height:700},
    {width:360,height:800},
  ),
  {left:8,top:92,width:344,height:700,maxHeight:784},
  "an edge overlay is clamped to the viewport without moving its editor",
);
const compactOverlay=schemaTableOverlayPlacement(
  {left:300,right:324,top:680,bottom:704,width:24,height:24},
  {width:320,height:160},
  {width:800,height:800},
);
const grownOverlay=schemaTableOverlayPlacement(
  {left:300,right:324,top:680,bottom:704,width:24,height:24},
  {width:320,height:300},
  {width:800,height:800},
);
assert.ok(grownOverlay.top<compactOverlay.top,"a growing open layer reflows upward to remain associated with its property action");
assert.deepEqual(
  schemaTableOverlayPlacement(
    {left:300,right:324,top:680,bottom:704,width:24,height:24},
    {width:320,height:900},
    {width:800,height:800},
  ),
  {left:332,top:8,width:320,height:784,maxHeight:784},
  "a layer taller than the viewport receives only the available viewport height",
);
assert.deepEqual(schemaTableEditableFacets,["description","expected-or-allowed","example"],"the three frequent facets are editable without opening an advanced editor");
assert.deepEqual(schemaTableQuickEditIntent("Enter",false),{kind:"commit"},"Enter commits without leaving the current cell");
assert.deepEqual(schemaTableQuickEditIntent("Tab",false),{kind:"commit",direction:1},"Tab commits and advances");
assert.deepEqual(schemaTableQuickEditIntent("Tab",true),{kind:"commit",direction:-1},"Shift+Tab commits and reverses");
assert.deepEqual(schemaTableQuickEditIntent("Escape",false),{kind:"cancel"},"Escape cancels the transient cell edit");
assert.equal(schemaTableQuickEditIntent("ArrowRight",false),undefined,"ordinary editing keys remain native");
const quickCells=[
  {path:"/first",facet:"description"},{path:"/first",facet:"expected-or-allowed"},{path:"/first",facet:"example"},
  {path:"/second",facet:"description"},{path:"/second",facet:"expected-or-allowed"},{path:"/second",facet:"example"},
];
assert.deepEqual(schemaTableQuickEditDestination(quickCells,quickCells[0],1),quickCells[1],"forward traversal stays within the editable facet order");
assert.deepEqual(schemaTableQuickEditDestination(quickCells,quickCells[2],1),quickCells[3],"forward traversal crosses into the next property");
assert.deepEqual(schemaTableQuickEditDestination(quickCells,quickCells[3],-1),quickCells[2],"reverse traversal crosses into the previous property");
assert.equal(schemaTableQuickEditDestination(quickCells,quickCells.at(-1),1),undefined,"traversal stops when no editable cell remains");
assert.equal(schemaTableExpectedOrAllowed({expectedValue:"retail",allowedValues:["retail","business"]}),"retail","expected value takes precedence in the summary cell");
assert.equal(schemaTableExpectedOrAllowed({allowedValues:["retail","business"]}),"retail, business","allowed values render as editable human text when there is no single expectation");
assert.deepEqual(schemaTableValueFacet({allowedValues:["retail",2,true]}),{kind:"allowed",text:"retail, 2, true",values:["retail",2,true]});
assert.equal(schemaTableRuleConditionSummary({kind:"predicate",propertyId:"line"},[]), "line choose operator", "an incomplete inherited rule remains inspectable instead of crashing the focused inventory");
assert.deepEqual(focusedOwnershipActions({inherited:true}),["View","Override here","Open source"]);
assert.deepEqual(focusedOwnershipActions({inherited:true,replaceable:true}),["View","Replace here","Open source"]);
assert.deepEqual(focusedOwnershipActions({local:true}),["View","Edit","Remove local"]);
assert.deepEqual(focusedOwnershipActions({overridden:true}),["View","Edit","Reset to parent"]);
assert.deepEqual(focusedOwnershipActions({invariant:true}),["View","Open source"]);
assert.deepEqual(focusedOwnershipActions({conflict:true}),["View conflict","Edit local resolution","Open contributing sources"]);
assert.deepEqual(
  focusedSectionOwnershipActions({local:true}),
  {definition:["View","Edit"],rules:["View","Edit","Remove local"],structure:["Remove local"]},
  "a local property exposes the exact legal actions at its Definition facet, local Rules, and Structure lifecycle targets",
);
assert.deepEqual(
  focusedSectionOwnershipActions({inherited:true}),
  {definition:["View","Override here","Open source"],rules:["View","Override here","Open source"],structure:["Override here"]},
  "an inherited property exposes the named Structure ownership transition",
);
assert.deepEqual(
  focusedSectionOwnershipActions({overridden:true}),
  {definition:["View","Edit"],rules:["View","Edit","Reset to parent"],structure:["Reset to parent"]},
  "an overridden property localizes Reset to parent to owned rules and the whole-property Structure target",
);
assert.deepEqual(
  focusedOwnershipActionTarget("Rules","rule","rule:customer-tier"),
  {section:"Rules",kind:"rule",id:"rule:customer-tier",label:"Rules rule rule:customer-tier"},
  "a section-local ownership control identifies its exact item before it stages a change",
);
assert.deepEqual(
  focusedOwnershipActionTarget("Structure","property","property:line"),
  {section:"Structure",kind:"property",id:"property:line",label:"Structure property property:line"},
  "property lifecycle controls identify the structural item they affect",
);
assert.equal(
  focusedPropertyProvenanceSummary([{contributorName:"Sitewide",state:"inherited"},{contributorName:"Checkout",state:"effective"}]),
  "Provenance · Sitewide · inherited → Checkout · effective",
  "the first property-menu layer names contributor provenance without ownership controls",
);
assert.deepEqual(
  focusedPropertyLifecycleOperation("Reset to parent","property:line"),
  {kind:"delete",propertyId:"property:line"},
  "canonical Reset to parent stages removal of the sparse local property",
);
assert.deepEqual(
  focusedPropertyLifecycleOperation("Remove local","property:line"),
  {kind:"delete",propertyId:"property:line"},
  "canonical Remove local stages removal of only the identified local property",
);
assert.equal(focusedPropertyLifecycleOperation("View","property:line"),undefined,"non-lifecycle ownership actions never stage deletion");

const inheritedOwnership={inherited:true,local:false,activated:[]};
assert.equal(focusedOwnershipSectionEditable(inheritedOwnership,"definition"),false,"an inherited definition starts read-only");
assert.equal(focusedOwnershipSectionEditable(inheritedOwnership,"structure"),false,"inherited structure starts unavailable");
assert.deepEqual(activateFocusedOwnershipSection(inheritedOwnership,"definition","View"),inheritedOwnership,"viewing does not establish ownership");
const activatedOwnership=activateFocusedOwnershipSection(inheritedOwnership,"definition","Override here");
assert.equal(focusedOwnershipSectionEditable(activatedOwnership,"definition"),true,"Override here establishes section-local ownership");
assert.equal(focusedOwnershipSectionEditable(activatedOwnership,"structure"),true,"the named property override establishes ownership for Structure authoring too");
assert.equal(focusedSourceState({provenance:[{state:"conflict"}]}),"conflict");
assert.deepEqual(focusedRuleFields("range"),["condition","minimum","maximum","severity","message"]);
assert.deepEqual(focusedRuleFields("pattern"),["condition","pattern","severity","message"]);
assert.equal(focusedConditionLabel({kind:"all",children:[{kind:"predicate",propertyId:"/page_type",operator:"Equals",value:"trade"}]}),"All (/page_type Equals trade)");
const flatRows=[
  {id:"condition:platform",propertyId:"property:platform",operator:"Is one of",value:["web","app"]},
  {id:"condition:category",propertyId:"property:category",operator:"Starts with",value:"checkout"},
];
assert.deepEqual(sharedFlatConditionResult("all",flatRows),{kind:"all",children:flatRows.map((row)=>({kind:"predicate",...row}))},"a rule stores one top-level match mode and flat condition rows");
assert.deepEqual(sharedFlatConditionRows(sharedFlatConditionResult("all",flatRows)),flatRows,"flat persisted conditions retain their stable row order");
assert.equal(sharedFlatConditionResult("any",[{id:"condition:empty",propertyId:"",operator:""}]),undefined,"an incomplete sole row cannot become a stored rule condition");
assert.ok(sharedConditionOperators("string").includes("Is one of"),"string conditions expose the direct alternative operator");
assert.ok(sharedConditionOperators("array").includes("Contains any of"),"array conditions expose the direct multi-value operator");
assert.deepEqual(focusedSparseDelta({type:"string",presence:"required",documentation:"new"},{type:"string",presence:"optional",documentation:"old"}),{presence:"required",documentation:"new"});
const source=createCanonicalSchema({id:"schema:focused",contributorId:"profile:focused",contributorName:"Focused"});
const property={id:"property:line",name:"lineOfCustomer",order:0,type:"string",presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}},provenance:[{source:"created"}],overrideReferences:[]};
const withProperty={...source,rootIds:[property.id],nodes:{[property.id]:property}};
const selected=applyCanonicalCommand(withProperty,{kind:"select",baseRevision:0,propertyId:property.id});
assert.equal(selected.status,"applied");
assert.equal(selected.document.revision,0,"opening a property is transient and must not advance the Draft");
assert.deepEqual(selected.document.changes,[],"selection must not append a durable change");
const viewed=applyCanonicalCommand(withProperty,{kind:"view",baseRevision:0,view:"table"});
assert.equal(viewed.status,"applied");
assert.equal(viewed.document.revision,0,"switching Tree/Table is transient and must not advance the Draft");
const saved=applyCanonicalCommand(withProperty,{kind:"set",baseRevision:0,propertyId:property.id,patch:{type:"number",documentation:{...property.documentation,description:"atomic"}}});
assert.equal(saved.status,"applied");
assert.equal(saved.document.revision,1,"focused review must commit one property command");
assert.equal(saved.document.changes.length,1,"focused review must produce one Undo/change entry");
const nestedCondition={kind:"all",children:[
  {kind:"any",children:[
    {kind:"predicate",propertyId:property.id,operator:"Equals",value:"retail"},
    {kind:"predicate",propertyId:property.id,operator:"Equals",value:"trade"},
  ]},
  {kind:"predicate",propertyId:property.id,operator:"Exists"},
]};
assert.match(canonicalFlatPredicateIssue(nestedCondition),/nested/i,"nested persisted semantics require explicit migration");
const nestedRule={id:"rule:nested",name:"Nested legacy rule",kind:"presence",presence:"required",condition:nestedCondition,severity:"error"};
const rejectedNestedSave=applyCanonicalCommand(withProperty,{kind:"set",baseRevision:0,propertyId:property.id,patch:{rules:[nestedRule]}});
assert.equal(rejectedNestedSave.status,"conflict","the canonical command boundary rejects a nested rule write");
assert.deepEqual(rejectedNestedSave.document,withProperty,"a rejected nested rule write preserves the stored document byte-for-byte");
const flatRule={...nestedRule,condition:{kind:"any",children:nestedCondition.children[0].children}};
const acceptedFlatSave=applyCanonicalCommand(withProperty,{kind:"set",baseRevision:0,propertyId:property.id,patch:{rules:[flatRule]}});
assert.equal(acceptedFlatSave.status,"applied","the canonical command boundary accepts one-level All or Any rules");
const child={...property,id:"property:child",name:"child",parentId:property.id,order:0};
const objectDocument={...withProperty,nodes:{[property.id]:{...property,type:"object"},[child.id]:child}};
const impact=applyCanonicalCommand(objectDocument,{kind:"set",baseRevision:0,propertyId:property.id,patch:{type:"string"}});
assert.equal(impact.status,"confirmation-required");
const confirmed=applyCanonicalCommand(objectDocument,{kind:"set",baseRevision:0,propertyId:property.id,patch:{type:"string"},confirmed:true});
assert.equal(confirmed.status,"applied");
assert.equal(Object.hasOwn(confirmed.document.nodes,child.id),false,"confirmed destructive type change removes descendants atomically");
assert.equal(confirmed.document.changes.length,1);
const predicate=canonicalPredicateWithStableIds({kind:"all",children:[{kind:"predicate",propertyId:property.id,operator:"Exists"}]},(kind)=>`stable:${kind}`);
assert.deepEqual(canonicalPredicateIds(predicate),["stable:condition-root","stable:condition-root.0"],"canonical predicates retain deterministic item identities");
const structural=applyCanonicalCommand(withProperty,{kind:"set",baseRevision:0,propertyId:property.id,patch:{},operations:[{kind:"rename",propertyId:property.id,name:"renamed"},{kind:"add",id:(kind)=>`added:${kind}`,propertyId:property.id,name:"child",parentId:property.id,type:"string"}]});
assert.equal(structural.status,"applied");
assert.equal(structural.document.revision,1,"a focused structural session commits one revision");
assert.equal(structural.document.changes.length,1,"a focused structural session produces one Undo entry");
assert.ok(Object.values(structural.document.nodes).some(({name})=>name==="child"),"the same atomic command includes staged additions");
const navigatorDocument={...withProperty,rootIds:[property.id,"property:documented","property:conditioned"],nodes:{...withProperty.nodes,"property:documented":{...property,id:"property:documented",name:"alpha",order:1,type:"number",documentation:{...property.documentation,description:"Documented"}},"property:conditioned":{...property,id:"property:conditioned",name:"zeta",order:2,presence:{mode:"required-when",condition:{id:"condition:navigator",kind:"predicate",propertyId:property.id,operator:"Exists"}}}}};
const navigator=(query="",propertyFilter="all",propertySort="tree")=>canonicalNavigatorRows({document:navigatorDocument,query,propertyFilter,propertySort});
assert.deepEqual(navigator("ALP").map(({node})=>node.name),["alpha"],"canonical search filters by multiple characters without requiring a semantic render");
assert.deepEqual(navigator("","documentation").map(({node})=>node.name),["alpha"],"canonical facet filtering is functional");
assert.deepEqual(navigator("","conditions").map(({node})=>node.name),["zeta"],"canonical condition filtering is functional");
assert.deepEqual(navigator("","all","name").map(({node})=>node.name),["alpha","lineOfCustomer","zeta"],"canonical property sorting changes the visible order");
console.log("focused schema property UI tests passed");
