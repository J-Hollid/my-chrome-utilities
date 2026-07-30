import assert from "node:assert/strict";
import {
  composedCanonicalSchema,
  composedSchemaWorkspace,
  resetComposedSchemaLocalProperty,
  saveComposedCanonicalDocument,
  saveComposedEntitySchemaPolicy,
  saveComposedEventCanonicalDocument,
  saveEventOccurrenceCanonicalDocument,
  saveFlowContributorSchemaPolicy,
  saveFlowPageInstanceCanonicalDocument,
  saveFlowPageInstanceSchemaPolicy,
  saveComposedSchemaLocalFacets,
  saveComposedSchemaPolicy,
  saveComposedSchemaLocalFacetsAndStructures,
} from "../dist/data-layer-composed-schema-workspace.js";
import {applyCanonicalCommand,canonicalPropertyPath} from "../dist/data-layer-canonical-schema.js";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {composedReviewFacetDelta,composedReviewLifecycleInventory} from "../dist/data-layer-composed-schema-workspace-rows.js";
import {composedFacetDraft,sparseComposedFacets} from "../dist/data-layer-composed-schema-builders.js";
import {saveFlowPageInstanceLocalFacetsAndStructures} from "../dist/data-layer-layered-schema-project.js";
import {composedTableQuickEditFacets,composedTableResetFacet} from "../dist/data-layer-composed-schema-workspace-ui.js";
import {resetComposedDefinitionFacet} from "../dist/data-layer-composed-schema-workspace-focused-sections.js";
import {focusedStructureOwned} from "../dist/data-layer-canonical-schema-focused-drafts.js";

const state=createSpecificationProject({name:"Composed schemas",site:"shop.example",id:(kind)=>`${kind}:workspace`});
state.project.collections.profiles.push({id:"profile:sitewide",name:"Sitewide",schemaConstraints:[
  {path:"/page_name",type:"string"},
  {path:"/funnel_name",type:"string",expectedValue:"checkout",enforcement:"invariant"},
  {path:"/funnel_step",type:"string",allowedValues:["2","3a","3b"]},
  {path:"/page_type",type:"string"},
]});
state.project.collections.pageGroups.push(
  {id:"group:checkout",name:"Checkout",profileId:"profile:sitewide",schemaConstraints:[{path:"/funnel_step",expectedValue:"3b",enforcement:"overridable"}]},
  {id:"group:retail",name:"Retail Checkout",schemaConstraints:[{path:"/funnel_step",expectedValue:"3a",enforcement:"overridable"}]},
);
state.project.collections.pages.push({id:"page:cart",name:"Cart",profileId:"profile:sitewide",pageGroupIds:["group:checkout","group:retail"],schemaConstraints:[{path:"/funnel_step",expectedValue:"2"}]});

