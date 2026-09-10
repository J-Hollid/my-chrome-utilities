import type { PageTag } from '../detection/types.js';
import {tagDefinitions} from './definitions.js';
export type SourceDestination = 'send' | 'extend';
export interface LoadedSource { url: string; content: string; }
export interface SourceResolution {
  status: 'Resolved' | 'Ambiguous' | 'Unresolved'; detail: string;
  url?: string; line?: number; column?: number; exact?: boolean;
}
export function resolveTagSource(tag: Pick<PageTag, 'senderSource' | 'requestUrls' | 'extensionSources'>,
  resources: LoadedSource[], destination: SourceDestination = 'send'): SourceResolution {
  if(destination==='extend'&&!Array.isArray(tag.extensionSources))return {status:'Unresolved',detail:'u.extend unavailable'};
  const available=resources.filter(r=>/^https?:\/\//.test(r.url)&&r.content);
  const distinct=available.filter((r,i)=>available.findIndex(other=>other.url===r.url&&other.content===r.content)===i);
  const inspected=distinct.map(resource=>{
    const definitions=tagDefinitions(resource.content,tag.senderSource,tag.extensionSources);
    return {...resource,sends:definitions.locations,definitions};
  });
  let candidates=inspected.filter(r=>tag.requestUrls.includes(r.url));
  if(!candidates.length) {
    candidates=inspected.filter(r=>r.sends.length>0);
    if(tag.extensionSources?.length) {
      const narrowed=candidates.filter(r=>r.definitions.arrays.length>0);
      if(narrowed.length)candidates=narrowed;
    }
  }
  const urls=[...new Set(candidates.map(r=>r.url))];
  if(urls.length>1)return {status:'Ambiguous',detail:'Multiple possible containing files'};
  const file=candidates[0];
  if(!file)return {status:'Unresolved',detail:'No verified loaded source is available'};
  if(new Set(available.filter(r=>r.url===file.url).map(r=>r.content)).size>1)return {status:'Ambiguous',detail:'Different loaded frame resources share this URL'};
  const {arrays,sends}=file.definitions;
  const sameOwner=(a:typeof arrays[number],s:typeof sends[number])=>a.owner===s.owner&&a.scope===s.scope&&a.generation===s.generation;
  const associatedSend=sends.filter(s=>arrays.some(a=>sameOwner(a,s)));
  const associatedArray=arrays.filter(a=>sends.some(s=>sameOwner(a,s)));
  let offset: number | undefined;
  if(destination==='send') {
    if(file.sends.length===1)offset=file.sends[0];
    else if(associatedSend.length===1 && arrays.length===1)offset=associatedSend[0]!.offset;
  } else if(associatedArray.length===1 && (tag.extensionSources!.length>0 || sends.length===1))offset=associatedArray[0]!.offset;
  if(offset===undefined)return {url:file.url,line:0,column:0,status:'Resolved',exact:false,
    detail:'Exact location unavailable; opened file'};
  const before=file.content.slice(0,offset);
  return {url:file.url,line:before.split('\n').length-1,column:offset-before.lastIndexOf('\n')-1,
    status:'Resolved',exact:true,detail:destination==='send'?'Unique registered tag code':'Unique registered extension array'};
}
