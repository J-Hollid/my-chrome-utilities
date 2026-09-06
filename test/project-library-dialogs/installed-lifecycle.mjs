import assert from "node:assert/strict";

export async function verifyInstalledDialogLifecycle(side, evaluate) {
  const reports = [];
  for (const workflow of ["edit", "switch", "create", "import"]) {
    for (const completion of ["cancellation", "native close", "Escape"]) {
      await evaluate(side, `(${openInstalledDialog.toString()})(${JSON.stringify(workflow)})`);
      if (completion === "Escape") {
        await side.call("Input.dispatchKeyEvent", {type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
        await side.call("Input.dispatchKeyEvent", {type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
      } else {
        await evaluate(side, `(() => {
          const dialog = document.querySelector("dialog[open]");
          if (${JSON.stringify(completion)} === "native close") dialog.close();
          else [...dialog.querySelectorAll("button")].find(button => /^(Close|Cancel switch)/.test(button.textContent)).click();
        })()`);
      }
      const result = await evaluate(side, `(${observeClosedDialog.toString()})()`);
      assert.deepEqual(result, {closed:true,removed:true,focus:true,unchanged:true}, `${workflow}: ${completion}`);
      reports.push({workflow,completion,...result});
    }
  }
  return reports;
}

async function openInstalledDialog(workflow) {
  const pause = () => new Promise(resolve => setTimeout(resolve, 25));
  const button = (scope, text) => [...scope.querySelectorAll("button")].find(item => item.textContent.trim() === text);
  const repository = await (await import("./data-layer-durable-project-repository.js")).openIndexedDbProjectRepository();
  const before = await repository.loadProject("project-retail");
  let trigger;
  if (workflow === "edit") trigger = button(document.querySelector("#project-library-list > li[data-active=true]"), "Edit details");
  if (workflow === "switch") trigger = button(document.querySelector('[data-project-id="project-trade"]'), "Switch");
  if (workflow === "create") trigger = document.getElementById("create-library-project");
  if (workflow === "import") trigger = document.getElementById("import-library-project");
  trigger.focus();
  if (workflow === "import") {
    const bundle = await repository.exportProject("project-retail");
    const transfer = new DataTransfer();
    transfer.items.add(new File([JSON.stringify(bundle)], "dialog-lifecycle.json", {type:"application/json"}));
    const input = document.getElementById("import-library-project-file");
    Object.defineProperty(input, "files", {value:transfer.files,configurable:true});
    input.dispatchEvent(new Event("change", {bubbles:true}));
  } else trigger.click();
  for (let attempt=0;attempt<80&&!document.querySelector("dialog[open]");attempt++) await pause();
  const dialog = document.querySelector("dialog[open]");
  if (!dialog) throw Error(`No ${workflow} dialog`);
  globalThis.projectDialogObservation = {dialog,trigger,before,repository};
}

async function observeClosedDialog() {
  const observation = globalThis.projectDialogObservation;
  for (let attempt=0;attempt<80&&observation.dialog.isConnected;attempt++) {
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  const after = await observation.repository.loadProject("project-retail");
  const result = {
    closed: !observation.dialog.open,
    removed: !observation.dialog.isConnected,
    focus: document.activeElement === observation.trigger && observation.trigger.isConnected,
    unchanged: JSON.stringify(after) === JSON.stringify(observation.before),
  };
  delete globalThis.projectDialogObservation;
  return result;
}
