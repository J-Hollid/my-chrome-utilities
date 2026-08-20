import {reorderItems} from "./model.js";

export class StableIdentitySequence {
  readonly #create:()=>string;
  #values:string[]=[];

  constructor(readonly prefix:string,create:()=>string=()=>`${prefix}:${crypto.randomUUID()}`){
    this.#create=create;
  }

  reconcile(length:number):readonly string[]{
    const size=Math.max(0,length);
    if(this.#values.length>size)this.#values=this.#values.slice(0,size);
    while(this.#values.length<size)this.#values.push(this.#create());
    return this.values();
  }

  values():string[]{return[...this.#values];}

  replace(values:readonly string[]):void{this.#values=[...values];}

  append():string{const value=this.#create();this.#values.push(value);return value;}

  remove(index:number):void{if(index>=0&&index<this.#values.length)this.#values.splice(index,1);}

  move(fromIndex:number,toIndex:number):void{
    const item=this.#values[fromIndex];
    if(item===undefined)return;
    this.#values=reorderItems(this.#values.map(id=>({id})),item,toIndex).map(({id})=>id);
  }
}