const cart=state.project.collections.pages[0];
const literalRuleState=structuredClone(state),literalRulePage=literalRuleState.project.collections.pages[0],literalRule={id:"rule:page-name-prefix",name:"Page-name prefix",kind:"starts-with",literal:"checkout-",severity:"error"};
literalRulePage.schemaConstraints.push({path:"/page_name",rules:[literalRule]});
const literalRuleProjection=composedCanonicalSchema(literalRuleState,literalRulePage,"Page"),literalRuleNode=Object.values(literalRuleProjection.nodes).find((node)=>canonicalPropertyPath(literalRuleProjection,node.id)==="/page_name");
assert.deepEqual(
  literalRuleNode.rules.map(({id,name,kind,literal,severity})=>({id,name,kind,literal,severity})),
  [literalRule],
  "composed contributor projection preserves String literal rule identity and operand",
);
const closedCart=saveComposedSchemaPolicy(state,"pages",cart.id,true);
assert.equal(closedCart.project.collections.pages[0].onlyDefinedFields,true,"a composed schema policy persists independently from property contributions");
assert.deepEqual(closedCart.project.collections.pages[0].schemaConstraints,cart.schemaConstraints,"the schema policy command does not rewrite property definitions");
const canonicalPolicyState=structuredClone(state),canonicalPolicyPage=canonicalPolicyState.project.collections.pages[0];canonicalPolicyPage.canonicalSchema={id:"canonical:page-policy",contributorId:canonicalPolicyPage.id,contributorName:canonicalPolicyPage.name,revision:0,rootIds:[],nodes:{},changes:[]};canonicalPolicyPage.onlyDefinedFields=false;
const canonicalClosed=saveComposedSchemaPolicy(canonicalPolicyState,"pages",canonicalPolicyPage.id,true),storedCanonicalPolicy=canonicalClosed.project.collections.pages[0];
assert.equal(storedCanonicalPolicy.canonicalSchema.onlyDefinedFields,true,"Page policy persists through its canonical schema boundary");
assert.equal(storedCanonicalPolicy.canonicalSchema.revision,1,"the policy toggle records one canonical schema-scoped command");
assert.equal(Object.hasOwn(storedCanonicalPolicy,"onlyDefinedFields"),false,"a canonical Page never retains a competing entity-level policy");
const compactPolicyState=structuredClone(state),compactPolicyEvent={id:"event:canonical-policy",name:"Canonical policy event",canonicalSchema:{id:"canonical:event-policy",contributorId:"event:canonical-policy",contributorName:"Canonical policy event",revision:4,rootIds:[],nodes:{},changes:[],onlyDefinedFields:false},onlyDefinedFields:true};
compactPolicyState.project.collections.events.push(compactPolicyEvent);
const compactClosed=saveComposedEntitySchemaPolicy(compactPolicyState,"events",compactPolicyEvent.id,true),storedCompactPolicy=compactClosed.project.collections.events.find(({id})=>id===compactPolicyEvent.id);
assert.equal(storedCompactPolicy.canonicalSchema.onlyDefinedFields,true,"the compact Event policy updates the canonical value that compilation prefers");
assert.equal(storedCompactPolicy.canonicalSchema.revision,5,"the compact Event policy records one canonical schema-scoped command");
assert.equal(Object.hasOwn(storedCompactPolicy,"onlyDefinedFields"),false,"the compact Event policy removes a stale competing entity value");
const flowPolicyState=structuredClone(state),flowId="flow:canonical-policy",canonicalFlowEntity=(id,name)=>({id,name,canonicalSchema:{id:`canonical:${id}`,contributorId:id,contributorName:name,revision:2,rootIds:[],nodes:{},changes:[],onlyDefinedFields:false},onlyDefinedFields:true});
flowPolicyState.project.documentationFlowGraphs={};
flowPolicyState.project.documentationFlowGraphs[flowId]={pageFrames:[canonicalFlowEntity("frame:canonical-policy","Canonical policy frame")],occurrences:[canonicalFlowEntity("occurrence:canonical-policy","Canonical policy occurrence")]};
const flowClosed=saveFlowContributorSchemaPolicy(flowPolicyState,flowId,"occurrences","occurrence:canonical-policy",true),storedOccurrence=flowClosed.project.documentationFlowGraphs[flowId].occurrences[0];
assert.equal(storedOccurrence.canonicalSchema.onlyDefinedFields,true,"the compact occurrence policy updates the canonical value that compilation prefers");
assert.equal(storedOccurrence.canonicalSchema.revision,3,"the compact occurrence policy records one canonical schema-scoped command");
assert.equal(Object.hasOwn(storedOccurrence,"onlyDefinedFields"),false,"the compact occurrence policy removes a stale competing entity value");
const frameClosed=saveFlowPageInstanceSchemaPolicy(flowClosed,flowId,"frame:canonical-policy",true),storedFrame=frameClosed.project.documentationFlowGraphs[flowId].pageFrames[0];
assert.equal(storedFrame.canonicalSchema.onlyDefinedFields,true,"the Flow workspace policy uses the same canonical-aware persistence boundary");
assert.equal(Object.hasOwn(storedFrame,"onlyDefinedFields"),false,"the Flow workspace policy removes a stale competing entity value");
const workspace=composedSchemaWorkspace(state,cart,"Page");
const quickStep=workspace.rows.find(({path})=>path==="/page_name");
assert.deepEqual(composedTableQuickEditFacets(quickStep,"description","Cart step"),{documentation:"Cart step"},"an inherited composed Description edit creates only its sparse local facet");
assert.deepEqual(composedTableQuickEditFacets(quickStep,"type","number"),{type:"number"},"an inherited composed Type edit creates only its sparse local facet");
assert.deepEqual(composedTableQuickEditFacets(quickStep,"presence","required"),{presence:"required"},"an inherited composed Presence edit creates only its sparse local facet");
assert.deepEqual(composedTableQuickEditFacets(quickStep,"expected-or-allowed","cart, guest"),{allowedValues:["cart","guest"]},"an inherited composed Allowed values edit does not copy parent facets");
assert.deepEqual(composedTableQuickEditFacets(quickStep,"example","cart"),{examples:["cart"]},"an inherited composed Example edit creates only its typed example facet");
assert.deepEqual(composedTableResetFacet({...quickStep,local:{path:"/page_name",type:"number",presence:"required",documentation:"keep"}},"type"),{presence:"required",documentation:"keep"},"adjacent Type reset removes only the local Type facet");
assert.deepEqual(composedTableResetFacet({...quickStep,local:{path:"/page_name",type:"number",presence:"required",condition:{kind:"predicate"}}},"presence"),{type:"number",condition:{kind:"predicate"}},"adjacent Presence reset leaves Type and conditional Presence rules independent");
assert.equal(workspace.heading,"Effective schema at Cart");
assert.equal(workspace.status,"ready");
assert.deepEqual(workspace.rows.map(({path})=>path),["/funnel_name","/funnel_step","/page_name","/page_type"]);
const step=workspace.rows.find(({path})=>path==="/funnel_step");
assert.equal(step.effective.expectedValue,"2");
assert.equal(step.local.expectedValue,"2");
assert.equal(step.action,"reset");
assert.equal(step.validationState,"warning");
assert.equal(step.message,"Parent difference resolved by Cart override");
assert.deepEqual(step.provenance.map(({contributorName,state})=>({contributorName,state})),[
  {contributorName:"Sitewide",state:"inherited"},
  {contributorName:"Checkout",state:"shadowed"},
  {contributorName:"Retail Checkout",state:"shadowed"},
  {contributorName:"Cart",state:"effective"},
]);
const reviewDelta=composedReviewFacetDelta(step,{type:"number",itemType:undefined,presence:"required",expectedValue:"3b",allowedValues:[],condition:{kind:"all",children:[{kind:"predicate",propertyId:"/page_type",operator:"Exists"}]},rules:[],documentation:"changed",exampleMethod:"custom",exampleValue:"3b"});
assert.ok(reviewDelta.some(({label})=>label==="Edited type"));
assert.ok(reviewDelta.some(({label})=>label==="Edited presence"));
assert.ok(reviewDelta.some(({label})=>label==="Edited expected value"));
assert.ok(reviewDelta.some(({label})=>label==="Edited condition"));
assert.ok(reviewDelta.some(({label})=>label==="Edited documentation"));
assert.ok(reviewDelta.some(({label})=>label==="Edited example"));
assert.deepEqual(composedReviewFacetDelta(step,composedFacetDraft(step.local,step.effective)),[],"unchanged normalized condition and example facets do not appear as edits");
assert.deepEqual(composedReviewLifecycleInventory(true,"reset",new Set(["rule:restored"]),new Set(["value:restored"])),["Reset to parents","Restored rule rule:restored","Restored value value:restored"],"Review inventories reset and restored lifecycle transitions explicitly");
const inheritedOwnedValue={type:"string",allowedValues:["retail"],allowedValueIds:["value:parent"],allowedValueProvenance:[{id:"value:parent",state:"inherited"}]};
const overriddenOwnedValue={type:"string",allowedValues:["retail"],allowedValueIds:["value:local"],allowedValueProvenance:[{id:"value:local",state:"overridden",source:"focused-editor"}],condition:{kind:"all",children:[{kind:"any",children:[],id:"condition:any"}],id:"condition:root"},rules:[],documentation:"",exampleMethod:"blank"};
assert.deepEqual(sparseComposedFacets(overriddenOwnedValue,inheritedOwnedValue),{allowedValues:["retail"],allowedValueIds:["value:local"],allowedValueProvenance:[{id:"value:local",state:"overridden",source:"focused-editor"}],condition:{kind:"all",children:[{kind:"any",children:[],id:"condition:any"}],id:"condition:root"}},"a same-valued override retains the local identity, ownership, payload, and condition item bytes");
assert.equal(JSON.stringify(composedFacetDraft({condition:overriddenOwnedValue.condition},overriddenOwnedValue).condition),JSON.stringify(overriddenOwnedValue.condition),"condition group identity and property order survive draft reconstruction");
const parentDefinition={path:"/customer",type:"string",allowedValues:["retail"],documentation:"Parent description"},localDefinition={path:"/customer",allowedValues:["retail","business"],documentation:"Local description"},definitionDraft=composedFacetDraft(localDefinition,{...parentDefinition,...localDefinition}),resetDescription=resetComposedDefinitionFacet(definitionDraft,parentDefinition,"description");
assert.deepEqual(sparseComposedFacets(resetDescription,parentDefinition),{allowedValues:["retail","business"]},"resetting Description deletes only that sparse facet while preserving local Allowed values");
assert.deepEqual(composedFacetDraft(localDefinition,parentDefinition).allowedValues,["retail","business"],"draft reconstruction prefers the explicit local Allowed facet over a stale effective projection");
assert.equal(workspace.rows.find(({path})=>path==="/page_name").action,"override");

