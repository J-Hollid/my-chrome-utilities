const quote=value=>`'${String(value).replaceAll("'","'\\''")}'`;
export function presentQuery(answer,options) {
  const expansion=options.expand;
  if(expansion&&!['checks','consumers',...answer.slices.map(s=>s.id)].includes(expansion))
    throw new Error(`Unknown expansion target: ${expansion}`);
  const invocation=options.mode==="path"?["path",options.path]:["changes","--base",options.base,"--task",options.task,
    ...(options.packs??[]).flatMap(p=>["--pack",p])];
  const command=target=>`node scripts/verification-ownership-query.mjs ${invocation.map(quote).join(" ")} --expand ${quote(target)}`;
  const list=(items,name)=>({count:items.length,entries:expansion===name?items:items.slice(0,10),
    omitted:expansion===name?0:Math.max(0,items.length-10),expandCommand:command(name)});
  return {...answer,checks:list(answer.checks,"checks"),consumers:list(answer.consumers,"consumers"),
    slices:answer.slices.map(({declaration,...slice})=>({...slice,expandCommand:command(slice.id),
      ...(expansion===slice.id?{declaration}:{})}))};
}
export function queryText(a) {
  const lines=[`Advisory ${a.mode} query`, `Worktree: ${a.worktree}`,`HEAD: ${a.head}`,
    `Registry: ${a.registryIdentity}${a.registryDirty?" (uncommitted)":""}`,`Dirty: ${a.dirty}`];
  if(a.base)lines.push(`Base: ${a.base}`,a.workingTreeNotice);
  if(a.ownership)lines.push(`Ownership: ${a.ownership.kind}; ${a.ownership.owner??"none"}; exists=${a.ownership.exists}`,
    `Reason: ${a.ownership.reason}`,`Authority: ${JSON.stringify(a.ownership.provenance??null)}`);
  if(a.readiness)lines.push(`Readiness: ${a.readiness.classification}`,`Next stage: ${a.readiness.nextStage}`,
    `Reason: ${a.readiness.reason}`,`Expansion: ${JSON.stringify(a.readiness.expansionCauses)}`);
  for(const key of ["changeSet","dispositions","parentPackSliceFallbacks"])
    if(a[key])lines.push(`${key}: ${JSON.stringify(a[key])}`);
  lines.push(`Packs: ${a.packIds.join(", ")||"none"}`,`Slices: ${a.slices.map(s=>s.id).join(", ")||"none"}`,
    `Restrictions: ${a.restrictions.join("; ")||"none"}`,`Terminal obligations: ${a.terminalFullObligations.join(", ")||"none"}`);
  for(const name of ["checks","consumers"])lines.push(`${name}: ${a[name].count} (${a[name].omitted} omitted)`,
    ...a[name].entries.map(item=>`  ${JSON.stringify(item)}`),`Expand: ${a[name].expandCommand}`);
  for(const slice of a.slices)lines.push(`${slice.id}: ${JSON.stringify(slice.declaration??slice.provenance)}`,
    `Expand: ${slice.expandCommand}`);
  return lines.join("\n")+"\n";
}
