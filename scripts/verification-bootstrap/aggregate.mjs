function expectedIdentity(task,result) {
  return JSON.stringify(task)===JSON.stringify(result.identity);
}

export function validateAggregateChildren(tasks,results) {
  const expected=new Map(tasks.map((task)=>[task.key,task]));
  const counts=new Map();
  for (const result of results) counts.set(result.key,(counts.get(result.key)??0)+1);
  const duplicate=[...counts].find(([,count])=>count!==1)?.[0];
  if (duplicate) throw new Error(`Aggregate child result is duplicate: ${duplicate}`);
  const missing=[...expected.keys()].find((key)=>!counts.has(key));
  if (missing) throw new Error(`Aggregate child result is missing: ${missing}`);
  for (const result of results) {
    const task=expected.get(result.key);
    if (!task) throw new Error(`Aggregate child result changed: ${result.key}`);
    if (result.status!=="passed") throw new Error(`Aggregate child failed: ${result.key}`);
    if (!expectedIdentity(task,result)) throw new Error(`Aggregate child identity changed: ${result.key}`);
  }
  return results.map((result)=>structuredClone(result));
}