const reset=resetComposedSchemaLocalProperty(state,"pages","page:cart","/funnel_step");
assert.deepEqual(reset.project.collections.pages[0].schemaConstraints,[]);
assert.equal(composedSchemaWorkspace(reset,reset.project.collections.pages[0],"Page").rows.find(({path})=>path==="/funnel_step").effective.expectedValue,"3a");
assert.match(reset.history.undo.at(-1).label,/Reset \/funnel_step to parents/);

const saved=saveComposedSchemaLocalFacets(reset,"pages","page:cart","/funnel_step",{expectedValue:"2"});
assert.deepEqual(saved.project.collections.pages[0].localSchemaContributions,[{path:"/funnel_step",expectedValue:"2"}],"only the changed local facet is stored");
assert.equal(composedSchemaWorkspace(saved,saved.project.collections.pages[0],"Page").rows.find(({path})=>path==="/funnel_step").effective.expectedValue,"2");
const sparseProjection=composedCanonicalSchema(saved,saved.project.collections.pages[0],"Page"),sparseStep=Object.values(sparseProjection.nodes).find((node)=>canonicalPropertyPath(sparseProjection,node.id)==="/funnel_step");
assert.equal(focusedStructureOwned(sparseStep),false,"a saved sparse Definition override remains structurally inherited when the canonical editor reopens");

