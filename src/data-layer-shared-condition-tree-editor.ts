import {typedCanonicalValue} from "./data-layer-canonical-schema-facets.js";
import type {CanonicalPredicate,CanonicalPredicateOperator,CanonicalPropertyType} from "./data-layer-canonical-schema.js";

export interface SharedConditionProperty {id:string;name:string;type?:string;}
export interface SharedConditionTreeOptions {dom:Document;condition?:CanonicalPredicate;properties:()=>readonly SharedConditionProperty[];id:(kind:string)=>string;onChange:(condition:CanonicalPredicate|undefined)=>void;}
const existence:CanonicalPredicateOperator[]=["Exists","Does not exist"];
const operators=(type:string|undefined):CanonicalPredicateOperator[]=>type==="number"||type==="integer"?[...existence,"Equals","Does not equal","Greater than","At least","Less than","At most"]:type==="boolean"||type==="null"?[...existence,"Equals","Does not equal"]:type==="array"?[...existence,"Contains","Contains any of"]:type==="enum"?[...existence,"Equals","Does not equal","Is one of"]:[...existence,"Equals","Does not equal","Is one of","Starts with","Contains","Matches pattern"];
const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
const labeled=(dom:Document,text:string,control:HTMLElement):HTMLLabelElement=>{const label=dom.createElement("label");label.append(text,control);return label;};
const clone=<T>(value:T):T=>structuredClone(value);
const valueText=(value:unknown):string=>value===undefined?"":typeof value==="string"?value:JSON.stringify(value)??String(value);
const typedValue=(type:string|undefined,text:string):unknown=>typedCanonicalValue(type as CanonicalPropertyType|undefined,text);
export const sharedConditionOperators=(type:string|undefined):readonly CanonicalPredicateOperator[]=>operators(type);
export const sharedConditionValueMounted=(operator:CanonicalPredicateOperator):boolean=>!existence.includes(operator);
export const sharedTypedConditionValue=(type:string|undefined,text:string):unknown=>typedValue(type,text);

export type SharedFlatMatchMode="all"|"any";
export interface SharedFlatConditionDraft {id?:string;propertyId:string;operator:CanonicalPredicateOperator|"";value?:unknown;}
const predicateRows=(condition:CanonicalPredicate|undefined):Extract<CanonicalPredicate,{kind:"predicate"}>[]=>{
  if(!condition)return[];
  if(condition.kind==="predicate")return[clone(condition)];
  return condition.children.flatMap(predicateRows);
};
export const sharedFlatConditionRows=(condition:CanonicalPredicate|undefined):SharedFlatConditionDraft[]=>predicateRows(condition).map(({id,propertyId,operator,value})=>({...(id?{id}:{}),propertyId,operator,...(value!==undefined?{value}: {})}));
export const sharedFlatConditionResult=(mode:SharedFlatMatchMode,rows:readonly SharedFlatConditionDraft[]):CanonicalPredicate|undefined=>{
  if(!rows.length||rows.some(({propertyId,operator,value})=>!propertyId||!operator||!existence.includes(operator)&&value===undefined))return undefined;
  return{kind:mode,children:rows.map(({id,propertyId,operator,value})=>({kind:"predicate",...(id?{id}:{}),propertyId,operator:operator as CanonicalPredicateOperator,...(existence.includes(operator as CanonicalPredicateOperator)?{}:{value})}))};
};

