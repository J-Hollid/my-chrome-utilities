import {timingSafeEqual} from 'node:crypto';

export function authorize(request,token,allowedOrigins=[]) {
  const origin=request.headers.origin;
  if(origin && !/^chrome-extension:\/\/[a-p]{32}$/u.test(origin) && !allowedOrigins.includes(origin)) throw new Error('Origin is not allowed.');
  const supplied=Buffer.from(String(request.headers.authorization ?? '').replace(/^Bearer /u,'')),expected=Buffer.from(token);
  if(supplied.length!==expected.length || !timingSafeEqual(supplied,expected)) throw new Error('Connection token is missing or invalid.');
}
export function cors(request,response,allowedOrigins=[]) {
  const origin=request.headers.origin;
  if(origin && (/^chrome-extension:\/\/[a-p]{32}$/u.test(origin)||allowedOrigins.includes(origin))) {
    response.setHeader('Access-Control-Allow-Origin',origin);
    response.setHeader('Vary','Origin');
    response.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
    response.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Private-Network','true');
  }
  response.setHeader('Cache-Control','no-store');
  response.setHeader('X-Content-Type-Options','nosniff');
}
export async function readBody(request) {
  if(!String(request.headers['content-type']).startsWith('application/json'))throw new Error('Use application/json.');
  const chunks=[];let length=0;
  for await(const chunk of request) {length+=chunk.length;if(length>40*1024*1024)throw new Error('Request exceeds 40 MiB.');chunks.push(chunk);}
  return JSON.parse(Buffer.concat(chunks).toString());
}
export function json(response,status,value) {response.writeHead(status,{'Content-Type':'application/json'});response.end(JSON.stringify(value));}