const structureOverride=saveComposedSchemaLocalFacetsAndStructures(saved,"pages","page:cart","/funnel_step",{expectedValue:"2"},[{kind:"rename",path:"/funnel_step",name:"checkout_step"}],(kind)=>`${kind}:owned`);
assert.deepEqual(structureOverride.project.collections.pages[0].localSchemaContributions,[{path:"/checkout_step",expectedValue:"2",definitionId:"property:owned"}],"an explicit structural transition establishes a local definition identity");
const structureProjection=composedCanonicalSchema(structureOverride,structureOverride.project.collections.pages[0],"Page"),ownedStep=Object.values(structureProjection.nodes).find((node)=>canonicalPropertyPath(structureProjection,node.id)==="/checkout_step");
assert.equal(focusedStructureOwned(ownedStep),true,"the explicit structural identity remains owned after save and reopen");

const movedOverride=saveComposedSchemaLocalFacetsAndStructures(saved,"pages","page:cart","/funnel_step",{expectedValue:"2"},[{kind:"move-later",path:"/funnel_step"}],(kind)=>`${kind}:moved`);
assert.deepEqual(movedOverride.project.collections.pages[0].localSchemaContributions,[{path:"/funnel_step",expectedValue:"2",definitionId:"property:moved"}],"Override plus Move establishes durable local structural identity even without a local sibling");
const movedProjection=composedCanonicalSchema(movedOverride,movedOverride.project.collections.pages[0],"Page"),movedStep=Object.values(movedProjection.nodes).find((node)=>canonicalPropertyPath(movedProjection,node.id)==="/funnel_step");
assert.equal(focusedStructureOwned(movedStep),true,"Move-established structural identity remains owned after save and reopen");
const inheritedAgain=saveComposedSchemaLocalFacets(saved,"pages","page:cart","/funnel_step",{});
assert.deepEqual(inheritedAgain.project.collections.pages[0].localSchemaContributions,[],"an empty sparse override does not persist a path-only local contribution");
assert.equal(composedSchemaWorkspace(inheritedAgain,inheritedAgain.project.collections.pages[0],"Page").rows.find(({path})=>path==="/funnel_step").action,"override");
const identityOnlyMove=saveComposedSchemaLocalFacetsAndStructures(inheritedAgain,"pages","page:cart","/page_name",{},[{kind:"move-later",path:"/page_name"}],(kind)=>`${kind}:identity-only`);
assert.deepEqual(identityOnlyMove.project.collections.pages[0].localSchemaContributions,[{path:"/page_name",definitionId:"property:identity-only"}],"Override plus Move retains an identity-only local structural record");

