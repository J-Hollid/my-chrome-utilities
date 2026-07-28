import assert from "node:assert/strict";
import {activateFocusedOwnershipSection,focusedConditionLabel,focusedDefinitionFacetOwnershipActions,focusedDefinitionFieldLabels,focusedOwnershipActionTarget,focusedOwnershipActions,focusedOwnershipControlEditable,focusedOwnershipSectionEditable,focusedPropertyLayerSequence,focusedPropertyLifecycleOperation,focusedPropertyProvenanceSummary,focusedPropertySections,focusedRuleFields,focusedSectionOwnershipActions,focusedSparseDelta} from "../dist/data-layer-focused-schema-property-ui.js";
import {applyCanonicalCommand,canonicalPredicateIds,canonicalPredicateWithStableIds,createCanonicalSchema} from "../dist/data-layer-canonical-schema.js";
import {canonicalFlatPredicateIssue} from "../dist/canonical-schema/predicate-policy.js";
import {canonicalNavigatorRows} from "../dist/canonical-schema-focused/navigator-rows.js";
import {focusedSourceState} from "../dist/data-layer-canonical-schema-focused-drafts.js";
import {schemaTableCellMetadata,schemaTableColumns,schemaTableEditableFacets,schemaTableExpectedOrAllowed,schemaTableOverlayPlacement,schemaTableOverlayStyle,schemaTableQuickEditCommitsOnChange,schemaTableQuickEditDestination,schemaTableQuickEditIntent,schemaTableRuleConditionSummary,schemaTableValueFacet} from "../dist/data-layer-schema-table.js";
import {sharedConditionOperators,sharedFlatConditionResult,sharedFlatConditionRows} from "../dist/data-layer-shared-condition-tree-editor.js";

assert.deepEqual(focusedPropertySections,["definition","rules","structure"]);
assert.deepEqual(focusedDefinitionFieldLabels,["Type","Array item type","Presence","Allowed values","Display text","Description","Comments","Example method","Example value"],"the in-panel Definition child exposes the complete canonical definition capability");
assert.deepEqual(focusedPropertyLayerSequence(),["menu"],"opening property actions mounts only the first menu layer");
assert.deepEqual(focusedPropertyLayerSequence("definition"),["menu","definition"],"opening Definition retains the first menu beside its child");
assert.deepEqual(focusedPropertyLayerSequence("rules","review"),["menu","rules","review"],"Review remains nested after the retained menu and Rules child");
assert.deepEqual(schemaTableColumns.map(({label})=>label),["","Path","Concept","Type","Presence","Description","Allowed values","Example","Source","State"],"every contributor table exposes the compact direct-editing columns");
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
assert.deepEqual(schemaTableEditableFacets,["concept","type","presence","description","expected-or-allowed","example"],"the complete ordinary row is editable without opening an advanced editor");
assert.deepEqual(schemaTableQuickEditIntent("Enter",false),{kind:"commit"},"Enter commits without leaving the current cell");
assert.deepEqual(schemaTableQuickEditIntent("Tab",false),{kind:"commit",direction:1},"Tab commits and advances");
assert.deepEqual(schemaTableQuickEditIntent("Tab",true),{kind:"commit",direction:-1},"Shift+Tab commits and reverses");
assert.deepEqual(schemaTableQuickEditIntent("Escape",false),{kind:"cancel"},"Escape cancels the transient cell edit");
assert.equal(schemaTableQuickEditIntent("ArrowRight",false),undefined,"ordinary editing keys remain native");
assert.equal(schemaTableQuickEditCommitsOnChange({tagName:"SELECT"}),true,"pointer selection commits a Type or Presence dropdown immediately");
assert.equal(schemaTableQuickEditCommitsOnChange({tagName:"INPUT"}),false,"text and combobox inputs remain transient until their ordinary commit boundary");
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
assert.deepEqual(focusedOwnershipActions({inherited:true}),["View","Open source"]);
assert.deepEqual(focusedOwnershipActions({inherited:true,replaceable:true}),["View","Replace here","Open source"]);
assert.deepEqual(focusedOwnershipActions({local:true}),["View","Edit","Remove local"]);
assert.deepEqual(focusedOwnershipActions({overridden:true}),["View","Edit","Reset to parent"]);
assert.deepEqual(focusedOwnershipActions({invariant:true}),["View","Open source"]);
assert.deepEqual(focusedOwnershipActions({conflict:true}),["View conflict","Edit local resolution","Open contributing sources"]);
assert.deepEqual(
  focusedSectionOwnershipActions({local:true,structureOwned:true}),
  {definition:["View","Edit"],rules:[],structure:["Remove local"]},
  "a local property leaves Rules ownership to stable rule rows while retaining Definition and Structure actions",
);
assert.deepEqual(
  focusedSectionOwnershipActions({inherited:true,local:true,structureOwned:false}),
  {definition:["View","Edit"],rules:[],structure:["Override here"]},
  "a sparse local Definition facet does not establish ownership of inherited structural identity",
);
assert.deepEqual(
  focusedSectionOwnershipActions({inherited:true}),
  {definition:[],rules:[],structure:["Override here"]},
  "ordinary inherited Definition fields need no ownership action while Structure retains its named identity transition",
);
assert.deepEqual(
  focusedSectionOwnershipActions({inherited:true,replaceable:true}),
  {definition:[],rules:[],structure:["Override here"]},
  "replaceable inherited rule identity is the only inherited rule editing transition",
);
assert.deepEqual(
  focusedSectionOwnershipActions({overridden:true}),
  {definition:["View","Edit"],rules:[],structure:["Reset to parent"]},
  "an overridden property leaves rule lifecycle on item rows and localizes whole-property Reset to Structure",
);
assert.deepEqual(focusedDefinitionFacetOwnershipActions({inherited:true,local:true}),["Reset to parent"],"a sparse local Definition facet exposes an explicit item-local reset");
assert.deepEqual(focusedDefinitionFacetOwnershipActions({inherited:true,local:false}),[],"an unchanged inherited Definition facet has nothing local to reset");
assert.deepEqual(focusedDefinitionFacetOwnershipActions({inherited:false,local:true}),[],"a locally created property has no parent facet to reset to");
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

