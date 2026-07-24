import type {LayerConstraint,LayerScope} from "./data-layer-layered-schema.js";

export type CanonicalScalarType="string"|"number"|"integer"|"boolean"|"null";
export type CanonicalPropertyType=CanonicalScalarType|"object"|"array";
export type CanonicalPresenceMode="optional"|"required"|"required-when"|"forbidden"|"forbidden-when";
export type CanonicalPredicateOperator="Equals"|"Does not equal"|"Exists"|"Does not exist"|"Starts with"|"Contains"|"Matches pattern"|"Greater than"|"At least"|"Less than"|"At most";

export interface CanonicalPredicateLeaf {kind:"predicate";propertyId:string;operator:CanonicalPredicateOperator;value?:unknown;}
export interface CanonicalPredicateGroup {kind:"all"|"any"|"not";children:CanonicalPredicate[];}
export type CanonicalPredicate=CanonicalPredicateLeaf|CanonicalPredicateGroup;
export interface CanonicalPredicateEvidence {matched:boolean;branches:{label:string;matched:boolean;propertyId?:string}[];}
export interface CanonicalAllowedValue {id:string;value:unknown;label?:string;}
export interface CanonicalRule {id:string;kind:"pattern"|"range"|"cardinality"|"condition"|"custom";pattern?:string;minimum?:number;maximum?:number;minItems?:number;maxItems?:number;condition?:CanonicalPredicate;severity:"error"|"warning";message?:string;enabled?:boolean;reusableRuleId?:string;name?:string;revision?:number;operator?:string;provenance?:CanonicalProvenance;}
export interface CanonicalDocumentation {displayText:string;description:string;comments:string;example:{method:"allowed-value"|"custom"|"blank";value?:unknown};}
export interface CanonicalProvenance {source:"created"|"saved-schema"|"requirements"|"structured-schema"|"structured-draft"|"path-constraint";sourceId?:string;revision?:number;contributorId?:string;contributorName?:string;scope?:LayerScope;state?:"inherited"|"shadowed"|"effective";}
export interface CanonicalPropertyNode {
  id:string;name:string;parentId?:string;order:number;type:CanonicalPropertyType;itemType?:CanonicalPropertyType;
  presence:{mode:CanonicalPresenceMode;condition?:CanonicalPredicate};allowedValues:CanonicalAllowedValue[];rules:CanonicalRule[];
  documentation:CanonicalDocumentation;provenance:CanonicalProvenance[];overrideReferences:string[];expectedValue?:unknown;enforcement?:"invariant"|"overridable";target?:string;
}
export interface CanonicalSchemaDocument {
  id:string;revision:number;state:"Draft";contributorId:string;contributorName:string;rootIds:string[];nodes:Record<string,CanonicalPropertyNode>;
  source?:{identity:string;revision:number;provenance:"saved-schema-library"|"project-composed-effective"};selectedPropertyId?:string;view:"tree"|"table";
  sourceContent?:{document:Record<string,unknown>;rules:readonly Record<string,unknown>[];documentation:unknown;examples:readonly unknown[];definitionsByNodeId?:Record<string,Record<string,unknown>>;pathsByNodeId?:Record<string,string>};
  changes:{revision:number;propertyIds:string[];kind:CanonicalCommand["kind"]|"synchronize"}[];
}
export interface CanonicalSchemaInput {id:string;contributorId:string;contributorName:string;source?:CanonicalSchemaDocument["source"];}
export type CanonicalIdFactory=(kind:string)=>string;
export type CanonicalCommand=
  |{kind:"add";baseRevision:number;name:string;type:CanonicalPropertyType;parentId?:string;afterId?:string;id:CanonicalIdFactory}
  |{kind:"rename";baseRevision:number;propertyId:string;name:string}
  |{kind:"move";baseRevision:number;propertyId:string;parentId?:string;afterId?:string}
  |{kind:"duplicate";baseRevision:number;propertyId:string;id:CanonicalIdFactory}
  |{kind:"delete";baseRevision:number;propertyId:string}
  |{kind:"set";baseRevision:number;propertyId:string;patch:Partial<Omit<CanonicalPropertyNode,"id"|"parentId"|"order"|"provenance">>}
  |{kind:"type";baseRevision:number;propertyId:string;type:CanonicalPropertyType;itemType?:CanonicalPropertyType;confirmed?:boolean}
  |{kind:"select";baseRevision:number;propertyId:string}
  |{kind:"view";baseRevision:number;view:"tree"|"table"};
export type CanonicalCommandResult=
  |{status:"applied"|"rebased";document:CanonicalSchemaDocument}
  |{status:"conflict";document:CanonicalSchemaDocument;propertyId?:string;message:string}
  |{status:"confirmation-required";document:CanonicalSchemaDocument;propertyId:string;impact:string};

export {canonicalCommandOutcome,applyCanonicalCommand,addCanonicalProperty,renameCanonicalProperty,setCanonicalProperty,changeCanonicalPropertyType,createCanonicalRepository} from "./data-layer-canonical-schema-commands.js";

export {createCanonicalSchema,canonicalPropertyPath,canonicalTableRows} from "./data-layer-canonical-schema-model.js";
export {evaluateCanonicalPredicate} from "./data-layer-canonical-schema-predicates.js";
export {canonicalConstraints,canonicalSchemaWithConstraint,canonicalRequirements} from "./data-layer-canonical-schema-constraints.js";


export {hasLegacySchemaRepresentation,migrateLegacyProfile,resolveCanonicalMigrationConflict,canonicalSchemaFromJsonSchema,canonicalNodeFromValue} from "./data-layer-canonical-schema-migration.js";
export type {CanonicalMigrationFacet,CanonicalMigrationChoice,CanonicalMigrationConflict,CanonicalMigrationPlan,CanonicalLegacyProfile} from "./data-layer-canonical-schema-migration.js";
