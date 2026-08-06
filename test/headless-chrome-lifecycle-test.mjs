import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import {
  chromeExecutableCandidates,
  headlessChromeArguments,
  removeChromeProfile,
  resolveChromeExecutable,
  stopHeadlessChrome,
} from "./support/headless-chrome.mjs";

const args = headlessChromeArguments("/tmp/profile");
assert.ok(args.includes("--disable-background-networking"));
assert.ok(args.includes("--disable-component-update"));
assert.ok(args.includes("--disable-sync"));
assert.ok(args.includes("--user-data-dir=/tmp/profile"));

assert.equal(
  resolveChromeExecutable({
    env: { CHROME_PATH: "/custom/chrome", PATH: "" },
    platform: "linux",
    exists: (candidate) => candidate === "/custom/chrome",
  }),
  "/custom/chrome",
);
assert.deepEqual(
  chromeExecutableCandidates({
    env: {
      PROGRAMFILES: "C:\\Program Files",
      LOCALAPPDATA: "C:\\Users\\Analyst\\AppData\\Local",
      PATH: "",
    },
    platform: "win32",
  }),
  [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Users\\Analyst\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
  ],
);
assert.ok(
  chromeExecutableCandidates({
    env: { PATH: "/usr/bin" },
    platform: "linux",
  }).includes("/usr/bin/google-chrome"),
);
assert.throws(
  () =>
    resolveChromeExecutable({
      env: { PATH: "" },
      platform: "linux",
      exists: () => false,
    }),
  /CHROME_PATH/u,
);

class FakeChrome extends EventEmitter {
  exitCode = null;
  signals = [];
  kill(signal) {
    this.signals.push(signal);
    if (signal === "SIGKILL") {
      this.exitCode = 137;
      queueMicrotask(() => this.emit("exit", this.exitCode));
    }
    return true;
  }
}

const stubbornChrome = new FakeChrome();
await stopHeadlessChrome(stubbornChrome, 1);
assert.deepEqual(stubbornChrome.signals, ["SIGTERM", "SIGKILL"]);

const cooperativeChrome = new FakeChrome();
cooperativeChrome.kill = function kill(signal) {
  this.signals.push(signal);
  this.exitCode = 0;
  queueMicrotask(() => this.emit("exit", 0));
  return true;
};
await stopHeadlessChrome(cooperativeChrome, 20);
assert.deepEqual(cooperativeChrome.signals, ["SIGTERM"]);

const exitedChrome = new FakeChrome();
exitedChrome.exitCode = 0;
await stopHeadlessChrome(exitedChrome, 1);
assert.deepEqual(exitedChrome.signals, []);

const cleanupAttempts = [];
await removeChromeProfile("/tmp/profile-busy", {
  targetId:"LAYERED_CORE",
  retryDelayMilliseconds:1,
  remove:async(profile) => {
    cleanupAttempts.push(profile);
    if (cleanupAttempts.length < 3) throw Object.assign(new Error("busy"), { code:"EBUSY" });
  },
  wait:async() => {},
});
assert.equal(cleanupAttempts.length, 3, "transient profile cleanup contention is retried");
await assert.rejects(() => removeChromeProfile("/tmp/profile-stuck", {
  targetId:"LAYERED_EDITOR", attempts:2, retryDelayMilliseconds:1,
  remove:async() => { throw Object.assign(new Error("busy"), { code:"EBUSY" }); },
  wait:async() => {},
}), /LAYERED_EDITOR.*\/tmp\/profile-stuck/u,
"exhausted cleanup identifies the logical target and isolated profile path");

console.log("headless Chrome lifecycle tests passed");
