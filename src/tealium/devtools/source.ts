import type { PageTag } from '../detection/types.js';

export interface LoadedSource { url: string; content: string; }
export interface SourceResolution {
  status: 'Resolved' | 'Ambiguous' | 'Unresolved';
  detail: string;
  url?: string;
  line?: number;
  column?: number;
}

export function resolveTagSource(tag: Pick<PageTag, 'senderSource' | 'requestUrls'>,
  resources: LoadedSource[]): SourceResolution {
  const available = resources.filter(resource => /^https?:\/\//.test(resource.url) && resource.content);
  const conflictingContent = (url: string): boolean => new Set(available.filter(resource => resource.url === url)
    .map(resource => resource.content)).size > 1;
  const matches: {url: string; line: number; column: number}[] = [];
  const distinct = available.filter((resource, index) => available.findIndex(other =>
    other.url === resource.url && other.content === resource.content) === index);
  for (const resource of distinct) {
    if (!tag.senderSource) continue;
    const offset = resource.content.indexOf(tag.senderSource);
    if (offset < 0) continue;
    if (resource.content.indexOf(tag.senderSource, offset + 1) >= 0) {
      return {status: 'Ambiguous', detail: 'Registered code appears more than once'};
    }
    const before = resource.content.slice(0, offset);
    matches.push({url: resource.url, line: before.split('\n').length - 1,
      column: offset - before.lastIndexOf('\n') - 1});
  }
  if (matches.length > 1) return {status: 'Ambiguous', detail: 'Multiple possible containing files'};
  const unique = matches[0];
  if (unique) return conflictingContent(unique.url)
    ? {status: 'Ambiguous', detail: 'Different loaded frame resources share this URL'}
    : {...unique, status: 'Resolved', detail: 'Unique registered tag code'};
  const known = [...new Set(available.filter(resource => tag.requestUrls.includes(resource.url))
    .map(resource => resource.url))];
  if (known.length > 1) return {status: 'Ambiguous', detail: 'Multiple possible containing files'};
  if (known[0] && conflictingContent(known[0])) return {status: 'Ambiguous', detail: 'Different loaded frame resources share this URL'};
  if (known[0]) return {url: known[0], line: 0, column: 0, status: 'Resolved',
    detail: 'Known containing file; unique tag location unavailable'};
  return {status: 'Unresolved', detail: 'No verified loaded source is available'};
}
