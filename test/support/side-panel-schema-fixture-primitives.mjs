export const guidedRuntimeWaitHelpers = `
  const waitForCondition = async (read, description, attempts = 150, interval = 20) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const value = await read();
      if (value) return value;
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error("Timed out waiting for " + description + "; " + JSON.stringify({
      startDisabled:document.querySelector("#start-data-layer-testing")?.disabled,
      startHidden:document.querySelector("#start-data-layer-testing")?.hidden,
      endHidden:document.querySelector("#end-data-layer-testing")?.hidden,
      historyPath:document.querySelector("#history-path")?.value,
      historyPathDisabled:document.querySelector("#history-path")?.disabled,
      historyPathStatus:document.querySelector("#history-path-status")?.textContent,
      targetResult:document.querySelector("#observation-target-result")?.textContent,
      readiness:document.querySelector("#live-setup-readiness")?.textContent,
      targetList:document.querySelector("#observation-target-list")?.textContent,
      sessionMessage:document.querySelector("#live-session-message")?.textContent,
    }));
  };
  const waitForElement = (selector, attempts, interval) => waitForCondition(() => document.querySelector(selector), selector, attempts, interval);
  const endActiveSession = async () => {
    const end = document.querySelector("#end-data-layer-testing");
    if (!end || end.hidden) return;
    end.click();
    await waitForCondition(() => {
      const start = document.querySelector("#start-data-layer-testing");
      return start && !start.hidden;
    }, "active guided fixture session to end");
  };`;

export const openPageviewInspector = `
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:23, windowId:4, url:"http://127.0.0.1:4173/", title:"Fixture", active:true }] },
    scripting:{ executeScript:async () => [{ result:{ queue:{ history:[{ event:"pageview", page_type:"product_list", page_name:"Products" }] } } }] },
  };
  await endActiveSession();
  if (!document.querySelector("#live-event-feed button")) {
    let start = document.querySelector("#start-data-layer-testing:not(:disabled)");
    if (!start) {
      document.querySelector("#choose-observation-target").click();
      (await waitForElement("#observation-target-list [data-target-id]")).click();
      start = await waitForElement("#start-data-layer-testing:not(:disabled)");
    }
    start.click();
  }
  const eventButton = await waitForElement("#live-event-feed button");
  eventButton.click();`;