const inheritedOwnership={inherited:true,local:false,structureOwned:false,activated:[]};
assert.equal(focusedOwnershipSectionEditable(inheritedOwnership,"definition"),true,"ordinary inherited Definition fields start enabled");
assert.equal(focusedOwnershipSectionEditable(inheritedOwnership,"structure"),false,"inherited structure starts unavailable");
assert.deepEqual(activateFocusedOwnershipSection(inheritedOwnership,"definition","View"),inheritedOwnership,"viewing does not establish ownership");
assert.equal(focusedOwnershipSectionEditable({...inheritedOwnership,invariant:true},"definition"),true,"ordinary fields remain editable when the same Definition contains invariant facets");
assert.equal(focusedOwnershipControlEditable({...inheritedOwnership,invariant:true},"definition","propertyType"),false,"an inherited invariant Type facet remains read-only");
assert.equal(focusedOwnershipControlEditable({...inheritedOwnership,invariant:true},"definition","presenceMode"),false,"an inherited invariant Presence facet remains read-only");
assert.equal(focusedOwnershipControlEditable({...inheritedOwnership,invariant:true},"definition","description"),true,"ordinary inherited Description remains editable beside invariant facets");
assert.equal(focusedOwnershipControlEditable(inheritedOwnership,"structure","Add child"),true,"adding a child creates local structure without overriding inherited identity");
assert.equal(focusedOwnershipControlEditable(inheritedOwnership,"structure","Add sibling"),true,"adding a sibling creates local structure without overriding inherited identity");
assert.equal(focusedOwnershipControlEditable(inheritedOwnership,"structure","Duplicate"),true,"duplicating creates local structure without overriding inherited identity");
assert.equal(focusedOwnershipControlEditable(inheritedOwnership,"structure","New local property name"),true,"local structure creation accepts a name without overriding inherited identity");
assert.equal(focusedOwnershipControlEditable(inheritedOwnership,"structure","Remove local sku"),true,"a related local property can be removed without overriding the focused inherited identity");
assert.equal(focusedOwnershipControlEditable(inheritedOwnership,"structure","Rename"),false,"renaming inherited identity requires ownership");
assert.equal(focusedOwnershipControlEditable(inheritedOwnership,"structure","Move earlier"),false,"moving inherited identity requires ownership");
assert.equal(focusedOwnershipControlEditable(inheritedOwnership,"structure","Delete property"),false,"inherited structure cannot be deleted");
const activatedOwnership=activateFocusedOwnershipSection(inheritedOwnership,"structure","Override here");
assert.equal(focusedOwnershipSectionEditable(activatedOwnership,"structure"),true,"Override here establishes structural identity ownership");
assert.equal(focusedOwnershipControlEditable(activatedOwnership,"structure","Rename"),true,"owned structure can be renamed");
assert.equal(focusedOwnershipControlEditable(activatedOwnership,"structure","Delete property"),false,"an inherited property remains undeletable after structural ownership activation");
const sparseDefinitionOwnership={inherited:true,local:true,structureOwned:false,activated:[]};
assert.equal(focusedOwnershipSectionEditable(sparseDefinitionOwnership,"structure"),false,"a sparse inherited Definition edit leaves Structure locked after save and reopen");
assert.equal(focusedOwnershipControlEditable(sparseDefinitionOwnership,"structure","Rename"),false,"a sparse inherited Description never unlocks Rename");
assert.equal(focusedOwnershipControlEditable(sparseDefinitionOwnership,"structure","Move later"),false,"a sparse inherited allowed value never unlocks Move");
assert.deepEqual(focusedSectionOwnershipActions(sparseDefinitionOwnership).structure,["Override here"],"the cross-facet transition remains explicit");
const sparseDefinitionActivated=activateFocusedOwnershipSection(sparseDefinitionOwnership,"structure","Override here");
assert.equal(focusedOwnershipControlEditable(sparseDefinitionActivated,"structure","Rename"),true,"explicit Structure activation unlocks Rename for the current staged session");
assert.equal(focusedOwnershipControlEditable(sparseDefinitionActivated,"structure","Move later"),true,"explicit Structure activation unlocks Move for the current staged session");
const createdOwnership={inherited:false,local:true,structureOwned:true,activated:[]};
assert.equal(focusedOwnershipSectionEditable(createdOwnership,"structure"),true,"a locally created property retains direct structural editing");
assert.equal(focusedOwnershipControlEditable(createdOwnership,"structure","Delete property"),true,"a locally created property retains direct deletion");
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
