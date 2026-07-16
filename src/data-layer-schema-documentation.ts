export type SchemaPropertyExampleScalar = string | number | boolean | null;
export type SchemaPropertyExampleSelectionMethod = "allowed value" | "custom";

export interface SchemaPropertyExample {
  value: SchemaPropertyExampleScalar;
  selectionMethod: SchemaPropertyExampleSelectionMethod;
}

export interface SchemaPropertyDocumentation {
  displayName: string;
  description: string;
  comments?: string;
  example?: SchemaPropertyExample;
}

export interface SchemaDocumentation {
  description?: string;
  properties?: Readonly<Record<string, SchemaPropertyDocumentation>>;
}

export interface DocumentationSchema {
  id: string;
  name: string;
  version: number;
  parentSchemaId?: string;
  documentation?: SchemaDocumentation;
}

export interface ResolvedPropertyDocumentation extends SchemaPropertyDocumentation {
  mappingPath: string;
  origin: Pick<DocumentationSchema, "id" | "name" | "version">;
  inherited: boolean;
}

export interface ResolvedSchemaDocumentation {
  description?: string;
  descriptionOrigin?: Pick<DocumentationSchema, "id" | "name" | "version">;
  properties: Readonly<Record<string, ResolvedPropertyDocumentation>>;
}

function pathSegments(path: string): string[] {
  return path.replaceAll(".", "/").split("/").map((segment) => segment.trim()).filter(Boolean);
}

export function canonicalDocumentationPath(path: string, wildcardNumeric = false): string {
  return `/${pathSegments(path).map((segment) => wildcardNumeric && /^\d+$/.test(segment) ? "*" : segment).join("/")}`;
}

function cleanText(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function setSchemaDescription(documentation: SchemaDocumentation, description: string): SchemaDocumentation {
  const next = cleanText(description);
  const properties = documentation.properties && Object.keys(documentation.properties).length
    ? structuredClone(documentation.properties)
    : undefined;
  return {
    ...(next ? { description:next } : {}),
    ...(properties ? { properties } : {}),
  };
}

export function setPropertyDocumentation(
  documentation: SchemaDocumentation,
  path: string,
  entry: SchemaPropertyDocumentation,
): SchemaDocumentation {
  const canonicalPath = canonicalDocumentationPath(path);
  const displayName = cleanText(entry.displayName);
  const description = cleanText(entry.description);
  const comments = cleanText(entry.comments);
  const example = entry.example ? structuredClone(entry.example) : undefined;
  const properties: Record<string, SchemaPropertyDocumentation> = structuredClone(documentation.properties ?? {});
  if (displayName || description || comments || example) properties[canonicalPath] = { displayName, description, ...(comments ? { comments } : {}), ...(example ? { example } : {}) };
  else delete properties[canonicalPath];
  return {
    ...(documentation.description ? { description:documentation.description } : {}),
    ...(Object.keys(properties).length ? { properties } : {}),
  };
}

export function removePropertyDocumentation(documentation: SchemaDocumentation, path: string): SchemaDocumentation {
  const canonicalPath = canonicalDocumentationPath(path);
  const properties = Object.fromEntries(Object.entries(documentation.properties ?? {})
    .filter(([candidate]) => candidate !== canonicalPath && !candidate.startsWith(`${canonicalPath}/`))
    .map(([candidate, entry]) => [candidate, structuredClone(entry)]));
  return {
    ...(documentation.description ? { description:documentation.description } : {}),
    ...(Object.keys(properties).length ? { properties } : {}),
  };
}

function identity(schema: DocumentationSchema): Pick<DocumentationSchema, "id" | "name" | "version"> {
  return { id:schema.id, name:schema.name, version:schema.version };
}

export function resolveEffectiveSchemaDocumentation(
  schema: DocumentationSchema,
  schemas: readonly DocumentationSchema[],
): ResolvedSchemaDocumentation {
  const chain: DocumentationSchema[] = [];
  const visited = new Set<string>();
  let current: DocumentationSchema | undefined = schema;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    chain.unshift(current);
    current = current.parentSchemaId
      ? schemas.find((candidate) => candidate.id === current?.parentSchemaId)
      : undefined;
  }
  const properties: Record<string, ResolvedPropertyDocumentation> = {};
  let description: string | undefined;
  let descriptionOrigin: Pick<DocumentationSchema, "id" | "name" | "version"> | undefined;
  for (const owner of chain) {
    if (owner.documentation?.description) {
      description = owner.documentation.description;
      descriptionOrigin = identity(owner);
    }
    for (const [path, entry] of Object.entries(owner.documentation?.properties ?? {})) {
      const mappingPath = canonicalDocumentationPath(path);
      properties[mappingPath] = {
        ...structuredClone(entry),
        mappingPath,
        origin:identity(owner),
        inherited:owner.id !== schema.id,
      };
    }
  }
  return {
    ...(description && descriptionOrigin ? { description, descriptionOrigin } : {}),
    properties,
  };
}

function mappingMatches(mappingPath: string, concretePath: string): boolean {
  const mapping = pathSegments(mappingPath);
  const concrete = pathSegments(concretePath);
  return mapping.length === concrete.length
    && mapping.every((segment, index) => segment === "*" || segment === concrete[index]);
}

export function resolvePropertyDocumentation(
  documentation: ResolvedSchemaDocumentation,
  path: string,
): ResolvedPropertyDocumentation | undefined {
  const canonicalPath = canonicalDocumentationPath(path);
  return documentation.properties[canonicalPath]
    ?? Object.values(documentation.properties).find(({ mappingPath }) => mappingMatches(mappingPath, canonicalPath));
}

export function schemaDocumentationSearchText(
  path: string,
  documentation: ResolvedPropertyDocumentation | undefined,
): string {
  return [canonicalDocumentationPath(path), documentation?.displayName, documentation?.description]
    .filter(Boolean).join(" ").toLowerCase();
}
