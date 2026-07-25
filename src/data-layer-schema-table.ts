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

export const schemaTableEditableFacets=["description","expected-or-allowed","example"] as const;
export type SchemaTableEditableFacet=typeof schemaTableEditableFacets[number];

export function schemaTableExpectedOrAllowed(value:{expectedValue?:unknown;allowedValues?:readonly unknown[]}):string {
  if(value.expectedValue!==undefined)return String(value.expectedValue);
  return (value.allowedValues??[]).map(String).join(", ");
}
