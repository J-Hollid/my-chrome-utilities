export function headlessChromeArguments(profile) {
  return [
    "--headless=new",
    "--disable-gpu",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-sync",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ];
}

function exitWithin(chrome, milliseconds) {
  if (chrome.exitCode !== null) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      chrome.removeListener("exit", exited);
      resolve(false);
    }, milliseconds);
    const exited = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    chrome.once("exit", exited);
  });
}

export async function stopHeadlessChrome(chrome, timeoutMilliseconds = 1000) {
  if (chrome.exitCode !== null) return;
  chrome.kill("SIGTERM");
  if (await exitWithin(chrome, timeoutMilliseconds)) return;
  chrome.kill("SIGKILL");
  await exitWithin(chrome, timeoutMilliseconds);
}
