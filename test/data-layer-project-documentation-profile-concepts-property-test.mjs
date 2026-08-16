import assert from "node:assert/strict";
import {profileConceptPresentation,updateProfileConceptPaths} from "../dist/project-documentation/workspace-profile-concepts.js";

let seed=0x51c0ffee;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/0x100000000);
const shuffle=(values)=>{const result=[...values];for(let index=result.length-1;index>0;index-=1){const target=Math.floor(random()*(index+1));[result[index],result[target]]=[result[target],result[index]];}return result;};

for(let sample=0;sample<320;sample+=1){
  const properties=shuffle(Array.from({length:12+Math.floor(random()*30)},(_,index)=>{
    const group=index%3,path=`/${String(sample).padStart(3,"0")}/${group===0?"identity":group===1?"commerce":"ungrouped"}/${String(index).padStart(3,"0")}`;
    return{path,...(group===2?index%2?{concept:"   "}:{}:{concept:group===0?(index%2?"IDENTITY":" identity "):(index%2?"Commerce":" COMMERCE ")})};
  })),allPaths=properties.map(({path})=>path),selectedPaths=allPaths.filter(()=>random()>.45),commercePaths=properties.filter(({concept})=>concept?.trim().toLocaleLowerCase()==="commerce").map(({path})=>path),unrelatedPaths=allPaths.filter((path)=>!commercePaths.includes(path)),unrelatedBefore=unrelatedPaths.filter((path)=>selectedPaths.includes(path)),setIncluded=sample%2===0;
  for(const [action,expectedCommerce] of [["include-all",commercePaths],["exclude-all",[]],["reset",setIncluded?commercePaths:[]]]){
    const updated=updateProfileConceptPaths(allPaths,selectedPaths,commercePaths,action,setIncluded),updatedTwice=updateProfileConceptPaths(allPaths,updated,commercePaths,action,setIncluded);
    assert.deepEqual(updated.filter((path)=>unrelatedPaths.includes(path)),unrelatedBefore,"bulk updates conserve every unrelated Profile path");
    assert.deepEqual(updated.filter((path)=>commercePaths.includes(path)),expectedCommerce,"bulk updates implement include, exclude, and reset-to-Set policy");
    assert.deepEqual(updatedTwice,updated,"every concept bulk action is idempotent");
    assert.deepEqual(updated,allPaths.filter((path)=>updated.includes(path)),"bulk updates retain canonical stable path order");
  }

  const activePath=commercePaths[Math.floor(random()*commercePaths.length)],query=activePath.slice(activePath.lastIndexOf("/")+1),filter=["all","included","excluded","overrides"][sample%4],input={concepts:[{name:"Identity",included:true},{name:"Commerce",included:setIncluded},{name:"Ungrouped",included:true}],properties,selectedPaths,activeConcept:"cOmMeRcE",query,filter},before=JSON.stringify(input),presentation=profileConceptPresentation(input),selected=new Set(selectedPaths),expected=commercePaths.filter((path)=>{
    const included=selected.has(path),override=included!==setIncluded,visible=filter==="all"||(filter==="included"?included:filter==="excluded"?!included:override);
    return visible&&path.toLocaleLowerCase().includes(query.toLocaleLowerCase());
  });
  assert.equal(JSON.stringify(input),before,"search and filtering never mutate the Profile presentation model");
  assert.deepEqual(presentation.properties.map(({path})=>path),[...expected].sort(),"search and filters expose exactly the active concept's matching paths");
  const completePresentation=profileConceptPresentation({...input,query:"",filter:"all"});
  const conceptSearch=profileConceptPresentation({...input,query:"cOmMeRcE",filter:"all"});
  assert.deepEqual(conceptSearch.concepts.map(({name})=>name),["Commerce"],"concept-name search retains matching concept context only");
  assert.deepEqual(conceptSearch.properties.map(({path})=>path),[...commercePaths].sort(),"concept-name search exposes every active-concept property in stable order");
  assert.equal(completePresentation.concepts.find(({name})=>name==="Commerce")?.total,commercePaths.length,"concept matching is case-insensitive");
  assert.equal(completePresentation.concepts.find(({name})=>name==="Ungrouped")?.total,properties.length-commercePaths.length-properties.filter(({concept})=>concept?.trim().toLocaleLowerCase()==="identity").length,"blank and absent concepts share the Ungrouped entry");
}

console.log("Project documentation Profile concept property tests passed");
