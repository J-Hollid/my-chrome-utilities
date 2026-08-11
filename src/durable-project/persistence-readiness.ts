export type DurablePersistenceReadinessStatus="saving"|"settled"|"failed";

export interface DurablePersistenceReadiness{
  saving():void;
  saved():Promise<void>;
  failed():void;
}

export function createDurablePersistenceReadiness(
  publish:(status:DurablePersistenceReadinessStatus)=>void,
  settle:()=>Promise<void>,
):DurablePersistenceReadiness{
  let generation=0;
  return{
    saving(){generation+=1;publish("saving");},
    async saved(){
      const candidate=generation;
      try{
        await settle();
        if(candidate===generation)publish("settled");
      }catch{
        if(candidate===generation)publish("failed");
      }
    },
    failed(){generation+=1;publish("failed");},
  };
}
