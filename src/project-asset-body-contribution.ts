const safeSegment = (value:string, label:string):string => {
  if (!/^[a-z0-9][a-z0-9._-]*$/u.test(value)) {
    throw new DOMException(`${label} is not a safe project asset-body segment.`, "DataError");
  }
  return value;
};

export interface ProjectAssetBodyIdentity {
  projectId:string;
  namespace:string;
  digest:string;
}

export interface ProjectAssetBodyCommandItem {
  identity:ProjectAssetBodyIdentity;
  body:Blob;
  stagingToken:string;
}

export interface ProjectAssetBodyStore {
  storeProjectAssetBody(identity:ProjectAssetBodyIdentity, body:Blob):Promise<void>;
  loadProjectAssetBody(identity:ProjectAssetBodyIdentity):Promise<Blob>;
}

export function projectAssetBodyStorageKey(identity:ProjectAssetBodyIdentity):string {
  if (identity.namespace === "flow-visual") return `${identity.projectId}:${identity.digest}`;
  const namespace = safeSegment(identity.namespace, "Asset-body namespace");
  const digest = safeSegment(identity.digest, "Asset-body digest");
  return `${identity.projectId}:asset-body:${namespace}:${digest}`;
}

export function projectAssetBodyArchiveEntry(
  input:{namespace:string;digest:string;extension:string},
):string {
  const digest = safeSegment(input.digest, "Asset-body digest");
  const extension = safeSegment(input.extension, "Asset-body extension");
  if (input.namespace === "flow-visual") return `assets/${digest}.${extension}`;
  const namespace = safeSegment(input.namespace, "Asset-body namespace");
  return `assets/${namespace}/${digest}.${extension}`;
}