const structuredPage=saveComposedSchemaLocalFacetsAndStructures(inheritedAgain,"pages","page:cart","/page_name",{},[{kind:"add-child",path:"/page_name",name:"locale"}],(kind)=>`${kind}:workspace`);
assert.deepEqual(structuredPage.project.collections.pages[0].localSchemaContributions,[{path:"/page_name/locale",type:"string",definitionId:"property:workspace"}],"Page structure changes are stored as sparse local contributions");
assert.ok(composedSchemaWorkspace(structuredPage,structuredPage.project.collections.pages[0],"Page").rows.some(({path})=>path==="/page_name/locale"),"Page structure changes immediately reproject into the composed workspace");
const deletePageState=structuredClone(inheritedAgain),deletePage=deletePageState.project.collections.pages[0];deletePage.localSchemaContributions=[{path:"/local",type:"string"},{path:"/local/child",type:"number"},{path:"/keep",type:"boolean"}];const deletePageHistory=deletePageState.history.undo.length,deletedPageProperty=saveComposedSchemaLocalFacetsAndStructures(deletePageState,"pages","page:cart","/local",{type:"string",documentation:"staged focused-row value"},[{kind:"delete",path:"/local"}],(kind)=>`${kind}:workspace`);
assert.deepEqual(deletedPageProperty.project.collections.pages[0].localSchemaContributions,[{path:"/keep",type:"boolean"}],"a reviewed Page delete suppresses the ordinary focused-row facet save for the deleted property and its subtree");
assert.equal(deletedPageProperty.history.undo.length,deletePageHistory+1,"a Page structure delete and focused-row save remain one project command");
const deleteFrameState=structuredClone(inheritedAgain);deleteFrameState.project.documentationFlowGraphs={"flow:delete":{pageFrames:[{id:"frame:delete",name:"Delete frame",localSchemaContributions:[{path:"/local",type:"string"},{path:"/local/child",type:"number"},{path:"/keep",type:"boolean"}]}]}};const deleteFrameHistory=deleteFrameState.history.undo.length,deletedFrameProperty=saveFlowPageInstanceLocalFacetsAndStructures(deleteFrameState,"flow:delete","frame:delete","/local",{type:"string",documentation:"staged focused-row value"},[{kind:"delete",path:"/local"}],(kind)=>`${kind}:workspace`);
assert.deepEqual(deletedFrameProperty.project.documentationFlowGraphs["flow:delete"].pageFrames[0].localSchemaContributions,[{path:"/keep",type:"boolean"}],"a reviewed Flow Page-instance delete suppresses the ordinary focused-row facet save for the deleted property and its subtree");
assert.equal(deletedFrameProperty.history.undo.length,deleteFrameHistory+1,"a Flow Page-instance structure delete and focused-row save remain one project command");

const eventState=structuredClone(inheritedAgain);
eventState.project.collections.events.push({id:"event:purchase",name:"Purchase",profileId:"profile:sitewide",canonicalSchema:{id:"canonical:event",contributorId:"event:purchase",contributorName:"Purchase",revision:0,rootIds:[],nodes:{},changes:[],source:{identity:"event:purchase",revision:0,provenance:"project"}}});
const purchase=eventState.project.collections.events[0],eventDocument=composedCanonicalSchema(eventState,purchase,"Event"),eventPageName=Object.values(eventDocument.nodes).find((node)=>canonicalPropertyPath(eventDocument,node.id)==="/page_name");
assert.ok(eventPageName,"the Event canonical editor projection includes inherited properties");
const eventRuleResult=applyCanonicalCommand(eventDocument,{kind:"set",baseRevision:eventDocument.revision,propertyId:eventPageName.id,patch:{documentation:{...eventPageName.documentation,description:"Purchase page name"}}});
assert.equal(eventRuleResult.status,"applied");
const savedEvent=saveComposedEventCanonicalDocument(eventState,purchase.id,eventRuleResult.document);
assert.equal(savedEvent.project.collections.events.length,1);
assert.deepEqual(savedEvent.project.collections.events[0].localSchemaContributions,[{path:"/page_name",documentation:"Purchase page name"}],"an inherited Event edit persists only its sparse local difference");
assert.ok(savedEvent.project.collections.events[0].canonicalSchema,"the Event retains its canonical editor identity after saving a composed projection");

