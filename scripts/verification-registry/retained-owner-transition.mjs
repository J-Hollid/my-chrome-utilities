import {execFileSync} from "node:child_process";
import {digestValue} from "./compact-conservation-identity.mjs";
import {parsedOwnerTransitionAuthority,verificationContractSyntaxLeaves} from "./contract-conservation.mjs";

export const retainedChildDispatchTransition=Object.freeze({
  id:"serena-historical-child-dispatch",
  fromOwner:"test/verification-contracts/historical-planning-contract-test.mjs",
  toOwner:"test/verification-contracts/historical-child-dispatch-contract-test.mjs",
  sourceBlob:"5be18322054c5dbac3b67e7efbb3f59725185dce",
  authority:{commit:"a231ac2088bbc1453648503bfebb7437d6b86a3c",
    path:"features/verification-process-exact-slice-execution.feature",
    scenario:"Verification process exact slice execution 009",
    supersedes:"4aea38cdf4899dc0a606215cc106ab743533c2fa"},
});
let expectedPopulation;

function authenticatedPopulation(){
  if(expectedPopulation)return expectedPopulation;
  const {authority,sourceBlob,fromOwner,toOwner}=retainedChildDispatchTransition;
  execFileSync("git",["merge-base","--is-ancestor",authority.commit,"HEAD"]);
  const previous=parsedOwnerTransitionAuthority(authority.supersedes);
  const successor=parsedOwnerTransitionAuthority(authority.commit);
  const same=(a,b)=>digestValue(a)===digestValue(b);
  const approved={aggregate_contract:"historical-planning-contract-test",
    child_boundary_group:"historical-child-dispatch-contract-test"};
  if(previous.error||successor.error||successor.examples.length!==previous.examples.length+1||
      !previous.examples.every(row=>successor.examples.some(next=>same(row,next)))||
      successor.examples.filter(row=>same(row,approved)).length!==1){
    throw new Error("Retained owner transition specification authority mismatch");
  }
  const source=execFileSync("git",["cat-file","blob",sourceBlob],{encoding:"utf8"});
  const start=source.indexOf("let childDispatchRepairEvidence;");
  const end=source.indexOf("const changeRepository =",start);
  if(start<0||end<=start)throw new Error("Retained owner transition source boundary missing");
  const child=verificationContractSyntaxLeaves(source.slice(start,end),toOwner);
  const parent=verificationContractSyntaxLeaves(source.slice(0,start)+source.slice(end),fromOwner);
  if(child.assertions.length!==8||child.fixtures.length!==1||child.evidence.length!==0){
    throw new Error("Retained owner transition approved population mismatch");
  }
  expectedPopulation={[fromOwner]:parent,[toOwner]:child};
  return expectedPopulation;
}

export function validateRetainedOwnerTransition(document,state){
  const declarations=document.compatibility?.retainedOwnerTransitions;
  if(!declarations){
    if(Object.hasOwn(state.leavesByOwner,retainedChildDispatchTransition.toOwner)){
      throw new Error("Retained owner transition authority missing");
    }
    return true;
  }
  if(digestValue(declarations)!==digestValue([retainedChildDispatchTransition])){
    throw new Error("Retained owner transition authority mismatch");
  }
  for(const [owner,leaves] of Object.entries(authenticatedPopulation())){
    if(digestValue(state.leavesByOwner[owner])!==digestValue(leaves)){
      throw new Error(`Retained owner transition population mismatch ${owner}`);
    }
  }
  return true;
}
