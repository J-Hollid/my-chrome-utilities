import {packagedTealium} from './package.mjs';
import {spawn} from 'node:child_process';
import {mkdir,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import {headlessChromeArguments, resolveChromeExecutable, stopHeadlessChrome, removeChromeProfile}
  from '../support/headless-chrome.mjs';
import {observeBrowserReadiness} from '../support/browser-observation-control.mjs';

// Chrome's extension-action command requires its local pipe transport. Reuse
// the existing executable, profile cleanup, and readiness helpers.
export async function tealiumBrowser(extensionRoot = process.env.TEALIUM_EXTENSION_ROOT, {native = false} = {}) {
  const packaged=extensionRoot?null:await packagedTealium();
  extensionRoot??=packaged.extensionRoot;
  const profile = await mkdtemp(path.resolve('tmp/tealium-browser-'));
  const chromeTemporaryRoot=process.env.SWARMFORGE_CHROME_TMPDIR??'/tmp/sf-chrome';
  await mkdir(chromeTemporaryRoot,{recursive:true});
  const chromeTemporaryDirectory=await mkdtemp(path.join(chromeTemporaryRoot,'tealium-'));
  const args = headlessChromeArguments(profile, extensionRoot).filter(arg => !arg.startsWith('--remote-debugging-port'));
  if (native) args.splice(args.indexOf('--headless=new'), 1, '--ozone-platform=headless');
  args.splice(-1, 0, '--window-size=1280,1000');
  args.splice(-1, 0, '--no-proxy-server', '--host-resolver-rules=MAP *.shop.example 127.0.0.1,MAP shop.example 127.0.0.1');
  args.splice(-1, 0, '--remote-debugging-pipe', '--enable-unsafe-extension-debugging', `--load-extension=${extensionRoot}`);
  const chrome = spawn(resolveChromeExecutable(), args, {stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'],
    env:{...process.env,TMPDIR:chromeTemporaryDirectory}});
  let sequence = 0, buffer = '', stderr = '';
  const pending = new Map();
  let closing=false,transportError;
  const failTransport=error=>{
    if(closing)return;
    transportError=Error(`Tealium Chrome transport failed: ${error.message}; ${stderr}`);
    for(const request of pending.values()){clearTimeout(request.timer);request.reject(transportError);}
    pending.clear();
  };
  chrome.stderr.on('data', value => { stderr = (stderr + value).slice(-2000); });
  chrome.on('error',failTransport);
  chrome.on('exit',(code,signal)=>failTransport(Error(`Chrome exited (${code}, ${signal})`)));
  for(const stream of [chrome.stdio[3],chrome.stdio[4]])stream.on('error',failTransport);
  chrome.stdio[4].on('data', value => {
    buffer += value;
    for (;;) {
      const end = buffer.indexOf('\0');
      if (end < 0) break;
      const message = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1);
      const request = pending.get(message.id);
      if (!request) continue;
      pending.delete(message.id); clearTimeout(request.timer);
      if (message.error) request.reject(Error(message.error.message)); else request.resolve(message.result);
    }
  });
  const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    if(transportError){reject(transportError);return;}
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error(`${method} timed out: ${stderr}`)); }, 15000);
    pending.set(id, {resolve, reject, timer});
    chrome.stdio[3].write(JSON.stringify({id, method, params, ...(sessionId ? {sessionId} : {})}) + '\0');
  });
  const evaluate = async (sessionId, expression) => {
    const result = await call('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true, userGesture: true}, sessionId);
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const attach = async targetId => (await call('Target.attachToTarget', {targetId, flatten: true})).sessionId;
  const wait = (description, observe, ready = value => Boolean(value)) => observeBrowserReadiness({
    targetId: 'tealium', phase: 'fixture', predicateDescription: description,
    timeoutMs: 10000, pollIntervalMs: 25, maximumSnapshotCharacters: 800,
    observe, ready, snapshot: value => value,
  });
  const close = async () => {
    closing=true;
    for (const request of pending.values()) {clearTimeout(request.timer); request.reject(Error('Tealium browser closed'));}
    pending.clear();
    await stopHeadlessChrome(chrome, 3000, {targetId: 'tealium'});
    await removeChromeProfile(profile, {targetId: 'tealium'});
    await rm(chromeTemporaryDirectory,{recursive:true,force:true});
    await packaged?.close();
  };
  try {
    const worker = await wait('installed extension service worker', async () =>
      (await call('Target.getTargets')).targetInfos.find(target => target.type === 'service_worker' &&
        target.url.startsWith('chrome-extension://') && target.url.endsWith('/background.js')));
    const workerSession = await attach(worker.targetId);
    await wait('production action listener registered', () => evaluate(workerSession,
      'Boolean(globalThis.chrome?.action?.onClicked?.hasListeners())'));
    return {call, evaluate, attach, wait, close, origin: `chrome-extension://${new URL(worker.url).hostname}`,
      extensionId: new URL(worker.url).hostname};
  } catch (error) { await close(); throw error; }
}
