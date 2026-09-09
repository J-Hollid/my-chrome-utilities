import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';

export async function tealiumFixtureServer() {
  const real = gunzipSync(await readFile(new URL('./fixtures/utag.js.gz', import.meta.url)));
  if (createHash('sha256').update(real).digest('hex') !==
      '82882bb70abe78a85629baf4859ce01710fd92d1270b025cfdafd8ef9d324b89') {
    throw Error('The real Tealium fixture does not match the approved source identity');
  }
  const hits = [];
  const base = `window.calls=0;window.utag={view(){calls++},link(){calls++},loader:{cfg:{}},sender:{},cfg:{v:'fixture-1'},handler:{iflag:1}};utag.o={'shop.main':utag};`;
  const tag = `utag.loader.cfg['21']={title:'Analytics'};utag.sender['21']={send:function separateSend(){window.calls++;return 'tag-21';}};`;
  const server = http.createServer((request, response) => {
    hits.push(request.url);
    const pathname = new URL(request.url, 'http://fixture').pathname;
    const port=server.address().port;
    response.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self' 'unsafe-inline' http://shop.example:${port} http://assets.shop.example:${port} http://tags.shop.example:${port}; connect-src 'none'; img-src 'self'; frame-src 'self' http://frames.shop.example:${port}`);
    if (pathname === '/scripts/payload.js' || pathname === '/custom/utag.js') {
      response.setHeader('Content-Type', 'text/javascript'); response.end(real); return;
    }
    if (pathname === '/custom/utag.21.js') {
      response.setHeader('Content-Type', 'text/javascript'); response.end(tag); return;
    }
    if (pathname === '/vendor/metrics.js') {
      response.setHeader('Content-Type','text/javascript');
      response.end(`utag.loader.cfg['52']={title:'Custom metrics'};utag.sender['52']={send:function customSend(){window.calls++;return 'tag-52';}};`);return;
    }
    if(['/duplicate-a.js','/duplicate-b.js'].includes(pathname)){
      response.setHeader('Content-Type','text/javascript');response.end(tag);return;
    }
    if(pathname==='/wrapped.js'){
      response.setHeader('Content-Type','text/javascript');
      response.end(tag+`utag.sender[21].send=utag.sender[21].send.bind(utag.sender[21]);`);return;
    }
    if (['/real','/real-custom'].includes(pathname)) {
      response.setHeader('Content-Type', 'text/html');
      response.end(`<!doctype html><title>Tealium real fixture</title><script>window.utag_data={tealium_event:'page_view'};window.utag_cfg_ovrd={path:location.origin+'/custom/'};</script><script src='http://assets.shop.example:${port}${pathname==='/real-custom'?'/custom/utag.js':'/scripts/payload.js'}?revision=original'></script>`);
      return;
    }
    if (pathname === '/separate') {
      response.setHeader('Content-Type', 'text/html');
      response.end(`<!doctype html><title>Tealium separate fixture</title><script>${base}</script><script id='utag_shop.main_21' src='http://shop.example:${port}/custom/utag.21.js?revision=7'></script>`);
      return;
    }
    if (pathname === '/custom') {
      response.setHeader('Content-Type','text/html');
      response.end(`<!doctype html><title>Tealium custom fixture</title><script>${base}</script><script id='utag_shop.main_52' src='http://assets.shop.example:${port}/vendor/metrics.js?version=52'></script>`);return;
    }
    if(pathname==='/frames'){
      response.setHeader('Content-Type','text/html');
      response.end(`<!doctype html><title>Tealium frames fixture</title><script>${base}</script><script id='utag_shop.main_21' src='http://shop.example:${port}/custom/utag.21.js?revision=7'></script><iframe src='/separate?child=1'></iframe><iframe src='http://frames.shop.example:${port}/separate?child=2'></iframe>`);return;
    }
    const cases={
      mixed:`<script>window.utag={view(){},link(){},loader:42};</script><iframe src='/separate'></iframe>`,
      ambiguous:`<script>${base}</script><script src='/duplicate-a.js'></script><script src='/duplicate-b.js'></script>`,
      wrapped:`<script>${base}</script><script id='utag_shop.main_21' src='/wrapped.js'></script>`,
      configured:`<script>${base}utag.loader.cfg[21]={title:'Configured only'}</script>`,
      queue:`<script>window.utag={e:[],view(){},link(){}};</script>`,
      absent:`<script>window.utag={unrelated:true};</script><script src='/utag.js'></script>`,
      unsupported:`<script>window.utag={view(){},link(){},loader:42};</script>`,
      failed:`<script>${base}${tag}</script><script id='utag_shop.main_99' src='/failed-tag.js'></script>`,
    };
    if(Object.hasOwn(cases,pathname.slice(1))){
      response.setHeader('Content-Type','text/html');response.end(`<!doctype html><title>Tealium ${pathname.slice(1)} fixture</title>${cases[pathname.slice(1)]}`);return;
    }
    response.writeHead(404); response.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {origin: `http://shop.example:${server.address().port}`, hits,
    close: () => new Promise(resolve => server.close(resolve))};
}
