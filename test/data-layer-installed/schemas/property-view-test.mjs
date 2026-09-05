import assert from "node:assert/strict";

const { SchemaPropertyView } = await import(
  "../../../dist/data-layer-installed/schemas/property-view.js"
);
const { SchemaPropertyController } = await import(
  "../../../dist/data-layer-installed/schemas/property-controller.js"
);

function createDom() {
  let document;
  const make=(tagName="DIV") => {
    const listeners=new Map();
    return {
      ownerDocument:document, tagName, children:[], dataset:{}, style:{setProperty(){}}, classList:{contains:()=>false},
      textContent:"", value:"", hidden:false, disabled:false, scrollTop:0,
      addEventListener(type,listener){listeners.set(type,listener);},
      removeEventListener(type,listener){if(listeners.get(type)===listener)listeners.delete(type);},
      click(){listeners.get("click")?.({target:this,currentTarget:this,preventDefault(){}});},
      listenerCount(){return listeners.size;},
      append(...children){this.children.push(...children);}, prepend(...children){this.children.unshift(...children);},
      replaceChildren(...children){this.children=children;},
      setAttribute(name,value){this[name]=value;}, getAttribute(name){return this[name];},
      querySelectorAll(){return [];}, querySelector(){return null;}, closest(){return null;}, contains(){return false;},
      focus(){this.focused=true;},
    };
  };
  document={ createElement:(tag) => make(tag.toUpperCase()), activeElement:null, querySelector:()=>null };
  const elements=new Map([
    ["#schema-property-tree",make("UL")], ["#schema-property-filter",make("INPUT")],
    ["#schema-property-sort",Object.assign(make("SELECT"),{value:"schema"})],
    ["#schema-property-result-status",make()], ["#schema-property-empty",make()],
    ["#schema-property-empty-message",make()], ["#schema-editor",make()],
    ["#schema-detail",make()], ["#add-schema-property",make("BUTTON")],
  ]);
  return {document,elements,root:{querySelector:(selector)=>elements.get(selector)??null}};
}

const schema={
  id:"schema:one",name:"One",version:1,published:true,assignments:[],attachedRules:[],
  document:{type:"object",properties:{title:{type:"string"}}},
  workingDraft:{baseVersion:1,sourceVersion:1,name:"One",assignments:[],attachedRules:[],pendingChanges:[],
    document:{type:"object",properties:{title:{type:"string"}}}},
};
const property=new SchemaPropertyController();
const {document,elements,root}=createDom();
globalThis.document=document;
const library={activeSchemaId:schema.id,draft:undefined,schemas:[schema]};
const view=new SchemaPropertyView({
  root,document,library,property,rules:{promotionFocusReturn:undefined,rules:[]},
  canonical:{editorDocument:()=>undefined,hasEditor:()=>false},active:()=>schema,editorDraft:(value)=>value.workingDraft??value,
  parentDocuments:()=>[],normalizedPath:(path)=>path,replaceActive(){},persistLibrary(){},persistLibraries(){},
  queuePersistence(){},renderAll(){},createId:()=>"id",settleCanonical:false,
  openCanonicalActions(){},openCanonicalRule(){},openManual(){},openRulePicker(){},openSpecificIndex(){},
  openCopy(){},requestRemoval(){},requestDocumentationRemoval(){},updateAttachedRule(){},openAttachedRule(){},promoteRule(){},
});

view.render();
// retired-schema-assertion: property-filter-removal-copy-manual-index-001
assert.equal(elements.get("#schema-property-result-status").textContent,"1 of 1 properties");
const propertyToggle=elements.get("#schema-property-tree").children[0].children[0];
elements.get("#schema-property-filter").value="missing";
view.render();
// retired-schema-assertion: property-filter-removal-copy-manual-index-002
assert.equal(elements.get("#schema-property-empty").hidden,false);
// retired-schema-assertion: property-filter-removal-copy-manual-index-003
assert.equal(elements.get("#schema-property-empty-message").textContent,"No properties match missing");
// retired-schema-assertion: property-filter-removal-copy-manual-index-005
assert.equal(propertyToggle.listenerCount(),0,"property rerender disposes replaced row listeners");

view.dispose();
