import assert from "node:assert/strict";

import {
  assignSchema,
  assignableSchemas,
  createSchema,
  createSchemaWorkingDraft,
  discardSchemaWorkingDraft,
  duplicateSchemaRevision,
  inspectSchemaRename,
  migrateSchemaLibrary,
  proposeSchemaWorkingDraftName,
  publishSchemaWorkingDraft,
  resolveSchemaAssignment,
  restoreSchemaLibrary,
  restoreSchemaRevisionDraft,
  schemaRevision,
  schemaRevisionChoices,
  serializeSchemaLibrary,
  updateSchemaWorkingDraft,
  validateEvent,
  validateWithSchema,
} from "../dist/data-layer-schema-verification.js";

for (let sample = 0; sample < 100; sample += 1) {
  const version = 1 + (sample % 9);
  const name = `Schema ${sample}`;
  const document = { type: "object", required: ["id"], properties: { id: { type: "number" } } };
  let current = createSchema(name, version, document);
  current = assignSchema(current, {
    id: `pinned-${sample}`, schemaId: current.id, schemaVersion: version, versionPolicy: "pinned",
    sourceId: "source", eventName: "pinned", target: "payload", enabled: true,
  });
  current = assignSchema(current, {
    id: `latest-${sample}`, schemaId: current.id, versionPolicy: "follow latest",
    sourceId: "source", eventName: "latest", target: "payload", enabled: true,
  });
  const currentSnapshot = structuredClone(current);

  const emptyDraft = createSchemaWorkingDraft(current);
  assert.deepEqual(current, currentSnapshot, "creating a working draft must not mutate the current revision");
  assert.deepEqual(emptyDraft.workingDraft.pendingChanges, [], "a new working draft must begin without pending changes");
  assert.equal(emptyDraft.workingDraft.baseVersion, version, "a draft must record its current base revision");
  assert.equal(emptyDraft.workingDraft.sourceVersion, version, "a draft must record its source revision");

  const duplicateName = createSchema(`Existing ${sample}`, 1, { type:"object" });
  assert.equal(inspectSchemaRename(current, [current, duplicateName], "  ").ready, false,
    "blank generated rename inputs must be rejected");
  assert.equal(inspectSchemaRename(current, [current, duplicateName], ` existing ${sample} `).ready, false,
    "case-insensitive generated collisions must be rejected");
  const proposedName = `Renamed ${sample}`;
  assert.deepEqual(inspectSchemaRename(current, [current, duplicateName], ` ${proposedName} `), {
    ready:true, proposedName, assistance:"Ready to rename",
  });
  const renamedDraft = proposeSchemaWorkingDraftName(emptyDraft, ` ${proposedName} `);
  assert.equal(renamedDraft.name, name, "a rename proposal must not change the current schema name");
  assert.equal(renamedDraft.workingDraft.name, proposedName, "a rename proposal must be trimmed in the draft");
  assert.deepEqual(renamedDraft.workingDraft.pendingChanges, [`Rename schema from ${name} to ${proposedName}`]);
  assert.deepEqual(proposeSchemaWorkingDraftName(renamedDraft, proposedName), renamedDraft,
    "repeated rename input must be idempotent");
  assert.deepEqual(restoreSchemaLibrary(serializeSchemaLibrary([renamedDraft])), [renamedDraft],
    "rename drafts must round-trip through storage");
  assert.deepEqual(discardSchemaWorkingDraft(renamedDraft), current,
    "discarding a rename must restore the unchanged current name");
  const publishedRename = publishSchemaWorkingDraft(renamedDraft);
  assert.equal(publishedRename.id, current.id, "publishing a rename must conserve stable identity");
  assert.equal(publishedRename.name, proposedName, "publishing a rename must promote the proposed name");
  assert.equal(schemaRevision(publishedRename, version).name, name,
    "publishing a rename must conserve the historical revision name");

  const nextDocument = {
    ...document,
    properties: { ...document.properties, [`field_${sample}`]: { type: sample % 2 ? "string" : "boolean" } },
  };
  const draft = updateSchemaWorkingDraft(emptyDraft, { document: nextDocument }, `Add field_${sample}`);
  assert.equal(draft.id, current.id, "draft updates must preserve schema identity");
  assert.equal(draft.version, version, "draft updates must not advance the current revision");
  assert.deepEqual(draft.document, document, "draft updates must not change the current document");
  assert.deepEqual(draft.workingDraft.document, nextDocument, "draft updates must remain isolated in the working document");
  assert.deepEqual(draft.workingDraft.pendingChanges, [`Add field_${sample}`], "draft changes must remain ordered");
  assert.deepEqual(restoreSchemaLibrary(serializeSchemaLibrary([draft])), [draft], "working drafts must round-trip through storage");
  assert.deepEqual(discardSchemaWorkingDraft(draft), current, "discarding a draft must restore the unchanged current schema");

  const published = publishSchemaWorkingDraft(draft);
  assert.equal(published.id, current.id, "publication must preserve stable schema identity");
  assert.equal(published.version, version + 1, "publication must advance exactly one revision");
  assert.equal(published.workingDraft, undefined, "publication must clear the working draft");
  assert.deepEqual(published.document, nextDocument, "publication must promote the working document");
  assert.deepEqual(schemaRevisionChoices(published), [version], "publication must retain the previous revision");
  assert.deepEqual(schemaRevision(published, version).document, document, "historical revision lookup must return an immutable snapshot");
  assert.deepEqual(draft.workingDraft.document, nextDocument, "publication must not mutate its draft input");

  const pinned = resolveSchemaAssignment({ sourceId: "source", eventName: "pinned" }, "https://example.test/", [published]);
  const latest = resolveSchemaAssignment({ sourceId: "source", eventName: "latest" }, "https://example.test/", [published]);
  assert.equal(pinned.schema.version, version, "pinned assignments must resolve their historical revision");
  assert.equal(latest.schema.version, version + 1, "follow-latest assignments must resolve the current revision");

  const restored = restoreSchemaRevisionDraft(published, version);
  assert.equal(restored.version, version + 1, "restoration must not replace the current revision before publication");
  assert.equal(restored.workingDraft.sourceVersion, version, "restoration must identify its historical source");
  assert.deepEqual(restored.workingDraft.pendingChanges, [`Restore revision ${version}`], "restoration must explain its pending change");
  assert.deepEqual(restored.workingDraft.document, document, "restoration must copy the historical document into a draft");

  const duplicate = duplicateSchemaRevision(published, version);
  assert.equal(duplicate.published, false, "historical duplication must create an unpublished schema");
  assert.equal(duplicate.version, 1, "historical duplication must restart revision numbering");
  assert.deepEqual(duplicate.assignments, [], "historical duplication must not copy active assignments");
  assert.deepEqual(assignableSchemas([duplicate]), [], "an unpublished duplicate must not be assignable");

  const republished = publishSchemaWorkingDraft(updateSchemaWorkingDraft(published, { document }, "Restore base document"));
  assert.deepEqual(schemaRevisionChoices(republished), [version + 1, version], "revision choices must be unique and newest first");

  const validationSchema = assignSchema(createSchema(`Validation ${sample}`, 1, document), {
    sourceId: "source", eventName: "event", target: "payload",
  });
  const result = validateEvent({ sourceId: "source", eventName: "event", payload: { id: sample }, rawInput: null }, [validationSchema]);
  assert.equal(result.state, "Valid");

  const recursiveDepth = 1 + (sample % 6);
  let recursiveDocument = { type:"object", properties:{ leaf:{ type:"number" } } };
  let recursivePayload = { leaf:sample };
  const deepestPayload = recursivePayload;
  let deepestPath = "";
  for (let level = 0; level < recursiveDepth; level += 1) {
    if (level % 2 === 0) {
      const property = `level_${level}`;
      recursiveDocument = { type:"object", properties:{ [property]:recursiveDocument } };
      recursivePayload = { [property]:recursivePayload };
      deepestPath = `/${property}${deepestPath}`;
    } else {
      const property = `items_${level}`;
      recursiveDocument = { type:"object", properties:{ [property]:{ type:"array", items:recursiveDocument } } };
      recursivePayload = { [property]:[recursivePayload] };
      deepestPath = `/${property}/0${deepestPath}`;
    }
  }
  recursiveDocument = { ...recursiveDocument, additionalProperties:false };
  const extraProperty = `extra_${sample}`;
  deepestPayload[extraProperty] = true;
  const recursiveSchema = createSchema(`Recursive ${sample}`, 1, recursiveDocument);
  const recursiveEvent = { sourceId:"source", eventName:"recursive", payload:recursivePayload, rawInput:null };
  const recursiveDocumentSnapshot = structuredClone(recursiveDocument);
  const recursivePayloadSnapshot = structuredClone(recursivePayload);
  const recursiveIssues = validateWithSchema(recursiveEvent, recursiveSchema, [recursiveSchema]).issues;
  assert.deepEqual(recursiveIssues.map(({ instancePath, message, actual }) => ({ instancePath, message, actual })), [{
    instancePath:`${deepestPath}/${extraProperty}`, message:"Undeclared property", actual:"boolean",
  }], "closed-object validation must find one concrete extra property through generated object and array depths");
  assert.deepEqual(validateWithSchema(recursiveEvent, recursiveSchema, [recursiveSchema]).issues, recursiveIssues,
    "recursive validation must be deterministic and idempotent");
  const openRecursiveSchema = { ...recursiveSchema, document:{ ...recursiveDocument, additionalProperties:true } };
  assert.equal(validateWithSchema(recursiveEvent, openRecursiveSchema, [openRecursiveSchema]).issues
    .some(({ message }) => message === "Undeclared property"), false,
  "opening the generated root policy must suppress recursive undeclared-property issues");
  assert.deepEqual(recursiveDocument, recursiveDocumentSnapshot,
    "recursive validation must conserve generated schema documents");
  assert.deepEqual(recursivePayload, recursivePayloadSnapshot,
    "recursive validation must conserve generated payloads");

  const legacy = [version, version + 1, version + 2].map((legacyVersion, index) => assignSchema(
    createSchema(`Legacy ${sample}`, legacyVersion, { type: "object", properties: { [`revision_${legacyVersion}`]: { type: "string" } } }),
    {
      id: `legacy-${sample}-${index}`, schemaId: `schema:legacy-${sample}:${legacyVersion}`,
      schemaVersion: legacyVersion, versionPolicy: index % 2 ? "follow latest" : "pinned",
      sourceId: "source", eventName: `legacy-${index}`, target: "payload",
    },
  ));
  const legacySnapshot = structuredClone(legacy);
  const migrated = migrateSchemaLibrary(legacy);
  assert.equal(migrated.length, 1, "legacy revision rows must collapse to one schema");
  assert.equal(migrated[0].version, version + 2, "migration must preserve the newest current revision");
  assert.deepEqual(schemaRevisionChoices(migrated[0]), [version + 1, version], "migration must retain older revisions newest first");
  assert.equal(migrated[0].assignments.every(({ schemaId }) => schemaId === migrated[0].id), true, "migration must retarget assignments to stable identity");
  assert.deepEqual(restoreSchemaLibrary(serializeSchemaLibrary(legacy)), migrated, "restoring legacy storage must apply schema migration");
  assert.deepEqual(migrateSchemaLibrary(migrated), migrated, "schema migration must be idempotent");
  assert.deepEqual(legacy, legacySnapshot, "schema migration must not mutate legacy input");
}
