const runtimeMessageType = "my-chrome-utilities.data-layer-history-entry";
const pageEventPrefix = "my-chrome-utilities:data-layer-history-entry:";

export interface LiveHistoryEntry {
  rawValue: unknown;
  timestamp: string;
}

export interface LiveHistoryPushCaptureOptions {
  tabId?: number;
  historyPath: string;
  onEntry: (entry: LiveHistoryEntry) => void;
}

export type StopLiveHistoryPushCapture = () => void;

interface LiveHistoryPushMessage {
  type: typeof runtimeMessageType;
  channelId: string;
  rawValue: unknown;
  timestamp: string;
}

function makeChannelId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function pageEventType(channelId: string): string {
  return `${pageEventPrefix}${channelId}`;
}

function isLiveHistoryPushMessage(
  message: unknown,
  channelId: string,
): message is LiveHistoryPushMessage {
  return (
    message !== null &&
    typeof message === "object" &&
    (message as LiveHistoryPushMessage).type === runtimeMessageType &&
    (message as LiveHistoryPushMessage).channelId === channelId &&
    typeof (message as LiveHistoryPushMessage).timestamp === "string"
  );
}

async function injectMessageBridge(
  tabId: number,
  channelId: string,
  eventType: string,
): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    args: [runtimeMessageType, channelId, eventType],
    func: (messageType: string, channel: string, eventName: string): void => {
      const marker = `__myChromeUtilitiesHistoryBridge_${channel}`;
      const bridgeWindow = globalThis as typeof globalThis &
        Record<string, true | undefined>;

      if (bridgeWindow[marker]) {
        return;
      }

      bridgeWindow[marker] = true;
      globalThis.addEventListener(eventName, (event: Event) => {
        const detail = (
          event as CustomEvent<{ rawValue: unknown; timestamp?: string }>
        ).detail;

        void chrome.runtime.sendMessage({
          type: messageType,
          channelId: channel,
          rawValue: detail?.rawValue,
          timestamp: detail?.timestamp ?? new Date().toISOString(),
        });
      });
    },
  });
}

async function injectHistoryArrayHook(
  tabId: number,
  historyPath: string,
  channelId: string,
  eventType: string,
): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    args: [historyPath, channelId, eventType],
    func: (path: string, channel: string, eventName: string): void => {
      type RegistryEntry = {
        array: unknown[];
        originalPush: Array<unknown>["push"];
        channels: Record<string, string>;
      };
      type RegistryWindow = typeof globalThis & {
        __myChromeUtilitiesHistoryPushObservers?: Record<
          string,
          RegistryEntry
        >;
      };

      const parts = path
        .split(".")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);

      let current: unknown = globalThis;
      for (const part of parts) {
        if (
          current === null ||
          typeof current !== "object" ||
          !(part in current)
        ) {
          return;
        }

        current = (current as Record<string, unknown>)[part];
      }

      if (!Array.isArray(current)) {
        return;
      }

      const historyArray = current;
      const registryWindow = globalThis as RegistryWindow;
      const registry =
        registryWindow.__myChromeUtilitiesHistoryPushObservers ?? {};
      registryWindow.__myChromeUtilitiesHistoryPushObservers = registry;
      let entry = registry[path];

      if (!entry || entry.array !== historyArray) {
        const newEntry: RegistryEntry = {
          array: historyArray,
          originalPush: historyArray.push,
          channels: {},
        };
        registry[path] = newEntry;
        entry = newEntry;

        historyArray.push = function (...items: unknown[]): number {
          const pushResult = newEntry.originalPush.apply(this, items);
          const eventNames = Object.values(newEntry.channels);

          for (const rawValue of items) {
            const timestamp = new Date().toISOString();

            for (const historyEventName of eventNames) {
              globalThis.dispatchEvent(
                new CustomEvent(historyEventName, {
                  detail: { rawValue, timestamp },
                }),
              );
            }
          }

          return pushResult;
        };
      }

      entry.channels[channel] = eventName;
    },
  });
}

function cleanupHistoryArrayHook(
  tabId: number,
  historyPath: string,
  channelId: string,
): void {
  void chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    args: [historyPath, channelId],
    func: (path: string, channel: string): void => {
      type RegistryEntry = {
        array: unknown[];
        originalPush: Array<unknown>["push"];
        channels: Record<string, string>;
      };
      type RegistryWindow = typeof globalThis & {
        __myChromeUtilitiesHistoryPushObservers?: Record<
          string,
          RegistryEntry
        >;
      };
      const registry =
        (globalThis as RegistryWindow)
          .__myChromeUtilitiesHistoryPushObservers;
      const entry = registry?.[path];

      if (!entry) {
        return;
      }

      delete entry.channels[channel];

      if (Object.keys(entry.channels).length === 0) {
        entry.array.push = entry.originalPush;
        delete registry?.[path];
      }
    },
  });
}

export async function startLiveHistoryPushCapture(
  options: LiveHistoryPushCaptureOptions,
): Promise<StopLiveHistoryPushCapture> {
  const tabId = options.tabId;

  if (tabId === undefined) {
    return () => {};
  }

  const channelId = makeChannelId();
  const eventType = pageEventType(channelId);
  const listener = (
    message: unknown,
    sender: chrome.runtime.MessageSender,
  ): void => {
    if (
      sender.tab?.id === tabId &&
      isLiveHistoryPushMessage(message, channelId)
    ) {
      options.onEntry({
        rawValue: message.rawValue,
        timestamp: message.timestamp,
      });
    }
  };

  chrome.runtime.onMessage.addListener(listener);

  try {
    await injectMessageBridge(tabId, channelId, eventType);
    await injectHistoryArrayHook(
      tabId,
      options.historyPath,
      channelId,
      eventType,
    );
  } catch (error) {
    chrome.runtime.onMessage.removeListener(listener);
    throw error;
  }

  return () => {
    chrome.runtime.onMessage.removeListener(listener);
    cleanupHistoryArrayHook(tabId, options.historyPath, channelId);
  };
}
