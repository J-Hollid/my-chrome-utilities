export function parseHandoff(content) {
  const [header,body=""]=content.split(/\n\n/u,2);
  const headers={};
  for (const line of header.split(/\r?\n/u)) {
    const index=line.indexOf(": ");
    if (index>0) headers[line.slice(0,index)]=line.slice(index+2);
  }
  return {headers,body,content};
}

export function renderHandoff(headers,body) {
  const preferred=["id","from","to","recipient","priority","type","name","authority",
    "authority-commit","task","active-handoff","mode","supersedes","replacement-handoff",
    "message","content-digest","created_at","enqueued_at","claimed_by","claim_token",
    "dequeued_at","completed_at","failure-reason"];
  const keys=[...preferred.filter((key)=>headers[key]),...Object.keys(headers)
    .filter((key)=>!preferred.includes(key)).sort()];
  return `${keys.map((key)=>`${key}: ${headers[key]}`).join("\n")}\n\n${body}`;
}

export function bindingKey(headers) {
  return [headers.name,headers.to,headers.task,headers["active-handoff"]].join("--")
    .replaceAll(/[^A-Za-z0-9._-]/gu,"_");
}
