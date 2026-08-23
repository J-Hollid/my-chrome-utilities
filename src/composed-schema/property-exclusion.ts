import {applyCanonicalCommand,canonicalTableRows,type CanonicalSchemaDocument} from "../data-layer-canonical-schema.js";
import type {LayerConstraint} from "../data-layer-layered-schema.js";
import type {ProjectEntity} from "../data-layer-specification-project.js";

const within=(candidate:string,path:string):boolean=>candidate===path||candidate.startsWith(`${path}/`);

export function entityWithInheritedPropertyExcluded(entity:ProjectEntity,propertyId:string,path:string):ProjectEntity {
  const next:ProjectEntity={...entity,excludedPropertyIds:[...new Set([...((entity.excludedPropertyIds as string[]|undefined)??[]),propertyId])],compiledTargetsStale:true};
  if(entity.localSchemaContributions)next.localSchemaContributions=(entity.localSchemaContributions as LayerConstraint[]).filter((constraint)=>!within(constraint.path,path));
  if(entity.schemaConstraints)next.schemaConstraints=(entity.schemaConstraints as LayerConstraint[]).filter((constraint)=>!within(constraint.path,path));
  const canonical=entity.canonicalSchema as CanonicalSchemaDocument|undefined,row=canonical&&canonicalTableRows(canonical).find((candidate)=>candidate.path===path);
  if(row){
    const result=applyCanonicalCommand(canonical,{kind:"delete",baseRevision:canonical.revision,propertyId:row.id});
    if(result.status!=="applied"&&result.status!=="rebased")throw new Error(`Local facets for ${path} could not be removed atomically.`);
    next.canonicalSchema=result.document;
  }
  return next;
}
