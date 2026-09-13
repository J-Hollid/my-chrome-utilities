import {canonical,same} from './settled-final-verification-review.mjs';

export function auditLoadedStepRoutes({packId,features,loadedRoutes}) {
  return features.flatMap(feature=>feature.scenarios.flatMap(scenario=>scenario.steps.flatMap(step=>{
    const matches=loadedRoutes.filter(route=>{
      route.pattern.lastIndex=0;
      return route.pattern.test(step);
    });
    return matches.length===1?[]:[{packId,feature:feature.path,scenario:scenario.name,step,
      result:matches.length?'ambiguous registration':'missing registration'}];
  })));
}

export function compareGovernedTaskPopulation(current,historical,authorizedAdditions=[]) {
  const keys=current.map(task=>task.key);
  const duplicate=keys.find((key,index)=>keys.indexOf(key)!==index);
  if(duplicate)return {result:'duplicate task identity',key:duplicate};
  const currentByKey=new Map(current.map(task=>[task.key,task]));
  const expected=[...historical,...authorizedAdditions];
  for(const task of expected){
    const actual=currentByKey.get(task.key);
    if(!actual)return {result:'missing task identity',key:task.key};
    if(!same(actual,task)){
      const field=[...new Set([...Object.keys(canonical(task)),...Object.keys(canonical(actual))])]
        .find(name=>!same(actual[name],task[name]));
      return {result:`differing ${field} field`,key:task.key,field};
    }
  }
  const allowed=new Set(expected.map(task=>task.key));
  const extra=current.find(task=>!allowed.has(task.key));
  return extra?{result:'unauthorized task identity',key:extra.key}:
    {result:'conserved population',taskCount:current.length};
}
