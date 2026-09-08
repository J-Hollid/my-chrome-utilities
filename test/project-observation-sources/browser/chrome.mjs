import {wait} from '../../browser-packs/shared-harness.mjs';

/** Small CDP client using Node's native WebSocket. No page behavior is simulated here. */
async function connect(url) {
  const socket=new WebSocket(url),pending=new Map(),events=[];
  let sequence=0;
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('DevTools connection timeout')),15000);
    socket.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
    socket.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('DevTools connection failed'));},{once:true});
  });
  socket.addEventListener('message',message=>{
    const response=JSON.parse(message.data),entry=pending.get(response.id);
    if(!entry){events.push(response);return;}
    clearTimeout(entry.timer);pending.delete(response.id);
    if(response.error)entry.reject(new Error(response.error.message));else entry.resolve(response.result);
  });
  const rawCall=(method,params={})=>{
    const id=++sequence;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{pending.delete(id);reject(new Error('DevTools '+method+' timeout'));},30000);
      pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));
    });
  };
  const client={events,async call(method,params={}){
    const previous=method==='Page.reload'?(await rawCall('Page.getFrameTree')).frameTree.frame.loaderId:undefined;
    const result=await rawCall(method,params);
    if(method==='Page.navigate'||method==='Page.reload'){
      const deadline=performance.now()+15000;
      while(true){
        const frame=(await rawCall('Page.getFrameTree')).frameTree.frame;
        const current=method==='Page.reload'?frame.loaderId!==previous:!result.loaderId||frame.loaderId===result.loaderId;
        if(current){
          try{
            const ready=await rawCall('Runtime.evaluate',{expression:"document.readyState === 'complete'",returnByValue:true});
            if(ready.result?.value)break;
          }catch(error){if(!/context|navigat/i.test(error.message))throw error;}
        }
        if(performance.now()>deadline)throw new Error('Extension document did not finish navigation');
        await wait(10);
      }
    }
    return result;
  },close(){for(const entry of pending.values())clearTimeout(entry.timer);socket.close();}};
  for(const domain of ['Runtime','Page','Network','Log'])await client.call(domain+'.enable');
  return client;
}

export async function evaluate(socket,expression) {
  const result=await socket.call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);
  return result.result.value;
}
export async function extensionId(port) {
  for(let attempt=0;attempt<160;attempt++){
    const targets=await fetch(`http://127.0.0.1:${port}/json/list`).then(response=>response.json());
    const worker=targets.find(target=>target.type==='service_worker'&&target.url.startsWith('chrome-extension://')&&new URL(target.url).pathname==='/background.js');
    if(worker)return new URL(worker.url).hostname;
    await wait(25);
  }
  throw new Error('Unpacked extension did not load');
}
export async function pageSocket(port,url) {
  const page=await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'}).then(response=>response.json());
  const client=await connect(page.webSocketDebuggerUrl);await client.call('Page.navigate',{url});return client;
}
