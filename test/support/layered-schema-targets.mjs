import { runBrowserTargetSession } from "./browser-target-session.mjs";

const definitions = {
  LAYERED_SCHEMA_CORE_TARGET:{
    pagePath:"specification-builder.html",
    expression:()=>`
      const canonical=await import('./data-layer-canonical-schema.js');
      let document=canonical.createCanonicalSchema({id:'schema:target',contributorId:'profile:target',contributorName:'Target'});
      const added=canonical.addCanonicalProperty(document,{baseRevision:0,name:'page_type',type:'string',id:()=> 'property:page-type'});document=added.document;
      const exported=canonical.canonicalJsonSchemaDocument(document);
      return{layeredSchemaCore:{installedBoundary:location.protocol==='chrome-extension:',canonicalIdentity:document.id==='schema:target'&&document.rootIds.length===1,stablePath:canonical.canonicalPropertyPath(document,'property:page-type')==='/page_type',exported:exported.properties.page_type.type==='string',unrelatedEditorExecuted:false}};`,
  },
  LAYERED_SCHEMA_EDITOR_TARGET:{
    pagePath:"specification-builder.html",
    expression:()=>`
      const canonical=await import('./data-layer-canonical-schema.js'),ui=await import('./data-layer-canonical-schema-ui.js');
      const property={id:'property:target',name:'page_type',order:0,type:'string',presence:{mode:'optional'},allowedValues:[],rules:[],documentation:{displayText:'',description:'',comments:'',example:{method:'blank'}},provenance:[{source:'created'}],overrideReferences:[]};
      const patch=ui.canonicalTableQuickEditPatch(property,'description','Focused target description',()=>crypto.randomUUID());
      const document={...canonical.createCanonicalSchema({id:'schema:editor',contributorId:'profile:editor',contributorName:'Editor'}),rootIds:[property.id],nodes:{[property.id]:property}};
      const result=canonical.applyCanonicalCommand(document,{kind:'set',baseRevision:0,propertyId:property.id,patch});
      return{layeredSchemaEditor:{installedBoundary:location.protocol==='chrome-extension:',focusedPatch:Object.keys(patch).join(',')==='documentation',saved:result.status==='applied'&&result.document.nodes[property.id].documentation.description==='Focused target description',unrelatedCompositionExecuted:false}};`,
  },
  LAYERED_SCHEMA_COMPOSITION_TARGET:{
    pagePath:"specification-builder.html",
    expression:()=>`
      const layered=await import('./data-layer-layered-schema.js');
      const compiled=layered.compileLayeredSchema([{id:'profile:target',name:'Profile',scope:'Shared Profile',constraints:[{path:'/page_type',type:'string',presence:'required'}]},{id:'page:target',name:'Page',scope:'Page',constraints:[{path:'/page_type',expectedValue:'checkout'}]}],{eventId:'event:target',eventRole:'interaction'});
      const validation=layered.validateLayeredObservation({targetId:'target',targetName:'Target',revision:1,compiled},{page_type:'checkout'});
      return{layeredSchemaComposition:{installedBoundary:location.protocol==='chrome-extension:',ready:compiled.status==='ready',precedence:compiled.properties['/page_type'].expectedValue==='checkout'&&compiled.properties['/page_type'].presence==='required',valid:validation.issues.length===0,unrelatedEditorExecuted:false}};`,
  },
  LAYERED_SCHEMA_PAGE_GROUP_TARGET:{
    pagePath:"specification-builder.html",
    expression:()=>`
      const structural=await import('./data-layer-page-group-structural-authoring.js');
      const state={project:{collections:{profiles:[],events:[],propertySets:[{id:'property-set:checkout',name:'Checkout',schemaConstraints:[{path:'/order_id',type:'string'}]}],pages:[{id:'page:checkout',name:'Checkout',propertySetApplications:[{propertySetId:'property-set:checkout'}],schemaConstraints:[]}],applicabilitySets:[],flows:[],fixtures:[],assignments:[]},documentationFlowGraphs:{}}};
      const schema=structural.pageGroupStructuralSchema(state,'page:checkout');
      return{layeredSchemaPageGroup:{installedBoundary:location.protocol==='chrome-extension:',structural:Boolean(schema),propertySetOwned:Boolean(schema.compiled.properties['/order_id']),unrelatedInheritanceExecuted:false}};`,
  },
  LAYERED_SCHEMA_INHERITANCE_TARGET:{
    pagePath:"specification-builder.html",
    expression:()=>`
      const inheritance=await import('./data-layer-selective-profile-inheritance.js');
      const node={id:'property:page-type',name:'page_type',type:'string',order:0,presence:{mode:'optional'},allowedValues:[],rules:[],documentation:{displayText:'Page type',description:'',comments:'',example:{method:'blank'}},provenance:[{source:'created'}],overrideReferences:[]};
      const profile={id:'schema:profile',revision:3,state:'Draft',contributorId:'profile:source',contributorName:'Source',rootIds:[node.id],nodes:{[node.id]:node},view:'tree'};
      const empty=inheritance.createProfileInheritanceRecipe({id:'recipe:target',profileId:'profile:source',targetId:'page:target',startingPoint:'empty',sourceRevision:3});
      const selected={...empty,propertySelections:[node.id]},selection=inheritance.profileInheritanceSelection(profile,selected);
      return{layeredSchemaInheritance:{installedBoundary:location.protocol==='chrome-extension:',empty:inheritance.profileInheritanceSelection(profile,empty).directPropertyIds.length===0,fixedSelection:selection.directPropertyIds.join(',')===node.id,parentAdditions:inheritance.profileInheritanceParentAdditions(profile,selected).length===0,unrelatedPageGroupExecuted:false}};`,
  },
};

await runBrowserTargetSession({ definitions });
