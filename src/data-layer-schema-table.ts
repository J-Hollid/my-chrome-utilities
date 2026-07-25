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

export function schemaTableValueFacet(value:{expectedValue?:unknown;allowedValues?:readonly unknown[]}):SchemaTableValueFacet {
  if(value.expectedValue!==undefined)return{kind:"expected",text:String(value.expectedValue),value:value.expectedValue};
  const values=value.allowedValues??[];
  return{kind:"allowed",text:JSON.stringify(values),values};
}

export function schemaTableExpectedOrAllowed(value:{expectedValue?:unknown;allowedValues?:readonly unknown[]}):string {
  return schemaTableValueFacet(value).text;
}

const parsedScalar=(text:string,previous:unknown):unknown=>{
  if(typeof previous==="string")return text;
  try{return JSON.parse(text) as unknown;}catch{return text;}
};

export function schemaTableStageExpectedOrAllowed<T extends {expectedValue?:unknown;allowedValues?:readonly unknown[]}>(source:T,text:string):T {
  const facet=schemaTableValueFacet(source);
  if(facet.kind==="expected")return{...source,expectedValue:parsedScalar(text,facet.value)};
  let allowedValues:unknown[];
  try{const parsed=JSON.parse(text) as unknown;allowedValues=Array.isArray(parsed)?parsed:[parsed];}catch{allowedValues=[text];}
  return{...source,allowedValues};
}
