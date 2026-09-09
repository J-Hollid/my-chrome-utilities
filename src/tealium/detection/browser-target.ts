import { readTealiumPage } from './page-reader.js';
import type { FrameObservation, Inventory, TagRow } from './types.js';

export async function readTarget(tabId: number): Promise<Inventory> {
  const results = await chrome.scripting.executeScript({target: {tabId, allFrames: true},
    world: 'MAIN', func: readTealiumPage});
  const current = await chrome.scripting.executeScript({target: {tabId, allFrames: true}, func: () => location.href});
  const frames: FrameObservation[] = [];
  const limits: Inventory['limits'] = [];
  for (const result of results) {
    if (!current.some(frame => frame.frameId === result.frameId && frame.documentId === result.documentId)) continue;
    if (!result.documentId || !result.result) {
      limits.push({frameId: result.frameId, url: '', reason: 'Frame could not be inspected'});
      continue;
    }
    frames.push({frameId: result.frameId, documentId: result.documentId, observation: result.result});
    for (const reason of result.result.limits) limits.push({frameId: result.frameId,
      url: result.result.url, reason});
  }
  if (!current.some(frame => frame.frameId === 0)) throw Error('Selected website access is unavailable');
  const observedUrls = frames.filter(frame => frame.frameId !== 0).map(frame => frame.observation.url);
  for (const parent of frames) for (const child of parent.observation.childFrames) {
    const index = observedUrls.indexOf(child.url);
    if (index >= 0) { observedUrls.splice(index, 1); continue; }
    limits.push({frameId: -(parent.frameId * 10000 + child.index + 1), url: child.url,
      reason: `Child frame ${child.index + 1} of frame ${parent.frameId} could not be read: ${child.url}`});
  }
  return {frames, limits};
}

export async function validateCurrentTag(row: TagRow): Promise<void> {
  const results = await chrome.scripting.executeScript({
    target: {tabId: row.tabId, documentIds: [row.documentId]}, world: 'MAIN', func: readTealiumPage});
  const current = results.find(result => result.frameId === row.frameId && result.documentId === row.documentId);
  if (!current?.result?.tags.some(tag => tag.profile === row.profile && tag.uid === row.uid &&
      tag.senderSource === row.senderSource)) throw Error('The selected tag or document is no longer current');
}
