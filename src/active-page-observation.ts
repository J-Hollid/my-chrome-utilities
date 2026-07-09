import type { HistoryArrayObserverAttachOptions } from "./data-layer-observer.js";

const pageAccessAvailable = "page access available";
const pageAccessUnavailable = "page access unavailable";

interface ActiveTabContext {
  tabId?: number;
  pageUrl: string;
}

export interface ActivePageObservationResult
  extends HistoryArrayObserverAttachOptions {
  tabId?: number;
}

type ActivePageReadResult =
  | { pageAccessStatus: typeof pageAccessAvailable; pageObject: unknown }
  | { pageAccessStatus: typeof pageAccessUnavailable };

async function activeTabContext(): Promise<ActiveTabContext> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const pageUrl = tab?.url ?? globalThis.location.href;

    if (tab?.id === undefined) {
      return { pageUrl };
    }

    return { tabId: tab.id, pageUrl };
  } catch {
    return { pageUrl: globalThis.location.href };
  }
}

async function activeTabPageObject(
  tabId: number,
  historyPath: string,
): Promise<ActivePageReadResult> {
  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      args: [historyPath],
      func: (path: string): unknown => {
        const parts = path
          .split(".")
          .map((part) => part.trim())
          .filter((part) => part.length > 0);

        if (parts.length === 0) {
          return {};
        }

        let current: unknown = globalThis;
        const root: Record<string, unknown> = {};
        let output = root;

        for (let index = 0; index < parts.length; index += 1) {
          const part = parts[index];

          if (
            !part ||
            current === null ||
            typeof current !== "object" ||
            !(part in current)
          ) {
            return {};
          }

          const value = (current as Record<string, unknown>)[part];

          if (index === parts.length - 1) {
            output[part] = Array.isArray(value) ? [...value] : value;
          } else {
            const child: Record<string, unknown> = {};
            output[part] = child;
            output = child;
            current = value;
          }
        }

        return root;
      },
    });

    if (injection === undefined) {
      return { pageAccessStatus: pageAccessUnavailable };
    }

    return {
      pageAccessStatus: pageAccessAvailable,
      pageObject: injection.result ?? {},
    };
  } catch {
    return { pageAccessStatus: pageAccessUnavailable };
  }
}

function observerAttachOptions(
  historyPath: string,
  pageUrl: string,
  readResult: ActivePageReadResult,
  tabId?: number,
): ActivePageObservationResult {
  const options: ActivePageObservationResult = {
    historyPath,
    pageUrl,
    pageAccessStatus: readResult.pageAccessStatus,
    ...(tabId === undefined ? {} : { tabId }),
  };

  return readResult.pageAccessStatus === pageAccessAvailable
    ? { ...options, pageObject: readResult.pageObject }
    : options;
}

export async function activePageObservation(
  historyPath: string,
): Promise<ActivePageObservationResult> {
  const activeTab = await activeTabContext();
  const readResult: ActivePageReadResult =
    activeTab.tabId === undefined
      ? { pageAccessStatus: pageAccessUnavailable }
      : await activeTabPageObject(activeTab.tabId, historyPath);

  return observerAttachOptions(
    historyPath,
    activeTab.pageUrl,
    readResult,
    activeTab.tabId,
  );
}
