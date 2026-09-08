/** Adapt existing single-source consumer fixtures to the current subscription port. */
export function installFixtureObservationApi(api) {
  if (!api?.scripting || api.runtime?.id || api.__observationFixturePort) return api;
  api.__observationFixturePort=true;
  const execute=api.scripting.executeScript.bind(api.scripting),channels=new Map(),listeners=new Map();
  api.runtime??={};
  api.runtime.onMessage??={addListener(){},removeListener(){}};
  const messages=api.runtime.onMessage,add=messages.addListener.bind(messages),remove=messages.removeListener.bind(messages);
  messages.addListener=listener=>{
    const translated=(message,sender)=>{
      const channel=channels.get(message.channelId);
      if(message.type==='my-chrome-utilities.data-layer-history-entry'&&channel){
        listener({type:'twa-observation',channel:message.channelId,arrayId:channel.arrayId,
          index:channel.index++,rawValue:message.rawValue,timestamp:message.timestamp},sender);
      }else listener(message,sender);
    };
    listeners.set(listener,translated);add(translated);
  };
  messages.removeListener=listener=>{remove(listeners.get(listener)??listener);listeners.delete(listener);};
  api.scripting.executeScript=async details=>{
    if(details.func?.name==='observationPageBridge')return [{result:true}];
    if(details.func?.name!=='observationArrayHook')return execute(details);
    const [action,path,channelId]=details.args;
    if(action==='detach'){channels.delete(channelId);return [{result:true}];}
    let channel=channels.get(channelId);
    if(!channel){
      channel={arrayId:'fixture:'+details.target.tabId+':'+path,index:0};channels.set(channelId,channel);
      // Retain legacy fixture callbacks; the adapter changes only their wire format.
      await execute({...details,args:[path,channelId,'fixture-observation']});
    }
    const [result]=await execute({...details,args:[path]});
    let value=result?.result;
    for(const segment of path.replace(/^window\./,'').split('.'))value=value?.[segment];
    if(!Array.isArray(value))return [{result:{status:value===undefined?'Waiting for path':'Not an array'}}];
    channel.index=Math.max(channel.index,value.length);
    return [{result:{status:'Ready',arrayId:channel.arrayId,rawValues:value}}];
  };
  return api;
}
