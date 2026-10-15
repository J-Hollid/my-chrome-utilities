import {CodexClient,isolatedCodexArguments} from './codex-client.mjs';
export async function readAccount(root) {
  const client=new CodexClient(root,await isolatedCodexArguments(root));
  try {
    const server=await client.initialize(),account=await client.request('account/read');
    let limits;try {limits=await client.request('account/rateLimits/read');} catch {}
    return {protocol:1,service:'twatility-companion',server:server.userAgent,auth:account.account?.type??'signed-out',plan:account.account?.planType??null,limits,checkedAt:Date.now()};
  } finally {await client.close();}
}
