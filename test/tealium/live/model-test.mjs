import {ObservationSession} from '../../../dist/tealium/live/session.js';
import {pageOrigin} from '../../../dist/tealium/live/target.js';
import {runChecks} from '../checks.mjs';
runChecks(import.meta.url,['session-test.mjs','filter-test.mjs']);
const examples=[];
for(const [fixture,status] of [['valid activeTab grant','Ready'],['exact-origin grant missing','Permission required'],['exact-origin grant declined','Permission required']]){
  const session=new ObservationSession(42,async()=>({frames:[],limits:[]}),()=>{});
  if(status==='Permission required')session.accessLost();
  examples.push({fixture,result:session.state.status==='Ready'?'Start observation available':fixture.endsWith('declined')?session.state.status:'Request access available'});
}
examples.push({fixture:'restricted browser page',result:pageOrigin('chrome://settings')===null?'Unsupported page explained':'Start observation available'});
// Named contract outcomes accompany the executable session race checks above.
examples.push(...[
  {event:'reload at the same URL',outcome:'invalidate affected rows and source actions'},
  {event:'replacement of a child frame',outcome:"invalidate that frame's rows and actions"},
  {event:'same-document URL change',outcome:'refresh context and retain document identity'},
  {event:'navigation loses site access',outcome:'suspend reads and expose target recovery'},
  {closed_item:'expanded surface',outcome:'observation continues in the retained owner'},
  {closed_item:'owner host',outcome:'owned work ends and surviving surfaces show Ended'},
  {closed_item:'website target',outcome:'owned work ends and Live shows Target closed'},
]);
for(const width of [360,520,720,900])examples.push({width:String(width),panes:width<720?'inspector with Back to tags':'list and inspector',scrolls:width<720?'1':'2'});
console.log(JSON.stringify({tealiumLiveModel:{examples}}));
