import {createHash} from "node:crypto";
import {lstat,open,readFile} from "node:fs/promises";
import path from "node:path";

import {defaultRepositoryRuntimeDirectory,ensureSafeDirectory} from
  "./verification-reliability-persistence.mjs";

const sha256Pattern=/^[a-f0-9]{64}$/u;
const receiptPathPattern=/^tmp\/verification-receipts\/[A-Za-z0-9._-]+\.json$/u;

async function receiptDirectory(root){
  return ensureSafeDirectory(path.join(await defaultRepositoryRuntimeDirectory(root),
    "review-ready-receipts"));
}

function canonicalReceiptPath(root,receiptPath){
  if(typeof receiptPath!=="string"||!receiptPathPattern.test(receiptPath)){
    throw new Error("Review-ready evidence requires a canonical receipt path");
  }
  const target=path.resolve(root,receiptPath);
  if(path.relative(path.resolve(root),target).split(path.sep).join("/")!==receiptPath){
    throw new Error("Review-ready evidence receipt escapes the repository");
  }
  return target;
}

export async function readReviewReadyReceipt({root,receiptSha256}){
  if(!sha256Pattern.test(receiptSha256??"")){
    throw new Error("Review-ready evidence receipt digest is malformed");
  }
  const target=path.join(await receiptDirectory(root),`${receiptSha256}.json`);
  let details,bytes;
  try{[details,bytes]=await Promise.all([lstat(target),readFile(target)]);}
  catch(error){
    if(error.code==="ENOENT")throw new Error("Review-ready durable receipt is missing");
    throw error;
  }
  if(!details.isFile()||details.isSymbolicLink()||
      createHash("sha256").update(bytes).digest("hex")!==receiptSha256){
    throw new Error("Review-ready durable receipt digest changed");
  }
  return bytes;
}

export async function persistReviewReadyReceipt({root,receiptPath,receiptSha256}){
  const bytes=await readFile(canonicalReceiptPath(root,receiptPath));
  if(createHash("sha256").update(bytes).digest("hex")!==receiptSha256){
    throw new Error("Review-ready evidence receipt digest changed");
  }
  const target=path.join(await receiptDirectory(root),`${receiptSha256}.json`);
  let handle;
  try{
    handle=await open(target,"wx",0o600);
    await handle.writeFile(bytes);
    await handle.sync();
  }catch(error){if(error.code!=="EEXIST")throw error;}
  finally{await handle?.close();}
  await readReviewReadyReceipt({root,receiptSha256});
  return {version:1,sha256:receiptSha256};
}
