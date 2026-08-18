import { createHash } from "node:crypto";

const stableValue=/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u;
const sha40=/^[0-9a-f]{40}$/u;
const digestPattern=/^sha256:[0-9a-f]{64}$/u;
const authoredFields=new Set(["type","to","priority","name","authority","authority-commit",
  "task","active-handoff","mode","supersedes","replacement-handoff","message"]);
const generatedFields=new Set(["id","recipient","created_at","enqueued_at","dequeued_at",
  "completed_at","content-digest","claimed_by","claim_token","failure-reason"]);
const transportFields=new Set([...authoredFields,"id","from","created_at","content-digest"]);
const storedFields=new Set([...transportFields,...generatedFields]);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value==="object") return Object.fromEntries(Object.keys(value).sort()
    .map((key)=>[key,canonical(value[key])]));
  return value;
}

export function authorityDigest(value) {
  const withoutDigest={...value};
  delete withoutDigest.digest;
  return createHash("sha256").update(JSON.stringify(canonical(withoutDigest))).digest("hex");
}

export function classifyOutcome(input) {
  const boundaries=[
    [!input.reversible,"irreversible response"],
    [!input.preservesBehavior,"user-visible behavior change"],
    [input.externalRiskIncrease,"material external risk increase"],
    [input.needsUserOnlyAuthority,"user-only authority, credential, or information"],
    [input.materiallyExpandsScope,"material global scope or cost expansion"],
    [input.weakensEvidence,"safety or evidence weakening"],
  ];
  const crossings=boundaries.filter(([crossed])=>crossed).map(([,label])=>label);
  return crossings.length ? {decision:"escalate",crossings} : {decision:"proceed",crossings:[]};
}

export function boundedExecutionScope({catalogueSize,authorizedTasks,prerequisiteTasks,
  broadTaskThreshold=50}) {
  const tasks=[...new Set([...authorizedTasks,...prerequisiteTasks])];
  return {catalogueSize,tasks,taskCount:tasks.length,materiallyBroad:tasks.length>=broadTaskThreshold};
}

function required(headers,key) {
  const value=headers[key];
  if (typeof value!=="string" || !value.trim()) throw new Error(`Unblocker requires ${key}`);
  return value;
}

function validateFields(headers,allowed,draft) {
  for (const key of Object.keys(headers)) {
    if (allowed.has(key)) continue;
    if (draft && (generatedFields.has(key) || key==="from")) {
      throw new Error(`Unblocker draft field ${key} is reserved or generated`);
    }
    throw new Error(`Unknown unblocker field ${key}`);
  }
}

function validateRequiredFields(headers) {
  for (const field of ["type","to","priority","name","authority","authority-commit","task",
    "active-handoff","mode","supersedes","message"]) required(headers,field);
}

function validateTypeAndPriority(headers) {
  if (headers.type!=="unblocker") throw new Error("Unblocker type must be unblocker");
  if (headers.priority!=="00") throw new Error("Unblocker priority must be 00");
}

function validateRecipient(headers) {
  if (headers.to.includes(",") || !stableValue.test(headers.to)) {
    throw new Error("Unblocker requires exactly one canonical recipient");
  }
}

function validateStableIdentities(headers) {
  for (const field of ["name","authority","task","active-handoff","supersedes"]) {
    if (!stableValue.test(headers[field])) throw new Error(`Unblocker ${field} must be canonical`);
  }
}

function validateAuthorityCommit(headers) {
  if (!sha40.test(headers["authority-commit"])) {
    throw new Error("Unblocker authority-commit must be a full immutable commit");
  }
}

function validateReplacementMode(headers) {
  required(headers,"replacement-handoff");
  if (!stableValue.test(headers["replacement-handoff"]) ||
    headers.supersedes!==headers["active-handoff"]) {
    throw new Error("Replace unblocker must bind the exact active and replacement handoffs");
  }
}

function validateResumeMode(headers) {
  if (headers["replacement-handoff"]) throw new Error("Resume unblocker cannot bind a replacement handoff");
}

