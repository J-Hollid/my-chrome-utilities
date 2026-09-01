function fail(message) { throw new Error(`Bootstrap early gate ${message}`); }

function validateIncidentKeys(incidents,repairProtocols) {
  const protocols=new Map(repairProtocols.map((protocol)=>[protocol.incidentId,protocol.taskKey]));
  for (const incident of incidents) {
    const failureKey=incident.failure?.task?.key;
    const retryKey=incident.failure?.retryScope?.taskKey;
    const regressionKey=incident.repair?.regression?.key;
    const protocolKey=protocols.get(incident.id);
    if (!failureKey||retryKey!==failureKey||regressionKey!==failureKey||
        protocolKey!==failureKey) {
      fail(`incident, regression, and repair-protocol key alignment failed: ${incident.id}`);
    }
  }
}

function validateTaskRuntime(plan,executables,availableCapabilities,maximumOutputBytes) {
  const capabilities=new Set(availableCapabilities);
  for (const task of plan.tasks) {
    if (executables[task.executable]!==true) fail(`executable is unavailable: ${task.executable}`);
    if (task.requiredCapabilities.some((capability)=>!capabilities.has(capability))) {
      fail(`capability is unavailable: ${task.key}`);
    }
    if (task.outputLimitBytes>maximumOutputBytes) fail(`output capacity is too small: ${task.key}`);
  }
}

function validateMutationDeclaration(plan) {
  const mutation=plan.tasks.filter(({stage})=>stage==="mutation-discovery");
  if (mutation.length!==1) fail("mutation inventory task is missing or duplicated");
  const target=mutation[0].args.at(-1);
  if (!plan.tasks.some(({key})=>key===target)) fail("mutation target command is not selected");
}

export function validateBootstrapEarlyGate({plan,conservation,handlerClosure,incidents,
  repairProtocols,executables,availableCapabilities,maximumOutputBytes,evidenceState}) {
  if (conservation?.changed!==false) fail("conservation freshness failed");
  if (handlerClosure?.closed!==true) fail("handler closure failed");
  validateIncidentKeys(incidents??[],repairProtocols??[]);
  validateTaskRuntime(plan,executables??{},availableCapabilities??[],maximumOutputBytes);
  validateMutationDeclaration(plan);
  if (evidenceState?.eligible!==true) fail("evidence state is not eligible");
  return {launchEligible:true,taskKeys:plan.tasks.map(({key})=>key)};
}
