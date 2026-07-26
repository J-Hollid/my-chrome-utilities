export const schemaTableColumns=[
  {key:"property",label:"Property"},
  {key:"path",label:"Path"},
  {key:"type",label:"Type"},
  {key:"presence",label:"Presence"},
  {key:"description",label:"Description"},
  {key:"expected-or-allowed",label:"Expected or allowed value"},
  {key:"example",label:"Example"},
  {key:"source",label:"Source"},
  {key:"local-effective-state",label:"Local/effective state"},
  {key:"validation-state",label:"Validation state"},
] as const;
export const schemaTableCellMetadata=schemaTableColumns.map(({key,label})=>({key,label}));
export const schemaTableOverlayStyle="position:absolute;left:0;top:100%;z-index:10;width:min(42rem,calc(100vw - 3rem));max-width:calc(100vw - 3rem);box-sizing:border-box;overflow:auto;background:Canvas;border:1px solid ButtonBorder;padding:0.75rem;";

export const schemaTableEditableFacets=["description","expected-or-allowed","example"] as const;
export type SchemaTableEditableFacet=typeof schemaTableEditableFacets[number];

export type SchemaTableOverlayState=
  |{phase:"closed";restorePath?:string}
  |{phase:"menu"|"focused"|"review";path:string};
export type SchemaTableOverlayEvent=
  |{kind:"open";path:string}
  |{kind:"focus"|"review"|"cancel"|"escape"};

export function schemaTableOverlayTransition(state:SchemaTableOverlayState,event:SchemaTableOverlayEvent):SchemaTableOverlayState {
  if(event.kind==="open")return{phase:"menu",path:event.path};
  if(event.kind==="cancel"||event.kind==="escape")return{phase:"closed",...("path" in state?{restorePath:state.path}:{})};
  if(!("path" in state))return state;
  return{phase:event.kind==="focus"?"focused":"review",path:state.path};
}

export type SchemaTableValueFacet=
  |{kind:"expected";text:string;value:unknown}
  |{kind:"allowed";text:string;values:readonly unknown[]};

const formattedOrdinaryValue=(value:unknown):string=>{
  if(typeof value!=="string")return JSON.stringify(value);
  return value===""||value.trim()!==value||/[,\\"[\]{}]/.test(value)?JSON.stringify(value):value;
};

export function schemaTableValueFacet(value:{expectedValue?:unknown;allowedValues?:readonly unknown[]}):SchemaTableValueFacet {
  if(value.expectedValue!==undefined)return{kind:"expected",text:formattedOrdinaryValue(value.expectedValue),value:value.expectedValue};
  const values=value.allowedValues??[];
  return{kind:"allowed",text:values.map(formattedOrdinaryValue).join(", "),values};
}

export function schemaTableExpectedOrAllowed(value:{expectedValue?:unknown;allowedValues?:readonly unknown[]}):string {
  return schemaTableValueFacet(value).text;
}

const parsedScalar=(text:string,previous:unknown):unknown=>{
  if(typeof previous==="string"){try{const parsed=JSON.parse(text) as unknown;return typeof parsed==="string"?parsed:text;}catch{return text;}}
  try{return JSON.parse(text) as unknown;}catch{return text;}
};

const ordinaryEntries=(text:string):string[]=>{
  const entries:string[]=[];let start=0,depth=0,quote=false,escaped=false;
  for(let index=0;index<text.length;index+=1){
    const character=text[index]!;
    if(quote){if(escaped)escaped=false;else if(character==="\\")escaped=true;else if(character==='"')quote=false;continue;}
    if(character==='"'){quote=true;continue;}
    if(character==="["||character==="{")depth+=1;
    else if(character==="]"||character==="}")depth=Math.max(0,depth-1);
    else if(character===","&&depth===0){entries.push(text.slice(start,index).trim());start=index+1;}
  }
  entries.push(text.slice(start).trim());return entries.filter((entry)=>entry.length>0);
};

export function schemaTableStageExpectedOrAllowed<T extends {expectedValue?:unknown;allowedValues?:readonly unknown[]}>(source:T,text:string):T {
  const facet=schemaTableValueFacet(source);
  const entries=ordinaryEntries(text),{expectedValue:_,allowedValues:__,...rest}=source,previous=facet.kind==="expected"?facet.value:facet.values[0];
  if(entries.length>1)return{...rest,allowedValues:entries.map((entry)=>parsedScalar(entry,previous))} as unknown as T;
  if(!entries.length)return{...rest,allowedValues:[]} as unknown as T;
  return{...rest,expectedValue:parsedScalar(entries[0]!,previous)} as unknown as T;
}
