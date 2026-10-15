import {parseArgs} from 'node:util';
import {startCompanion} from './server.mjs';

const {values}=parseArgs({options:{port:{type:'string',default:'46117'},workspace:{type:'string',default:'tmp/codex-companion'},'allow-origin':{type:'string',multiple:true,default:[]}}});
const port=Number(values.port);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Choose a valid port.');
const companion=await startCompanion({root:values.workspace,port,allowedOrigins:values['allow-origin']});
console.log(`Twatility companion: ${companion.url}`);
console.log(`Connection token file: ${companion.tokenPath}`);
console.log('Use this URL and token in Specification Studio > Agent. Keep the token private.');
console.log(`For Tailscale, serve this loopback port on an unused HTTPS port: tailscale serve --bg --https=8444 ${port}`);
let stopping=false;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(stopping)return;stopping=true;await companion.close();process.exitCode=0;});