export function renderSharedConditionTree(host:HTMLElement,options:SharedConditionTreeOptions):void {
  const {dom}=options,initial=options.condition;let mode:SharedFlatMatchMode=initial?.kind==="any"?"any":"all",rows:SharedFlatConditionDraft[]=sharedFlatConditionRows(initial).map((row)=>({...row,id:row.id??options.id("condition")}));if(!rows.length)rows=[{id:options.id("condition"),propertyId:"",operator:""}];
  if(!dom.getElementById("flat-rule-builder-responsive-style")){const style=dom.createElement("style");style.id="flat-rule-builder-responsive-style";style.textContent=`[data-rule-editor-mode]{box-sizing:border-box;min-width:0;max-width:100%;overflow-x:hidden}[data-rule-editor-mode] *{box-sizing:border-box;max-width:100%}[data-condition-layout="responsive"] label{display:grid;gap:.2rem;min-width:0}[data-condition-layout="responsive"] input,[data-condition-layout="responsive"] select{box-sizing:border-box;max-width:100%;width:100%}[data-rule-editor-mode] section{display:grid;gap:.5rem;min-width:0}[data-rule-editor-mode] [aria-label="Rule actions"]{position:sticky;bottom:0;z-index:1;background:Canvas;padding:.5rem 0}[data-rule-editor-mode] h3,[data-condition-layout="responsive"] h4{margin:.4rem 0 .1rem}@media(max-width:600px){[data-condition-layout="responsive"] [data-condition-kind="predicate"]{grid-template-columns:minmax(0,1fr)!important}}`;dom.head.append(style);}
  let focusRowId:string|undefined;
  const properties=()=>options.properties(),selected=(row:SharedFlatConditionDraft)=>properties().find(({id})=>id===row.propertyId);
  const emit=():void=>options.onChange(sharedFlatConditionResult(mode,rows));
  const render=():void=>{
    host.replaceChildren();host.setAttribute("aria-label","Flat When condition list");host.dataset.conditionLayout="responsive";
    const heading=dom.createElement("h4"),match=dom.createElement("select"),list=dom.createElement("div");heading.textContent="Match conditions";match.setAttribute("aria-label","Rule match mode");match.append(new Option("All of these conditions","all"),new Option("Any of these conditions","any"));match.value=mode;match.addEventListener("change",()=>{mode=match.value as SharedFlatMatchMode;emit();});list.setAttribute("role","list");list.setAttribute("aria-label","Condition rows");
    const chooseProperty=(row:SharedFlatConditionDraft,entry:SharedConditionProperty,property:HTMLInputElement,operator:HTMLSelectElement,listbox:HTMLElement):void=>{row.propertyId=entry.id;row.operator="";delete row.value;property.value=entry.name;property.setAttribute("aria-expanded","false");listbox.remove();renderOperators(row,operator);emit();operator.focus({preventScroll:true});};
    const propertyControl=(row:SharedFlatConditionDraft,operator:HTMLSelectElement):HTMLElement=>{
      const wrapper=dom.createElement("span"),property=dom.createElement("input"),listbox=dom.createElement("div"),listboxId=`condition-property-list-${crypto.randomUUID()}`;wrapper.style.cssText="position:relative;min-width:0;";property.type="search";property.value=selected(row)?.name??"";property.placeholder="Search properties";property.setAttribute("role","combobox");property.setAttribute("aria-label","Condition property");property.setAttribute("aria-autocomplete","list");property.setAttribute("aria-controls",listboxId);property.setAttribute("aria-expanded","false");listbox.id=listboxId;listbox.setAttribute("role","listbox");listbox.setAttribute("aria-label","Matching condition properties");listbox.style.cssText="position:fixed;z-index:2147483647;box-sizing:border-box;overflow-y:auto;overflow-x:hidden;background:Canvas;border:1px solid ButtonBorder;padding:0.25rem;";
      let activeIndex=0;
      const close=()=>{property.setAttribute("aria-expanded","false");listbox.remove();};
      const open=()=>{const query=property.value.trim().toLocaleLowerCase(),choices=properties().filter(({id,name})=>!query||name.toLocaleLowerCase().includes(query)||id.toLocaleLowerCase().includes(query));listbox.replaceChildren();for(const [index,entry]of choices.entries()){const option=dom.createElement("div");option.setAttribute("role","option");option.tabIndex=-1;option.textContent=entry.name;option.dataset.propertyId=entry.id;option.style.cssText="padding:0.35rem 0.5rem;cursor:pointer;";option.addEventListener("mousedown",(event)=>event.preventDefault());option.addEventListener("click",()=>chooseProperty(row,entry,property,operator,listbox));if(index===activeIndex)option.setAttribute("aria-selected","true");listbox.append(option);}if(!listbox.isConnected)dom.body.append(listbox);property.setAttribute("aria-expanded","true");requestAnimationFrame(()=>{const field=property.getBoundingClientRect(),editor=host.closest<HTMLElement>("[data-focused-property-editor]")?.getBoundingClientRect(),left=Math.max(editor?.left??8,Math.min(field.left,(editor?.right??innerWidth-8)-Math.max(field.width,180))),below=(editor?.bottom??innerHeight-8)-field.bottom,above=field.top-(editor?.top??8),flip=below<160&&above>below,maxHeight=Math.max(80,Math.min(240,(flip?above:below)-8));listbox.style.left=`${left}px`;listbox.style.width=`${Math.max(field.width,180)}px`;listbox.style.maxHeight=`${maxHeight}px`;listbox.style.top=flip?`${Math.max(editor?.top??8,field.top-Math.min(listbox.scrollHeight,maxHeight))}px`:`${field.bottom}px`;});};
      Object.defineProperty(property,"options",{configurable:true,get:()=>properties().map(({id,name})=>new Option(name,id))});
      property.addEventListener("focus",open);property.addEventListener("input",()=>{row.propertyId="";row.operator="";delete row.value;activeIndex=0;renderOperators(row,operator);emit();open();});property.addEventListener("change",()=>{const entry=properties().find(({id,name})=>id===property.value||name===property.value);if(entry)chooseProperty(row,entry,property,operator,listbox);});property.addEventListener("keydown",(event)=>{const choices=Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]'));if(event.key==="ArrowDown"){event.preventDefault();activeIndex=Math.min(activeIndex+1,Math.max(0,choices.length-1));choices.forEach((choice,index)=>choice.setAttribute("aria-selected",String(index===activeIndex)));choices[activeIndex]?.scrollIntoView({block:"nearest"});}else if(event.key==="Enter"&&choices[activeIndex]){event.preventDefault();const entry=properties().find(({id})=>id===choices[activeIndex]!.dataset.propertyId);if(entry)chooseProperty(row,entry,property,operator,listbox);}else if(event.key==="Escape")close();});property.addEventListener("blur",()=>setTimeout(close,0));wrapper.append(property);return wrapper;
    };
    const valueControl=(row:SharedFlatConditionDraft):HTMLElement=>{
      const entry=selected(row),valueHost=dom.createElement("span");valueHost.setAttribute("aria-label","Condition value");if(!entry||!row.operator){valueHost.textContent="Choose property and operator";return valueHost;}if(existence.includes(row.operator as CanonicalPredicateOperator)){valueHost.textContent="No value required";return valueHost;}
      const multi=row.operator==="Is one of"||row.operator==="Contains any of",control=entry.type==="boolean"?dom.createElement("select"):dom.createElement("input");control.setAttribute("aria-label","Typed condition value");if(control instanceof HTMLSelectElement){control.append(new Option("Choose True or False",""),new Option("True","true"),new Option("False","false"));control.value=row.value===true?"true":row.value===false?"false":"";}else{control.type=entry.type==="number"||entry.type==="integer"?"number":"text";control.value=multi&&Array.isArray(row.value)?row.value.join(", "):valueText(row.value);control.placeholder=multi?"Comma-separated values":"";}
      const update=()=>{try{const text=control.value;if(control instanceof HTMLSelectElement)row.value=text===""?undefined:text==="true";else if(multi)row.value=text.split(",").map((value)=>value.trim()).filter(Boolean).map((value)=>typedValue(entry.type==="array"?"string":entry.type,value));else row.value=typedValue(entry.type,text);control.setCustomValidity("");emit();}catch(error){control.setCustomValidity(error instanceof Error?error.message:String(error));emit();}};control.addEventListener("input",update);control.addEventListener("change",update);valueHost.append(control);return valueHost;
    };
    const renderOperators=(row:SharedFlatConditionDraft,operator:HTMLSelectElement):void=>{const entry=selected(row),available=entry?operators(entry.type):[];operator.disabled=!entry;operator.replaceChildren(new Option("Choose operator",""),...available.map((name)=>new Option(name,name)));if(row.operator&&available.includes(row.operator as CanonicalPredicateOperator))operator.value=row.operator;else{row.operator="";delete row.value;}};
    rows.forEach((row,index)=>{const item=dom.createElement("article"),operator=dom.createElement("select"),valueSlot=dom.createElement("span"),remove=button(dom,"Remove condition",()=>{if(rows.length===1)rows=[{...(row.id?{id:row.id}:{}),propertyId:"",operator:""}];else rows.splice(index,1);focusRowId=rows[Math.min(index,rows.length-1)]?.id;emit();render();});item.dataset.conditionId=row.id??"";item.dataset.conditionPath=String(index);item.dataset.conditionKind="predicate";item.setAttribute("role","listitem");item.style.cssText="display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:0.5rem;align-items:end;min-width:0;";operator.setAttribute("aria-label","Type-valid operator");renderOperators(row,operator);operator.addEventListener("change",()=>{row.operator=operator.value as CanonicalPredicateOperator|"";delete row.value;emit();render();});valueSlot.append(valueControl(row));item.append(labeled(dom,"Property",propertyControl(row,operator)),labeled(dom,"Operator",operator),labeled(dom,"Value",valueSlot),remove);list.append(item);});
    const add=button(dom,"Add condition",()=>{const row={id:options.id("condition"),propertyId:"",operator:""} satisfies SharedFlatConditionDraft;rows.push(row);focusRowId=row.id;emit();render();});host.append(heading,labeled(dom,"Match",match),list,add);emit();queueMicrotask(()=>{if(focusRowId){host.querySelector<HTMLInputElement>(`[data-condition-id="${CSS.escape(focusRowId)}"] [aria-label="Condition property"]`)?.focus({preventScroll:true});focusRowId=undefined;}const layer=host.closest<HTMLElement>("[data-schema-row-overlay=\"true\"]");(layer??host).scrollIntoView({block:"nearest",inline:"nearest"});});
  };
  render();
}

export interface SharedProjectConditionPredicate {
  kind:"predicate";
  field:string;
  operator:string;
  value?:unknown;
  values?:readonly unknown[];
  pattern?:string;
  valuePath?:string;
}
export interface SharedProjectConditionGroup {
  kind:"all"|"any"|"not";
  conditions:SharedProjectCondition[];
}
export type SharedProjectCondition=SharedProjectConditionPredicate|SharedProjectConditionGroup;
export interface SharedProjectConditionTreeOptions {
  dom:Document;
  condition?:SharedProjectCondition;
  onChange:(condition:SharedProjectCondition|undefined)=>void;
}

const projectOperators=[
  "exists",
  "does not exist",
  "equals",
  "does not equal",
  "is one of",
  "contains",
  "glob",
  "regex",
  "matches pattern",
  "is greater than",
  "is at least",
  "is less than",
  "is at most",
] as const;
const projectExistenceOperators=new Set(["exists","does not exist"]);
const projectNumericOperators=new Set(["is greater than","is at least","is less than","is at most"]);

function projectConditionValueText(predicate:SharedProjectConditionPredicate):string {
  if(predicate.valuePath!==undefined) return predicate.valuePath;
  if(predicate.values!==undefined) return predicate.values.map(String).join(", ");
  if(predicate.pattern!==undefined) return predicate.pattern;
  return valueText(predicate.value);
}

/**
 * Project applicability uses its own persisted AST and operator vocabulary.
 * This adapter deliberately shares the production condition-tree presentation
 * without casting or rewriting that durable format.
 */
export function renderSharedProjectConditionTree(
  host:HTMLElement,
  options:SharedProjectConditionTreeOptions,
):void {
  const {dom}=options;
  let condition=options.condition?clone(options.condition):undefined;
  const emptyPredicate=():SharedProjectConditionPredicate=>({
    kind:"predicate",
    field:"",
    operator:"equals",
    value:"",
  });
  const group=(kind:"all"|"any"|"not"):SharedProjectConditionGroup=>({
    kind,
    conditions:[],
  });
  const emit=():void=>options.onChange(condition?clone(condition):undefined);
  const nodeAt=(path:number[]):SharedProjectCondition|undefined=>path.reduce<SharedProjectCondition|undefined>(
    (node,index)=>node&&node.kind!=="predicate"?node.conditions[index]:undefined,
    condition,
  );
  const parentAt=(path:number[]):SharedProjectConditionGroup|undefined=>{
    const node=nodeAt(path);
    return node?.kind==="predicate"?undefined:node;
  };
  const insert=(path:number[]|undefined,node:SharedProjectCondition):void=>{
    if(path) {
      const parent=parentAt(path);
      if(!parent||parent.kind==="not"&&parent.conditions.length) return;
      parent.conditions.push(node);
    } else if(!condition) {
      condition=node;
    } else if(condition.kind==="predicate") {
      condition={kind:"all",conditions:[condition,node]};
    } else if(condition.kind!=="not"||!condition.conditions.length) {
      condition.conditions.push(node);
    }
    emit();
    render();
  };
  const remove=(path:number[]):void=>{
    if(!path.length) condition=undefined;
    else parentAt(path.slice(0,-1))?.conditions.splice(path.at(-1)!,1);
    emit();
    render();
  };
  const groupChoice=(path:number[]|undefined):HTMLElement=>{
    const controls=dom.createElement("span");
    const relation=dom.createElement("select");
    relation.setAttribute("aria-label","Condition group relation");
    for(const kind of ["all","any","not"] as const) {
      relation.append(new Option(kind==="all"?"All":kind==="any"?"Any":"Not",kind));
    }
    controls.append(
      relation,
      button(dom,"Add group",()=>insert(path,group(relation.value as "all"|"any"|"not"))),
    );
    return controls;
  };
  const renderPredicate=(node:SharedProjectConditionPredicate,path:number[]):HTMLElement=>{
    const row=dom.createElement("article");
    const field=dom.createElement("input");
    const operator=dom.createElement("select");
    const source=dom.createElement("select");
    const valueHost=dom.createElement("span");
    row.dataset.conditionId=`project-condition:${path.join(".")||"root"}`;
    row.dataset.conditionPath=path.join(".")||"root";
    row.dataset.conditionKind="predicate";
    field.type="text";
    field.value=node.field;
    field.placeholder="Context field";
    field.setAttribute("aria-label","Condition field");
    operator.setAttribute("aria-label","Condition operator");
    const currentOperator=node.operator.toLowerCase().replaceAll("_","-");
    const operators=projectOperators.includes(currentOperator as typeof projectOperators[number])
      ? projectOperators
      : [currentOperator,...projectOperators];
    for(const entry of operators) operator.append(new Option(entry,entry));
    operator.value=currentOperator;
    source.setAttribute("aria-label","Condition value source");
    source.append(new Option("Literal value","literal"),new Option("Field reference","field"));
    source.value=node.valuePath!==undefined?"field":"literal";
    const renderValue=():void=>{
      valueHost.replaceChildren();
      if(projectExistenceOperators.has(operator.value)) return;
      const value=dom.createElement("input");
      value.type="text";
      value.value=projectConditionValueText(node);
      value.setAttribute(
        "aria-label",
        source.value==="field"?"Condition comparison field":"Condition value",
      );
      value.addEventListener("input",()=>{
        if(source.value==="field") {
          delete node.value;
          delete node.values;
          delete node.pattern;
          node.valuePath=value.value;
        } else {
          delete node.valuePath;
          delete node.value;
          delete node.values;
          delete node.pattern;
          if(operator.value==="is one of") {
            node.values=value.value.split(",").map((entry)=>entry.trim()).filter(Boolean);
          } else if(operator.value==="regex"||operator.value==="matches pattern") {
            node.pattern=value.value;
          } else if(projectNumericOperators.has(operator.value)) {
            const numeric=Number(value.value);
            node.value=value.value.trim()&&Number.isFinite(numeric)?numeric:value.value;
          } else {
            node.value=value.value;
          }
        }
        emit();
      });
      valueHost.append(value);
    };
    field.addEventListener("input",()=>{node.field=field.value;emit();});
    operator.addEventListener("change",()=>{
      node.operator=operator.value;
      if(projectExistenceOperators.has(node.operator)) {
        delete node.value;
        delete node.values;
        delete node.pattern;
        delete node.valuePath;
      }
      renderValue();
      emit();
    });
    source.addEventListener("change",()=>{
      const text=projectConditionValueText(node);
      delete node.value;
      delete node.values;
      delete node.pattern;
      delete node.valuePath;
      if(source.value==="field") node.valuePath=text;
      else node.value=text;
      renderValue();
      emit();
    });
    renderValue();
    row.append(
      labeled(dom,"Field",field),
      labeled(dom,"Operator",operator),
      labeled(dom,"Compare with",source),
      labeled(dom,"Value",valueHost),
      button(dom,"Remove",()=>remove(path)),
    );
    return row;
  };
  const renderGroup=(node:SharedProjectConditionGroup,path:number[]):HTMLElement=>{
    const row=dom.createElement("article");
    const header=dom.createElement("div");
    const relation=dom.createElement("select");
    const children=dom.createElement("div");
    row.dataset.conditionId=`project-condition:${path.join(".")||"root"}`;
    row.dataset.conditionPath=path.join(".")||"root";
    row.dataset.conditionKind="group";
    relation.setAttribute("aria-label","Condition group relation");
    for(const kind of ["all","any","not"] as const) {
      relation.append(new Option(kind==="all"?"All":kind==="any"?"Any":"Not",kind));
    }
    relation.value=node.kind;
    relation.addEventListener("change",()=>{
      node.kind=relation.value as "all"|"any"|"not";
      if(node.kind==="not") node.conditions=node.conditions.slice(0,1);
      emit();
      render();
    });
    header.append(
      labeled(dom,"Relation",relation),
      button(dom,"Add condition",()=>insert(path,emptyPredicate())),
      groupChoice(path),
      button(dom,"Remove",()=>remove(path)),
    );
    for(const [index,child] of node.conditions.entries()) {
      children.append(renderNode(child,[...path,index]));
    }
    row.append(header,children);
    return row;
  };
  const renderNode=(node:SharedProjectCondition,path:number[]):HTMLElement=>
    node.kind==="predicate"?renderPredicate(node,path):renderGroup(node,path);
  const render=():void=>{
    host.replaceChildren();
    host.setAttribute("aria-label","Shared editable project condition tree");
    if(condition) {
      host.append(renderNode(condition,[]));
    } else {
      const empty=dom.createElement("div");
      empty.setAttribute("aria-label","Empty project condition builder");
      empty.append(
        button(dom,"Add condition",()=>insert(undefined,emptyPredicate())),
        groupChoice(undefined),
      );
      host.append(empty);
    }
    queueMicrotask(()=>{
      const layer=host.closest<HTMLElement>("[data-schema-row-overlay=\"true\"]");
      (layer??host).scrollIntoView({block:"nearest",inline:"nearest"});
    });
  };
  render();
}
