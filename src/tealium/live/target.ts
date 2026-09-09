export function pageOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? `${parsed.origin}/*` : null;
  } catch { return null; }
}

export async function probeTarget(tabId: number): Promise<string> {
  const [result] = await chrome.scripting.executeScript({target: {tabId},
    func: () => location.href});
  if (!result?.documentId || typeof result.result !== 'string') throw Error('Page access is unavailable');
  return result.result;
}