const effectiveDocument=composedCanonicalSchema(inheritedAgain,inheritedAgain.project.collections.pages[0],"Page"),effectiveStep=Object.values(effectiveDocument.nodes).find((node)=>canonicalPropertyPath(effectiveDocument,node.id)==="/funnel_step");
assert.equal(effectiveDocument.source.provenance,"project-composed-effective");
assert.ok(effectiveStep,"the canonical Tree/Table projection contains inherited parent properties");
assert.deepEqual(effectiveStep.provenance.map(({contributorName})=>contributorName),["Sitewide","Checkout","Retail Checkout"]);
const overriddenResult=applyCanonicalCommand(effectiveDocument,{kind:"set",baseRevision:effectiveDocument.revision,propertyId:effectiveStep.id,patch:{expectedValue:"2"}});
assert.equal(overriddenResult.status,"applied");
const effectiveOverride=saveComposedCanonicalDocument(inheritedAgain,"pages","page:cart",overriddenResult.document);
assert.deepEqual(effectiveOverride.project.collections.pages[0].localSchemaContributions,[{path:"/funnel_step",expectedValue:"2"}],"an effective-core command stores only the sparse local difference");
const overriddenProjection=composedCanonicalSchema(effectiveOverride,effectiveOverride.project.collections.pages[0],"Page"),overriddenStep=Object.values(overriddenProjection.nodes).find((node)=>canonicalPropertyPath(overriddenProjection,node.id)==="/funnel_step");
const resetResult=applyCanonicalCommand(overriddenProjection,{kind:"delete",baseRevision:overriddenProjection.revision,propertyId:overriddenStep.id});
assert.equal(resetResult.status,"applied");
const effectiveReset=saveComposedCanonicalDocument(effectiveOverride,"pages","page:cart",resetResult.document),resetProjection=composedCanonicalSchema(effectiveReset,effectiveReset.project.collections.pages[0],"Page");
assert.deepEqual(effectiveReset.project.collections.pages[0].localSchemaContributions,[]);
assert.ok(Object.values(resetProjection.nodes).some((node)=>canonicalPropertyPath(resetProjection,node.id)==="/funnel_step"&&node.expectedValue==="3a"),"reset removes the local facet and reprojects the live inherited property in the same core");

const localOnly=saveComposedSchemaLocalFacets(saved,"pages","page:cart","/cart_note",{type:"string",documentation:"Cart-only note"});
assert.equal(composedSchemaWorkspace(localOnly,localOnly.project.collections.pages[0],"Page").rows.find(({path})=>path==="/cart_note").action,"remove");

