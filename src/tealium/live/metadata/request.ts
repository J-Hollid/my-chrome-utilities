export const METADATA_ORIGIN = 'https://my.tealiumiq.com/*';
export const METADATA_ENDPOINT = 'https://my.tealiumiq.com/urest/legacy/tagcompanion/getProfile';
export const METADATA_LIMIT = 1024 * 1024;
export const METADATA_TIMEOUT = 8000;
import type {RuleCondition} from '../../detection/types.js';
export interface RuleMetadata {name: string; conditions?: RuleCondition[][];}
export interface ProfileMetadata { title: string | null; names: Record<string, string>;
  rules?: Record<string, RuleMetadata>; tagRules?: Record<string, string[]>; }
export const validUtid = (value: unknown): value is string => typeof value === 'string' &&
  /^[a-zA-Z0-9_-]{1,80}\/[a-zA-Z0-9_-]{1,80}\/\d{12}$/.test(value);
export function parseMetadata(text: string): ProfileMetadata {
  const match = text.trim().match(/^window\.__tealium_wc_getProfile\(([\s\S]*)\);?$/);
  if (!match) throw Error('Unsupported metadata response');
  const value = JSON.parse(match[1]!);
  if (!value || typeof value !== 'object' || !value.manage || typeof value.manage !== 'object' || Array.isArray(value.manage)) {
    throw Error('Exact profile metadata is unavailable');
  }
  if (value.title != null && (typeof value.title !== 'string' || value.title.length > 2000)) throw Error('Invalid version title');
  const names: Record<string, string> = Object.create(null);
  const tagRules: Record<string, string[]> = Object.create(null);
  const collectIds = (input: unknown): string[] => {
    if (typeof input === 'string') return input.split(',').map(part => part.trim()).filter(part => /^\d+$/.test(part));
    if (Array.isArray(input)) return [...new Set(input.flatMap(collectIds))];
    if (input && typeof input === 'object') {
      const item = input as Record<string, unknown>;
      if (item.type === 'loadRule' && /^\d+$/.test(String(item.uid))) return [String(item.uid)];
      return [...new Set(Object.values(item).flatMap(collectIds))];
    }
    return [];
  };
  for (const [uid, tag] of Object.entries(value.manage)) {
    if (!/^\d+$/.test(uid)) continue;
    const title = (tag as {title?: unknown} | null)?.title;
    if (title != null && (typeof title !== 'string' || title.length > 1000)) throw Error('Invalid tag title');
    if (typeof title === 'string' && title.trim()) names[uid] = title;
    const entry = tag as Record<string, unknown> | null;
    const assigned = collectIds(entry?.loadrule ?? entry?.loadRule ?? entry?.rules);
    if (assigned.length) tagRules[uid] = assigned;
  }
  const rules: Record<string, RuleMetadata> = Object.create(null);
  const rawRules = value.loadrules ?? value.loadRules;
  if (rawRules && typeof rawRules === 'object' && !Array.isArray(rawRules)) {
    for (const [id, raw] of Object.entries(rawRules)) {
      if (!/^\d+$/.test(id) || !raw || typeof raw !== 'object') continue;
      const item = raw as Record<string, unknown>;
      const name = item.title ?? item.name;
      if (typeof name !== 'string' || !name.trim() || name.length > 1000) continue;
      let conditions: RuleCondition[][] | undefined;
      if (Array.isArray(item.conditions)) {
        const groups = item.conditions.every(Array.isArray) ? item.conditions : [item.conditions];
        if (groups.every((group: unknown) => Array.isArray(group) && group.every((part: unknown) => {
          if (!part || typeof part !== 'object') return false;
          const condition = part as Record<string, unknown>;
          return typeof condition.variable === 'string' && typeof condition.operator === 'string' &&
            (condition.value === null || ['string','number','boolean','undefined'].includes(typeof condition.value));
        }))) conditions = groups as RuleCondition[][];
      }
      rules[id] = {name, ...(conditions ? {conditions} : {})};
    }
  }
  const title = value.title?.trim() ? value.title : null;
  if (!title && !Object.keys(names).length && !Object.keys(rules).length) throw Error('Exact profile metadata is unavailable');
  return {title, names, rules, tagRules};
}
export async function fetchMetadata(utid: string, signal: AbortSignal,
  fetcher: typeof fetch = fetch, timeout = METADATA_TIMEOUT): Promise<ProfileMetadata> {
  if (!validUtid(utid)) throw Error('Runtime profile identity is unavailable');
  const controller = new AbortController();
  const abort = (): void => controller.abort();
  signal.addEventListener('abort', abort, {once: true});
  if (signal.aborted) abort();
  const timer = setTimeout(abort, timeout);
  const stopped = new Promise<never>((_, reject) => {
    const fail = (): void => reject(Error('Metadata request ended or timed out'));
    controller.signal.addEventListener('abort', fail, {once: true});
    if (controller.signal.aborted) fail();
  });
  const read = async (): Promise<ProfileMetadata> => {
    const response = await fetcher(`${METADATA_ENDPOINT}?utid=${encodeURIComponent(utid)}`, {
      credentials: 'omit', referrerPolicy: 'no-referrer', referrer: '', redirect: 'error', cache: 'no-store', signal: controller.signal,
    });
    if (!response.ok || response.redirected || (response.url && new URL(response.url).origin !== 'https://my.tealiumiq.com')) throw Error('Metadata request failed');
    if (Number(response.headers.get('content-length')) > METADATA_LIMIT) throw Error('Metadata response is too large');
    const reader = response.body?.getReader();
    if (!reader) throw Error('Metadata response is empty');
    let size = 0, text = ''; const decoder = new TextDecoder('utf-8', {fatal: true});
    try {
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > METADATA_LIMIT) throw Error('Metadata response is too large');
        text += decoder.decode(part.value, {stream: true});
      }
      return parseMetadata(text + decoder.decode());
    } finally { await reader.cancel().catch(() => {}); }
  };
  try { return await Promise.race([read(), stopped]); }
  finally { clearTimeout(timer); signal.removeEventListener('abort', abort); controller.abort(); }
}
