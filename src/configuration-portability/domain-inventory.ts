export const COMPLETE_CONFIGURATION_DOMAINS = [
  "projects",
  "savedSchemas",
  "reusableRules",
  "eventLibraries",
  "savedSessions",
  "defects",
  "documentationTemplates",
  "portablePreferences",
  "hotkeys",
] as const;

export type ConfigurationDomain = typeof COMPLETE_CONFIGURATION_DOMAINS[number];

export interface ConfigurationDependency {
  domain:ConfigurationDomain;
  id:string;
}

export interface ConfigurationRecord {
  id:string;
  value:unknown;
  dependencies?:ConfigurationDependency[];
}

export interface ConfigurationBody {
  digest:string;
  mediaType:string;
  bytes:Uint8Array;
}

export interface CompleteConfigurationSnapshot {
  activeProjectId:string|null;
  sections:Record<ConfigurationDomain,ConfigurationRecord[]>;
  bodies:ConfigurationBody[];
}

export function configurationRecordKey(record:ConfigurationRecord & {domain?:ConfigurationDomain}):string {
  if (!record.domain) throw new Error("A configuration conflict must name its domain.");
  return `${record.domain}/${record.id}`;
}

export function assertCompleteDomainInventory(
  sections:Partial<Record<ConfigurationDomain,ConfigurationRecord[]>>,
):asserts sections is Record<ConfigurationDomain,ConfigurationRecord[]> {
  const actual=Object.keys(sections).sort();
  const expected=[...COMPLETE_CONFIGURATION_DOMAINS].sort();
  if(JSON.stringify(actual)!==JSON.stringify(expected)){
    throw new DOMException("The complete configuration domain inventory is incomplete or unknown.","DataError");
  }
  for(const domain of COMPLETE_CONFIGURATION_DOMAINS){
    const records=sections[domain];
    if(!Array.isArray(records)||records.some((record)=>typeof record?.id!=="string"||!record.id)){
      throw new DOMException(`The ${domain} configuration section is invalid.`,"DataError");
    }
    if(new Set(records.map(({id})=>id)).size!==records.length){
      throw new DOMException(`The ${domain} configuration section has duplicate identities.`,"DataError");
    }
  }
}
