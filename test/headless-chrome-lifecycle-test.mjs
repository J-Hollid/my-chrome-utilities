import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { headlessChromeArguments, stopHeadlessChrome } from "./support/headless-chrome.mjs";

const args = headlessChromeArguments("/tmp/profile");
assert.ok(args.includes("--disable-background-networking"));
assert.ok(args.includes("--disable-component-update"));
assert.ok(args.includes("--disable-sync"));
assert.ok(args.includes("--user-data-dir=/tmp/profile"));

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

console.log("headless Chrome lifecycle tests passed");
