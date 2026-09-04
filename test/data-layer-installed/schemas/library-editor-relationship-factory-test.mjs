import assert from "node:assert/strict";
import { createSchemaLibraryEditorRelationshipDomain } from "../../../dist/data-layer-installed/schemas/library-editor-relationship-factory.js";
import { SchemaLibraryController } from "../../../dist/data-layer-installed/schemas/library-controller.js";

let configured=false;SchemaLibraryController.prototype.configure=function(){configured=true;};
const storage={getItem(){return null;},setItem(){},removeItem(){}};
const domain=createSchemaLibraryEditorRelationshipDomain({storage,changed(){}},{query:null,category:null,scrollOwner:null,panel:null,list:null,emptyState:null,count:null,storage,scheduleFrame(run){run();}});
const connected=domain.connect({root:{querySelector(){return null;}},document:undefined,elements:{library:{importFile:null,importReview:null,importReviewSummary:null,deleteReview:null,deleteReviewSummary:null,exportButton:null,exportChoices:null,exportReview:null},result:null,list:null,detail:null,editor:null,detailEmpty:null,name:null,propertyFilter:null,subviews:[],panels:[],liveEventQuery:null,specificationBuilder:null,revisionSelector:null,createButton:null},
  canonical:{},canonicalView:{openSaved(){}},persistence:{close(){},beginSettlement(){return 1;},clearSettlement(){},render(){}},property:{},propertyView:{render(){}},rule:{rules:[],persist(){},render(){}},assignment:{render(){}},lifecycle:{isMounted(){return true;},generation(){return 1;}},route:{open(){},mount(){},dispose(){},close(){},invokingReference(){}},
  download(){},showSchemas(){},renderSpecification(){},relationship(){return [];},adopt(){},openContributor(){},openContributorInStudio(){},openProject(){},reportMissing(){},activeProjectId(){},ensureContributors(){return Promise.resolve({name:"Project"});},refreshLive(){return 0;},proposeName(schema){return schema;}});
assert.equal(configured,true);assert.equal(typeof connected.workflow.openDraft,"function");
const disposed=[];connected.hydration.reset=() => disposed.push("hydration");domain.relationshipTree.dispose=() => disposed.push("tree");domain.dispose();assert.deepEqual(disposed,["hydration","tree"]);