function validateMode(headers) {
  if (!["resume","replace"].includes(headers.mode)) throw new Error("Unblocker mode must be resume or replace");
  if (headers.mode==="replace") validateReplacementMode(headers);
  else validateResumeMode(headers);
}

function validateMessageAndBody(headers,body) {
  if ([...headers.message].length>80) throw new Error("Unblocker message exceeds 80 characters");
  if (Buffer.byteLength(body,"utf8")>4000) throw new Error("Unblocker detail exceeds 4000 bytes");
}

function validateShape(headers,body,allowed,draft=false) {
  validateFields(headers,allowed,draft);
  validateRequiredFields(headers);
  validateTypeAndPriority(headers);
  validateRecipient(headers);
  validateStableIdentities(headers);
  validateAuthorityCommit(headers);
  validateMode(headers);
  validateMessageAndBody(headers,body);
  return {mode:headers.mode,recipient:headers.to};
}

export function validateUnblockerDraft(headers,body="") {
  return validateShape(headers,body,authoredFields,true);
}

export function validateTransportUnblocker(headers,body="") {
  validateShape(headers,body,transportFields);
  required(headers,"id"); required(headers,"from"); required(headers,"content-digest");
  if (unblockerContentDigest(headers,body)!==headers["content-digest"]) {
    throw new Error("Unblocker content digest is invalid or modified");
  }
}

export function unblockerContentDigest(headers,body="") {
  const authored=Object.fromEntries(Object.entries(headers).filter(([key])=>!generatedFields.has(key)));
  return createHash("sha256").update(JSON.stringify(canonical({headers:authored,body}))).digest("hex");
}

export function validateStoredUnblocker(headers,body="") {
  validateFields(headers,storedFields,false);
  required(headers,"content-digest");
  const digestIsCanonical=/^[0-9a-f]{64}$/u.test(headers["content-digest"]);
  const digestMatches=unblockerContentDigest(headers,body)===headers["content-digest"];
  if (!digestIsCanonical || !digestMatches) {
    throw new Error("Stored unblocker content digest is invalid or modified");
  }
  validateShape(headers,body,storedFields);
  required(headers,"id"); required(headers,"from");
}

function validateGrant(headers,grant) {
  const digestIsCanonical=digestPattern.test(grant?.digest??"");
  const digestMatches=grant?.digest===`sha256:${authorityDigest(grant)}`;
  if (!digestIsCanonical || !digestMatches) throw new Error("Authority grant digest is invalid or modified");
  if (grant.name!==headers.authority) throw new Error("Authority name does not match the registered grant");
}

function validateIssuer(grant,issuer) {
  if (!grant.issuerRoles?.includes(issuer)) throw new Error("Unblocker issuer is not authorized");
}

function validateAuthorityAncestry(authorityCommitPresentOnBase,authorityCommitAncestral) {
  if (!authorityCommitPresentOnBase) throw new Error("Candidate-only authority grant is not trusted");
  if (!authorityCommitAncestral) throw new Error("Authority commit is outside the accepted ancestry");
}

function validateActiveBinding(headers,active) {
  const recipientMatches=active.recipient===headers.to;
  const taskMatches=active.task===headers.task;
  const handoffMatches=active.id===headers["active-handoff"];
  if (!recipientMatches || !taskMatches || !handoffMatches) {
    throw new Error("Unblocker authority binding does not match the active handoff");
  }
}

function validateReplaceSender(headers,active,issuer) {
  if (headers.mode==="replace" && active.from!==issuer) {
    throw new Error("Replace unblocker sender must match the active handoff sender");
  }
}

export function validateAuthorityClaim({headers,grant,active,authorityCommitPresentOnBase,
  authorityCommitAncestral}) {
  validateShape(headers,headers.body??"",storedFields);
  const issuer=headers.from??active.from;
  validateGrant(headers,grant);
  validateIssuer(grant,issuer);
  validateAuthorityAncestry(authorityCommitPresentOnBase,authorityCommitAncestral);
  validateActiveBinding(headers,active);
  validateReplaceSender(headers,active,issuer);
  return {trusted:true,authority:grant.name,issuer};
}
