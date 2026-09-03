const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right);

function featureArguments(identity){
  const features=identity?.target?.split(",")??[];
  const args=identity?.args??[];
  if(!features.length||features.some((feature)=>!feature)||
      args[0]!=="acceptance-pack-runner"||args[1]!==identity.packId||
      args.length!==2+features.length*2){
    return undefined;
  }
  return features.map((feature,index)=>({feature,args:args.slice(2+index*2,4+index*2)}));
}

export function receiptBoundAcceptanceShardIdentity(canonical,incident){
  const failed=incident?.failure?.task;
  const scope=incident?.failure?.retryScope;
  if(canonical?.stage!=="acceptance-session"||failed?.stage!=="acceptance-session"||
      scope?.kind!=="task"||scope.taskKey!==failed.key||
      !same(scope.executionArgs,failed.args)||failed.key!==canonical.key||
      failed.executable!==canonical.executable||failed.packId!==canonical.packId||
      !same(failed.environment??null,canonical.environment??null)||
      !same(failed.requiredCapabilities??[],canonical.requiredCapabilities??[])){
    return canonical;
  }
  const canonicalFeatures=featureArguments(canonical);
  const failedFeatures=featureArguments(failed);
  if(!canonicalFeatures||!failedFeatures)return canonical;
  let priorIndex=-1;
  for(const entry of failedFeatures){
    const index=canonicalFeatures.findIndex(({feature})=>feature===entry.feature);
    if(index<=priorIndex||!same(entry.args,canonicalFeatures[index]?.args))return canonical;
    priorIndex=index;
  }
  return failed;
}

export function projectReceiptBoundAcceptanceShardIdentities(identities,incident){
  return identities.map((identity)=>receiptBoundAcceptanceShardIdentity(identity,incident));
}
