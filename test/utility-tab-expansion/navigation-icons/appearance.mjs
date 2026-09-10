import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
export async function inspectNavigation(browser,native) {
 const rows=[];await mkdir('tmp/utility-icons-images',{recursive:true});
 const key=async(key,code=key)=>{await browser.call('Input.dispatchKeyEvent',{type:'keyDown',key,code},native);await browser.call('Input.dispatchKeyEvent',{type:'keyUp',key,code},native);};
 const inspect=`(()=>{const tabs=[...document.querySelectorAll('#workspace-tabs [role=tab]')];return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,tabs:tabs.map(b=>{const r=b.getBoundingClientRect(),a=b.querySelector('svg').getBoundingClientRect(),s=getComputedStyle(b),t=b.querySelector('.utility-name'),tr=t.getBoundingClientRect();return {id:b.id,name:b.getAttribute('aria-label'),selected:b.getAttribute('aria-selected'),panel:b.getAttribute('aria-controls'),visible:!document.getElementById(b.getAttribute('aria-controls')).hidden,x:r.x,y:r.y,w:r.width,h:r.height,aw:a.width,ah:a.height,border:s.borderStyle,borderWidth:s.borderWidth,outline:s.outlineStyle,outlineWidth:s.outlineWidth,tip:getComputedStyle(t).display,tipText:t.textContent,tipFits:tr.x>=0&&tr.right<=innerWidth,tipTop:tr.top,tipBottom:tr.bottom};})};})()`;
 for(const width of [320,800]) for(const forced of [false,true]) {
  await browser.call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false},native);
  await browser.call('Emulation.setEmulatedMedia',{features:[{name:'forced-colors',value:forced?'active':'none'}]},native);
  for(const [index,id,name]of [[0,'data-layer','Data Layer'],[1,'hotkeys','Hotkeys'],[2,'tealium','Tealium']]) {
   await browser.evaluate(native,`document.querySelector('#workspace-tab-${id}').click()`);
   let value=await browser.evaluate(native,inspect);assert.equal(value.width,width);assert.equal(value.overflow,false);
   assert.deepEqual(value.tabs.map(t=>t.name),['Data Layer','Hotkeys','Tealium']);
   for(const [i,t]of value.tabs.entries()){assert.equal(t.w,44);assert.equal(t.h,44);assert.equal(t.aw,24);assert.equal(t.ah,24);assert.equal(t.y,value.tabs[0].y);if(i)assert.equal(t.x-value.tabs[i-1].x,52);assert.equal(t.visible,i===index);}
   const selected=value.tabs[index];assert.equal(selected.selected,'true');assert.equal(selected.name,name);assert.notEqual(selected.border,'none');
   if(forced)assert.equal(selected.border,'double');
   await browser.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:selected.x+22,y:selected.y+22},native);
   value=await browser.evaluate(native,inspect);assert.equal(value.tabs[index].tip,'block');assert.equal(value.tabs[index].tipText,name);assert.equal(value.tabs[index].tipFits,true);
   await browser.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:width-2,y:850},native);
   await key('Tab');await browser.evaluate(native,`document.querySelector('#workspace-tab-${id}').focus()`);
   value=await browser.evaluate(native,inspect);assert.equal(value.tabs[index].tip,'block');assert.equal(value.tabs[index].tipFits,true);assert.equal(value.tabs[index].outline,'solid');assert.equal(value.tabs[index].outlineWidth,'3px');
   const shot=await browser.call('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:250,scale:1}},native);
   await writeFile(`tmp/utility-icons-images/${width}-${forced?'forced':'normal'}-${id}.png`,Buffer.from(shot.data,'base64'));
   rows.push({width,forced,id,name,geometry:true,tooltip:true,focus:true,selected:true});
  }
  for(const [press,wanted]of [['Home','data-layer'],['ArrowRight','hotkeys'],['ArrowRight','tealium'],['ArrowLeft','hotkeys'],['End','tealium'],['Home','data-layer']]) {
   await key(press);assert.equal(await browser.evaluate(native,'document.activeElement.id'),'workspace-tab-'+wanted);
   assert.equal(await browser.evaluate(native,`document.querySelector('#workspace-tab-${wanted}').getAttribute('aria-selected')`),'true');
  }
 }
 return rows;
}