const ownershipState=createSpecificationProject({name:"Ownership projection",site:"shop.example",id:(kind)=>`${kind}:ownership`});
ownershipState.project.collections.profiles.push({id:"profile:ownership",name:"Ownership profile",schemaConstraints:[{path:"/owned",type:"string",allowedValues:["parent"],allowedValueIds:["value:parent"],allowedValueProvenance:[{id:"value:parent",state:"local",source:"profile"}],rules:[{id:"rule:parent",kind:"pattern",pattern:"^parent",severity:"error",message:"Parent rule",provenance:{source:"path-constraint",state:"local"}}]}]});
ownershipState.project.collections.pageGroups.push({id:"group:ownership",name:"Ownership group",profileId:"profile:ownership",localSchemaContributions:[{path:"/owned",allowedValues:["parent"],allowedValueIds:["value:group"],allowedValueProvenance:[{id:"value:group",state:"overridden",source:"group"}],rules:[{id:"rule:group",kind:"custom",severity:"warning",message:"Group rule",provenance:{source:"created",state:"local"}}]}]});
ownershipState.project.collections.pages.push({id:"page:ownership",name:"Ownership page",profileId:"profile:ownership",pageGroupIds:["group:ownership"],localSchemaContributions:[{path:"/owned",rules:[{id:"rule:page",kind:"custom",severity:"error",message:"Page rule",provenance:{source:"created",state:"local"}}]}]});
const ownershipGroup=ownershipState.project.collections.pageGroups[0],groupProjection=composedCanonicalSchema(ownershipState,ownershipGroup,"Page Group"),groupOwned=Object.values(groupProjection.nodes).find((node)=>canonicalPropertyPath(groupProjection,node.id)==="/owned");
assert.deepEqual(groupOwned.rules.map(({id,provenance})=>({id,state:provenance?.state,contributorId:provenance?.contributorId})),[{id:"rule:parent",state:"inherited",contributorId:"profile:ownership"},{id:"rule:group",state:"local",contributorId:"group:ownership"}],"Page Group compact projection retains per-rule ownership and the actual contributor");
assert.deepEqual(groupOwned.allowedValues.map(({id,provenance})=>({id,state:provenance?.[0]?.state,contributorId:provenance?.[0]?.contributorId})),[{id:"value:group",state:"overridden",contributorId:"group:ownership"}],"Page Group compact projection retains stable value identity and overridden ownership");
const ownershipPage=ownershipState.project.collections.pages[0],pageProjection=composedCanonicalSchema(ownershipState,ownershipPage,"Page"),pageOwned=Object.values(pageProjection.nodes).find((node)=>canonicalPropertyPath(pageProjection,node.id)==="/owned");
assert.deepEqual(pageOwned.rules.map(({id,provenance})=>({id,state:provenance?.state,contributorId:provenance?.contributorId})),[{id:"rule:parent",state:"inherited",contributorId:"profile:ownership"},{id:"rule:group",state:"inherited",contributorId:"group:ownership"},{id:"rule:page",state:"local",contributorId:"page:ownership"}],"Page compact projection exposes the complete inherited/local rule action matrix with actual origins");
assert.deepEqual(pageOwned.allowedValues.map(({id,provenance})=>({id,state:provenance?.[0]?.state,contributorId:provenance?.[0]?.contributorId})),[{id:"value:group",state:"inherited",contributorId:"group:ownership"}],"Page compact projection rebases parent-local value ownership to inherited without changing identity or origin");
const ownershipRoundTrip=saveComposedCanonicalDocument(ownershipState,"pages",ownershipPage.id,pageProjection),storedOwnership=ownershipRoundTrip.project.collections.pages[0].localSchemaContributions;
assert.deepEqual(storedOwnership.map(({path,rules,allowedValues})=>({path,ruleIds:rules?.map(({id})=>id),ruleStates:rules?.map(({provenance})=>provenance?.state),allowedValues})),[{path:"/owned",ruleIds:["rule:page"],ruleStates:["local"],allowedValues:undefined}],"unchanged compact persistence stores only locally owned items and never materializes inherited rules or values");
assert.equal(storedOwnership[0].definitionId,undefined,"facet-only compact persistence does not accidentally claim inherited structure ownership");
const sameCountEdit=structuredClone(ownershipState);sameCountEdit.project.collections.pages[0].localSchemaContributions[0].rules[0].message="Changed in the same sparse row";assert.notEqual(composedCanonicalSchema(sameCountEdit,sameCountEdit.project.collections.pages[0],"Page").revision,pageProjection.revision,"opaque composed tokens change when an existing local facet changes without changing contribution count");
const unrelatedEdit=structuredClone(ownershipState);unrelatedEdit.project.collections.events.push({id:"event:unrelated-token",name:"Unrelated token"});assert.equal(composedCanonicalSchema(unrelatedEdit,unrelatedEdit.project.collections.pages[0],"Page").revision,pageProjection.revision,"opaque composed tokens ignore unrelated contributors");
const parentEdit=structuredClone(ownershipState);parentEdit.project.collections.profiles[0].schemaConstraints[0].documentation="Parent token changed";assert.notEqual(composedCanonicalSchema(parentEdit,parentEdit.project.collections.pages[0],"Page").revision,pageProjection.revision,"opaque composed tokens change with a parent in the live contributor path");

