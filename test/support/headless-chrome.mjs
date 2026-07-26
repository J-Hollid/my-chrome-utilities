import { existsSync } from "node:fs";
import path from "node:path";

export function chromeExecutableCandidates({
  env = process.env,
  platform = process.platform,
} = {}) {
  const overrides = [env.CHROME_PATH, env.CHROME_BIN].filter(Boolean);
  const pathApi = platform === "win32" ? path.win32 : path.posix;
  const delimiter = platform === "win32" ? ";" : ":";
  const pathDirectories = (env.PATH ?? "").split(delimiter).filter(Boolean);

  if (platform === "win32") {
    const installed = [
      env.PROGRAMFILES,
      env["PROGRAMFILES(X86)"],
      env.LOCALAPPDATA,
    ]
      .filter(Boolean)
      .map((root) => pathApi.join(root, "Google", "Chrome", "Application", "chrome.exe"));
    return [
      ...overrides,
      ...installed,
      ...pathDirectories.map((directory) => pathApi.join(directory, "chrome.exe")),
    ];
  }

  if (platform === "darwin") {
    return [
      ...overrides,
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      ...pathDirectories.flatMap((directory) => [
        pathApi.join(directory, "google-chrome"),
        pathApi.join(directory, "chromium"),
      ]),
    ];
  }

  return [
    ...overrides,
    ...pathDirectories.flatMap((directory) => [
      pathApi.join(directory, "google-chrome"),
      pathApi.join(directory, "google-chrome-stable"),
      pathApi.join(directory, "chromium"),
      pathApi.join(directory, "chromium-browser"),
    ]),
  ];
}

export function resolveChromeExecutable(options = {}) {
  const exists = options.exists ?? existsSync;
  const candidates = chromeExecutableCandidates(options);
  const executable = candidates.find((candidate) => exists(candidate));
  if (executable) return executable;
  throw new Error(
    `Chrome executable not found. Set CHROME_PATH to an installed Chrome binary. Checked: ${candidates.join(", ")}`,
  );
}

export function headlessChromeArguments(profile, extensionRoot) {
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
    ...(extensionRoot ? [
      "--enable-extensions",
      "--disable-features=DisableDisableExtensionsExceptCommandLineSwitch",
      `--disable-extensions-except=${extensionRoot}`,
    ] : []),
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
