export const targetSend='function(a,b){for(var i=0;i<u.extend.length;i++)u.extend[i](a,b);}';
export const targetExtension='function(a,b){window.calls++;return "selected-extension";}';
const definition=(uid,ext)=>`(function(){var u={};u.extend=[${ext}];u.send=${targetSend};utag.sender[${uid}]=u;utag.loader.cfg[${uid}]={title:'Tag ${uid}'};})();`;
const selected=definition(21,targetExtension),wrong=definition(99,'function(){return "wrong-extension";}');
export function targetFixture(pathname,base,port,response) {
 const scripts={
  '/targets/duplicate.js':definition(21,'')+definition(99,''),
  '/targets/selected.js':selected,
  '/targets/copy.js':`var another=${targetSend};`,
  '/targets/bundle.js':wrong+selected,
  '/targets/wrong.js':wrong,
  '/targets/shared.js':definition(99,targetExtension),
  '/targets/empty.js':definition(21,''),
  '/targets/unreadable.js':selected+`Object.defineProperty(utag.sender[21],'extend',{get(){window.calls++;throw Error('unreadable')}});`,
 };
 if(scripts[pathname]){response.setHeader('Content-Type','text/javascript');response.end(scripts[pathname]);return true;}
 const routes={
  'targets-duplicate':[['duplicate.js','']],
  'targets-separate':[['selected.js','utag_shop.main_21'],['copy.js','']],
  'targets-unique':[['bundle.js',''],['wrong.js','']],
  'targets-definitions':[['bundle.js','']],
  'targets-shared':[['selected.js',''],['shared.js','']],
  'targets-empty':[['empty.js','']],
  'targets-unreadable':[['unreadable.js','utag_shop.main_21']],
 };
 const route=routes[pathname.slice(1)];if(!route)return false;
 response.setHeader('Content-Type','text/html');
 response.end(`<!doctype html><title>Tealium ${pathname.slice(1)}</title><script>${base}</script>`+route.map(([file,id])=>`<script id='${id}' src='http://assets.shop.example:${port}/targets/${file}?revision=source-targets'></script>`).join(''));
 return true;
}
