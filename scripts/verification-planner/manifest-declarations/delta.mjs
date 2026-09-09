import {isDeepStrictEqual} from 'node:util';

// Native JSON parsing checks grammar; this scan additionally rejects duplicate
// decoded property names, including keys hidden by Unicode escapes.
export function parseUnambiguousJson(text) {
  const value=JSON.parse(text), stack=[];
  for(const token of text.matchAll(/"(?:\\.|[^"\\])*"|[{}\[\]]/gu)) {
    const word=token[0];
    if(word==='{'||word==='[')stack.push(word==='{'?new Set():null);
    else if(word==='}'||word===']')stack.pop();
    else if(/^\s*:/u.test(text.slice(token.index+word.length))) {
      const keys=stack.at(-1),key=JSON.parse(word);
      if(keys.has(key))throw new Error(`Ambiguous duplicate JSON key: ${key}`);
      keys.add(key);
    }
  }
  return value;
}

export function localHtmlResource(value) {
  return typeof value==='string'&&/^[a-zA-Z0-9_-]+(?:[./][a-zA-Z0-9_-]+)*\.html$/u.test(value)
    &&value.split('/').every(part=>part!=='.'&&part!=='..');
}

export function manifestDeclarationDelta(beforeText,afterText) {
  try {
    const before=parseUnambiguousJson(beforeText),after=parseUnambiguousJson(afterText);
    if(!before||!after||Array.isArray(before)||Array.isArray(after)||
      typeof before!=='object'||typeof after!=='object')return null;
    const resource=value=>Object.hasOwn(value,'devtools_page')?value.devtools_page:null;
    const previous=resource(before),next=resource(after);
    if(previous===next)return null;
    for(const value of [before,after]) {
      if(Object.hasOwn(value,'devtools_page')&&!localHtmlResource(value.devtools_page))return null;
      delete value.devtools_page;
    }
    return isDeepStrictEqual(before,after)?{before:previous,after:next}:null;
  } catch {return null;}
}
