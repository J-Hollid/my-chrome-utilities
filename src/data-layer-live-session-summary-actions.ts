export type CopyPageUrlResult = "copied" | "unavailable" | "failed";

export async function copyLivePageUrl(
  pageUrl: string,
  writeText: ((value: string) => Promise<void>) | undefined,
): Promise<CopyPageUrlResult> {
  if (!pageUrl || !writeText) return "unavailable";
  try {
    await writeText(pageUrl);
    return "copied";
  } catch {
    return "failed";
  }
}
