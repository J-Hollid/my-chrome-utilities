const string = {type:'string'};
const strings = {type:'array', items:string};
const object = properties => ({type:'object', additionalProperties:false, properties, required:Object.keys(properties)});
const array = items => ({type:'array', items});
const source = object({fileId:string, sheet:string, range:string});
export const proposalSchema = object({
  summary:string,
  changes:array(object({
    id:string, kind:{type:'string', enum:['profiles','propertySets','pages','events','applicabilitySets','flows','fixtures','assignments']},
    action:{type:'string', enum:['create','update','reuse']}, targetId:{type:['string','null']},
    name:string, recordJson:string, reason:string, sources:array(source), dependsOn:strings, questions:strings,
  })),
  templates:array(object({id:{type:'string',pattern:'^[a-zA-Z0-9_-]{1,100}$'},name:string,kind:{type:'string',enum:['overview','flow','matrix','profile']},fileId:string,sheet:string,prototypeJson:string,limitations:strings})),
  coverage:array(object({fileId:string,sheet:string,range:string,status:{type:'string',enum:['mapped','excluded','unresolved']},reason:string})),
  questions:strings,
});
