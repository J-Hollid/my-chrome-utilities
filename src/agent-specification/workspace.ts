import {CompanionClient,requestCompanionPermission} from "./client.js";
import {AgentSession,type AgentWorkspaceHost} from "./session.js";
import {requestForm} from "./request-form.js";
import {renderAgentReview} from "./review-ui.js";
import {agentFile,flowAgentFiles} from "./files.js";
import {projectAgentContext} from "./context.js";
import {templatePreview} from "./template-preview-ui.js";
import {element,button,field,showJson,download,installAgentStyles} from "./ui-elements.js";

export function installAgentWorkspace(host:AgentWorkspaceHost):void {
  installAgentStyles();
  const dialog=element("dialog");dialog.className="agent-workspace";dialog.setAttribute("aria-label","Specification agent");
  const title=element("h2","Specification agent"),header=element("header"),status=element("output");status.setAttribute("role","status");
  header.append(title,button("Close",()=>dialog.close()));
  const endpoint=element("input");endpoint.type="url";endpoint.value=localStorage.getItem("twatility-companion-endpoint")??"http://127.0.0.1:46117";
  const token=element("input");token.type="password";token.autocomplete="off";token.value=sessionStorage.getItem(`twatility-companion-token:${endpoint.value}`)??"";
  const connection=element("details");connection.open=true;
  connection.append(element("summary","Codex companion connection"),element("p","Start the companion in WSL. Enter its localhost or Tailscale HTTPS address and the token from its connection-token file."),field("Companion endpoint",endpoint),field("Connection token",token));
  const session=new AgentSession(host),request=element("section"),review=element("section"),results=element("section"),taskTools=element("nav"),feedback=element("textarea");feedback.rows=3;
  let client:CompanionClient|undefined,form:ReturnType<typeof requestForm>|undefined,timer:ReturnType<typeof setTimeout>|undefined,busy=false,activeProject="";
  const run=async(work:()=>Promise<void>):Promise<void>=>{
    if(busy){status.textContent="Wait for the current operation to finish.";return;}
    busy=true;dialog.setAttribute("aria-busy","true");
    try{await work();}catch(error){status.textContent=error instanceof Error?error.message:String(error);if(!dialog.open)dialog.showModal();}finally{busy=false;dialog.removeAttribute("aria-busy");}
  };
  const connected=():CompanionClient=>{if(!client)throw new Error("Connect to the companion first.");if(session.value&&session.value.endpoint!==client.endpoint)throw new Error("Connect to the address used by this saved task, or start a new task.");return client;};
  const redraw=():void=>{
    if(!session.value){review.replaceChildren();taskTools.hidden=true;return;}
    taskTools.hidden=false;
    renderAgentReview(review,session.value.review,{run,save:async value=>{await session.review(value);redraw();status.textContent="Review saved.";},template:async(plan,action)=>{
      const result=await session.template(connected(),plan,action);
      if(result instanceof Blob)download(result,`${plan.name}.xlsx`);
      else if(action==="preview")results.replaceChildren(templatePreview(result),button("Download preview workbook",()=>run(async()=>download(await connected().artifact(session.require().request.id,plan.id+"-preview"),`${plan.name}-preview.xlsx`))));
      else results.replaceChildren();
      redraw();status.textContent=action==="save"?"Template saved. Select it in the Documentation template library for export.":action==="preview"?"Preview uses the current project data. Check repeated rows and layout before saving.":"Template downloaded.";
    }});
  };
  const poll=async():Promise<void>=>{
    clearTimeout(timer);
    if(!dialog.open||!client||!session.value)return;
    try {
      const task=await session.receive(await connected().task(session.value.request.id));
      status.textContent=`${task.status}: ${task.error??task.stage}`;
      if(task.status==="running"||task.status==="queued")timer=setTimeout(()=>{if(busy)timer=setTimeout(()=>void poll(),1500);else void poll();},1500);
      else redraw();
    } catch(error){status.textContent=`Connection stopped. Your review is saved. ${error instanceof Error?error.message:String(error)}`;}
  };
  connection.append(button("Connect",()=>run(async()=>{
    await requestCompanionPermission(endpoint.value);client=new CompanionClient(endpoint.value,token.value);
    const health=await client.health();if(health.protocol!==1||health.service!=="twatility-companion")throw new Error("This endpoint is not a supported companion.");
    localStorage.setItem("twatility-companion-endpoint",client.endpoint);sessionStorage.setItem(`twatility-companion-token:${client.endpoint}`,token.value);
    status.textContent=`Connected · ${health.auth} · ${health.plan??"No plan reported"}`;connection.open=false;
    if(session.value&&session.value.endpoint===client.endpoint)await poll();
  })));
  const start=button("Create draft",()=>run(async()=>{
    if(!client)throw new Error("Connect to the companion first.");if(!form)return;
    if(session.value?.task&&["running","queued"].includes(session.value.task.status))throw new Error("Stop the current task before starting another.");
    const values=form.values();if(!values.description)throw new Error("Enter a request.");
    if(values.flowId&&!values.permittedIds.includes(values.flowId))throw new Error("Allow the selected Flow before using it as context.");
    const {state,revision}=await host.read();if(state.project.id!==activeProject)throw new Error("The active project changed. Open the agent control again.");
    const files=await Promise.all(Array.from(form.files.files??[]).map(file=>agentFile(file,file.name)));
    files.push(...await flowAgentFiles(state.project,values.flowId,host.assetBodies));
    if(["import","template","both"].includes(values.mode)&&!files.some(file=>file.name.endsWith(".xlsx")))throw new Error("Choose an Excel .xlsx specification.");
    if(["import","both"].includes(values.mode)&&!values.sourceKey)throw new Error("Enter an import source key for matching later imports.");
    status.textContent="Sending project context and files…";
    await session.start(client,{id:crypto.randomUUID(),projectId:state.project.id,baseRevision:revision,mode:values.mode,description:values.description,sourceKey:values.sourceKey,allowNewDefinitions:values.allowNewDefinitions,permittedIds:values.permittedIds,context:projectAgentContext(state.project,values.permittedIds,values.flowId,values.selectedProperties),files},values.selectedProperties);
    redraw();await poll();
  }));
  taskTools.append(button("Resume or retry connection",()=>run(async()=>{const value=session.require();await session.receive(await connected().create(value.request));await poll();})),button("Stop task",()=>run(async()=>{await session.receive(await connected().stop(session.require().request.id));clearTimeout(timer);status.textContent="Task stopped. The review is saved.";redraw();})),button("Inspect source cells",()=>run(async()=>{results.replaceChildren(showJson(await connected().sources(session.require().request.id)));})),button("Check accepted changes",()=>run(async()=>{
    const {applyAcceptedChanges}=await import("./apply.js");const {state}=await host.read();const result=applyAcceptedChanges(state,session.require().review);status.textContent=`${result.applied.length} changes passed the specification checks. They have not been saved.`;
  })),button("Apply accepted changes",()=>run(async()=>{status.textContent=`Saved ${await session.apply()} accepted changes to the project draft.`;redraw();})));
  const revise=button("Send feedback and refresh context",()=>run(async()=>{await session.revise(connected(),feedback.value);redraw();await poll();}));
  dialog.append(header,connection,status,request,start,taskTools,review,field("Revision feedback",feedback),revise,results);document.body.append(dialog);
  dialog.addEventListener("close",()=>clearTimeout(timer));
  const open=button("Specification agent",()=>run(async()=>{
    const {state}=await host.read();activeProject=state.project.id;title.textContent=`Specification agent · ${state.project.name}`;
    form=requestForm(state.project);request.replaceChildren(form.root);await session.load(state.project.id);redraw();results.replaceChildren();
    if(session.value)status.textContent=`Saved task: ${session.value.task?.status??"request saved"}. Connect to ${session.value.endpoint} to continue.`;else status.textContent="Choose allowed definitions, describe the task, and create a draft.";
    dialog.showModal();
  }));open.id="specification-agent";
  (document.querySelector(".studio-header-status")??document.body).append(open);
}