const allScopes=structuredClone(ownershipState);allScopes.project.collections.events.push({id:"event:ownership",name:"Ownership event",profileId:"profile:ownership",localSchemaContributions:[{path:"/eventOnly",type:"string"}]});allScopes.project.collections.flows.push({id:"flow:ownership",name:"Ownership flow"});allScopes.project.documentationFlowGraphs={"flow:ownership":{pageFrames:[{id:"frame:ownership",name:"Ownership frame",pageId:"page:ownership",pageGroupId:"group:ownership",localSchemaContributions:[{path:"/frameOnly",type:"string"}]}],occurrences:[{id:"occurrence:ownership",name:"Ownership occurrence",pageFrameId:"frame:ownership",eventId:"event:ownership",localSchemaContributions:[{path:"/occurrenceOnly",type:"string"}]}]}};
const frame=allScopes.project.documentationFlowGraphs["flow:ownership"].pageFrames[0],frameProjection=composedCanonicalSchema(allScopes,frame,"Flow Page-instance","flow:ownership"),frameOwned=Object.values(frameProjection.nodes).find((node)=>canonicalPropertyPath(frameProjection,node.id)==="/owned");
assert.ok(frameOwned&&Object.values(frameProjection.nodes).some((node)=>canonicalPropertyPath(frameProjection,node.id)==="/frameOnly"),"Flow Page-instance compact projection includes its inherited branch and sparse local branch");
const frameEdited=applyCanonicalCommand(frameProjection,{kind:"set",baseRevision:frameProjection.revision,propertyId:frameOwned.id,patch:{documentation:{...frameOwned.documentation,description:"Frame override",comments:"Frame comment override"}}}),savedFrame=saveFlowPageInstanceCanonicalDocument(allScopes,"flow:ownership",frame.id,frameEdited.document),savedFrameRecord=savedFrame.project.documentationFlowGraphs["flow:ownership"].pageFrames[0];
assert.deepEqual(savedFrameRecord.localSchemaContributions.map(({path})=>path).sort(),["/frameOnly","/owned"],"Flow Page-instance compact persistence remains sparse");
const restoredFrame=saveFlowPageInstanceCanonicalDocument(savedFrame,"flow:ownership",frame.id,frameProjection),restoredFrameProjection=composedCanonicalSchema(restoredFrame,restoredFrame.project.documentationFlowGraphs["flow:ownership"].pageFrames[0],"Flow Page-instance","flow:ownership"),restoredFrameOwned=Object.values(restoredFrameProjection.nodes).find((node)=>canonicalPropertyPath(restoredFrameProjection,node.id)==="/owned");
assert.equal(restoredFrameOwned.documentation.description,frameOwned.documentation.description,"Flow Page-instance compact Undo restores the prior composed document instead of retaining the saved local documentation");
assert.equal(restoredFrameOwned.documentation.comments,frameOwned.documentation.comments,"Flow Page-instance compact Undo restores prior comments");
const occurrence=allScopes.project.documentationFlowGraphs["flow:ownership"].occurrences[0],occurrenceProjection=composedCanonicalSchema(allScopes,occurrence,"Event-occurrence","flow:ownership"),occurrenceOwned=Object.values(occurrenceProjection.nodes).find((node)=>canonicalPropertyPath(occurrenceProjection,node.id)==="/owned");
assert.ok(occurrenceOwned&&Object.values(occurrenceProjection.nodes).some((node)=>canonicalPropertyPath(occurrenceProjection,node.id)==="/eventOnly")&&Object.values(occurrenceProjection.nodes).some((node)=>canonicalPropertyPath(occurrenceProjection,node.id)==="/occurrenceOnly"),"Event-occurrence compact projection includes Page and Event inheritance plus its sparse branch");
const occurrenceEdited=applyCanonicalCommand(occurrenceProjection,{kind:"set",baseRevision:occurrenceProjection.revision,propertyId:occurrenceOwned.id,patch:{documentation:{...occurrenceOwned.documentation,description:"Occurrence override"}}}),savedOccurrence=saveEventOccurrenceCanonicalDocument(allScopes,"flow:ownership",occurrence.id,occurrenceEdited.document),savedOccurrenceRecord=savedOccurrence.project.documentationFlowGraphs["flow:ownership"].occurrences[0];
assert.deepEqual(savedOccurrenceRecord.localSchemaContributions.map(({path})=>path).sort(),["/occurrenceOnly","/owned"],"Event-occurrence compact persistence remains sparse");

const blocked=structuredClone(localOnly);
blocked.project.collections.pageGroups.push({id:"group:partner",name:"Partner Checkout",schemaConstraints:[{path:"/funnel_name",type:"number"},{path:"/funnel_step",type:"number"}]});
blocked.project.collections.pages[0].pageGroupIds.push("group:partner");
const blockedWorkspace=composedSchemaWorkspace(blocked,blocked.project.collections.pages[0],"Page");
assert.equal(blockedWorkspace.status,"blocked");
assert.equal(blockedWorkspace.rows.find(({path})=>path==="/funnel_step").local.expectedValue,"2","the sparse local expectation survives an uncovered parent type conflict");
assert.equal(blockedWorkspace.rows.find(({path})=>path==="/funnel_step").validationState,"blocked");
assert.ok(blockedWorkspace.rows.find(({path})=>path==="/funnel_name").repairs.some((repair)=>repair.contributorId==="group:partner"));

console.log("data-layer composed schema workspace tests passed");
