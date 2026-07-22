export const FLOW_RUNTIME_KEYS=Array.from(
  {length:24},
  (_,index)=>`runtime${String(index+1).padStart(3,"0")}`,
);
export const FLOW_RUNTIME_EXECUTION_PLAN=[...FLOW_RUNTIME_KEYS];

const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);

export function flowEvidenceFailures(evidence){
  const failures=[];
  for(const runtime of FLOW_RUNTIME_EXECUTION_PLAN){
    const runtimeEvidence=evidence?.[runtime];
    if(!own(evidence??{},runtime)||runtimeEvidence===null||typeof runtimeEvidence!=="object"||Array.isArray(runtimeEvidence)){
      failures.push({path:runtime,value:own(evidence??{},runtime)?runtimeEvidence:"unexecuted",expected:"non-empty evidence object"});
      continue;
    }
    const leaves=Object.entries(runtimeEvidence);
    if(leaves.length===0){
      failures.push({path:runtime,value:runtimeEvidence,expected:"non-empty evidence object"});
      continue;
    }
    for(const [leaf,value] of leaves)if(value!==true)failures.push({path:`${runtime}.${leaf}`,value,expected:true});
  }
  if(evidence?.installedBoundary!==true)failures.push({path:"installedBoundary",value:evidence?.installedBoundary,expected:true});
  return failures;
}

export function flowInterruptionReport(activePhase,error){
  const index=FLOW_RUNTIME_EXECUTION_PLAN.indexOf(activePhase);
  const later=index>=0
    ?FLOW_RUNTIME_EXECUTION_PLAN.slice(index+1)
    :activePhase==="startup"
      ?FLOW_RUNTIME_EXECUTION_PLAN
      :[];
  return {
    interrupted:activePhase,
    message:error instanceof Error?error.message:String(error),
    later:later.map((runtime)=>({runtime,status:"unexecuted"})),
  };
}
