import {record} from "./contract.js";

export function validateAgentRecord(data:Record<string,unknown>):void {
  const strings=new Set(["description","purpose","eventName","sourceId","target","path","pathname","url","trigger","eventId","pageId","applicabilitySetId","targetKind","targetId","correlationField","occurrencePolicy"]);
  for(const [key,value] of Object.entries(data)) {
    if(strings.has(key)&&typeof value!=="string")throw new Error(`${key} must be text.`);
    if(["priority","timeoutMinutes"].includes(key)&&(typeof value!=="number"||!Number.isFinite(value)))throw new Error(`${key} must be a finite number.`);
    if(key==="fallback"&&typeof value!=="boolean")throw new Error("fallback must be true or false.");
  }
  for(const key of ["condition","entryCondition","exitCondition"])if(data[key]!==undefined)validateCondition(data[key]);
  if(data.schema!==undefined)validateSchema(data.schema);
}
function validateCondition(value:unknown):void {
  if(!record(value))throw new Error("A condition must be an object.");
  if(value.kind==="predicate") {
    if(typeof value.field!=="string"||typeof value.operator!=="string")throw new Error("A predicate needs a field and operator.");
  } else {
    if(!["all","any","not"].includes(String(value.kind))||!Array.isArray(value.conditions))throw new Error("A condition group needs all, any, or not and a conditions list.");
    value.conditions.forEach(validateCondition);
  }
}
function validateSchema(value:unknown):void {
  if(typeof value==="boolean")return;
  if(!record(value))throw new Error("A JSON Schema must be an object.");
  if(value.type!==undefined) {
    const types=Array.isArray(value.type)?value.type:[value.type];
    if(!types.length||types.some(type=>!["object","array","string","number","integer","boolean","null"].includes(String(type))))throw new Error("A JSON Schema has an invalid type.");
  }
  if(value.required!==undefined&&(!Array.isArray(value.required)||value.required.some(name=>typeof name!=="string")))throw new Error("Schema required must be a list of property names.");
  for(const keyword of ["properties","$defs","definitions","patternProperties"])if(value[keyword]!==undefined) {
    if(!record(value[keyword]))throw new Error(`Schema ${keyword} must be an object.`);
    Object.values(value[keyword]).forEach(validateSchema);
  }
  for(const keyword of ["allOf","anyOf","oneOf","prefixItems"])if(value[keyword]!==undefined) {
    if(!Array.isArray(value[keyword]))throw new Error(`Schema ${keyword} must be a list.`);
    value[keyword].forEach(validateSchema);
  }
  for(const keyword of ["items","additionalProperties","not","if","then","else","contains"])if(value[keyword]!==undefined)validateSchema(value[keyword]);
}
