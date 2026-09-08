/** Wait for the installed builder to finish its current save and render cycle. */
export async function waitForBuilderPersistence(
  read=()=>document.documentElement.dataset.specificationStudioPersistence,
  pause=()=>new Promise(resolve=>setTimeout(resolve,25)),
) {
  for(let attempt=0;attempt<480;attempt++) {
    const status=read();
    if(status==="settled")return;
    if(status==="failed")throw new Error("Builder save failed before the next action");
    await pause();
  }
  throw new Error("Builder persistence did not settle before the next action");
}

export function builderDocumentationReady(dom) {
  return dom.readyState==="complete"&&
    dom.documentElement.dataset.specificationStudioPersistence==="settled"&&
    Boolean(dom.querySelector('#project-tree button[data-kind="documentation"]'));
}

export async function waitForBuilderDocumentation(socket,evaluate,pause) {
  for(let attempt=0;attempt<120;attempt++) {
    try {
      if(await evaluate(socket,`(${builderDocumentationReady.toString()})(document)`))return;
    } catch(error) {
      if(!/navigated|context|closed/i.test(String(error)))throw error;
    }
    await pause(50);
  }
  throw new Error("The builder Documentation route did not finish loading");
}
