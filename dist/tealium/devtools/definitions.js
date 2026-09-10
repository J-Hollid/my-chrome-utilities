import { closingSlashContext } from './lexical-context.js';
const regexPrefixes = new Set(['', '(', '[', '{', ',', ':', ';', '!', '~', '?', 'return', 'throw', 'case', 'void', 'typeof', 'delete', 'yield', 'await', 'else', 'do',
    '=', '=>', '&&', '||', '??', '&', '|', '^', '+', '-', '*', '**', '/', '%', '<', '>', '<=', '>=', '==', '!=', '===', '!==', '<<', '>>', '>>>',
    '+=', '-=', '*=', '**=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>=', '&&=', '||=', '??=']);
// A conservative lexical boundary scan. Unsupported or unbalanced definitions
// cannot supply an exact association; the resolver can still identify a file.
function scan(source) {
    const tokens = [], pairs = new Map(), stack = [];
    const opens = new Map();
    let i = 0, scope = -1;
    while (i < source.length) {
        const start = i, char = source[i];
        if (/\s/.test(char)) {
            i++;
            continue;
        }
        if (source.startsWith('//', i)) {
            i = source.indexOf('\n', i);
            if (i < 0)
                break;
            continue;
        }
        if (source.startsWith('/*', i)) {
            const end = source.indexOf('*/', i + 2);
            if (end < 0)
                return { tokens: [], pairs };
            i = end + 2;
            continue;
        }
        const previous = tokens.at(-1)?.text ?? '';
        const context = char === '/' && [')', '}'].includes(previous) ? closingSlashContext(tokens, opens) : null;
        if (context === 'unknown')
            return { tokens: [], pairs: new Map() };
        const regex = char === '/' && (context === 'regex' || regexPrefixes.has(previous));
        if (['"', "'", '`'].includes(char) || regex) {
            i++;
            let escaped = false, characterClass = false, closed = false;
            while (i < source.length) {
                const next = source[i++];
                if (escaped) {
                    escaped = false;
                    continue;
                }
                if (next === '\\') {
                    escaped = true;
                    continue;
                }
                if (regex && next === '[')
                    characterClass = true;
                if (regex && next === ']')
                    characterClass = false;
                if (next === char && !characterClass) {
                    closed = true;
                    break;
                }
            }
            if (!closed)
                return { tokens: [], pairs: new Map() };
            if (regex)
                while (/[a-z]/i.test(source[i] ?? ' '))
                    i++;
        }
        else {
            const word = source.slice(i).match(/^(?:[\w$]+|>>>=|\*\*=|&&=|\|\|=|\?\?=|===|!==|>>>|<<=|>>=|=>|&&|\|\||\?\?|\*\*|<<|>>|<=|>=|==|!=|[+\-*/%&|^]=|\+\+|--|\?\.)/);
            i += word?.[0].length ?? 1;
        }
        const index = tokens.length, text = source.slice(start, i);
        tokens.push({ text, start, end: i, scope });
        if (['{', '[', '('].includes(text)) {
            stack.push(index);
            if (text === '{')
                scope = index;
        }
        if (['}', ']', ')'].includes(text)) {
            const open = stack.pop();
            if (open === undefined || tokens[open].text !== ({ '}': '{', ']': '[', ')': '(' }[text]))
                return { tokens: [], pairs: new Map() };
            pairs.set(open, index);
            opens.set(index, open);
            if (text === '}')
                scope = tokens[open].scope;
        }
    }
    return stack.length ? { tokens: [], pairs: new Map() } : { tokens, pairs };
}
export function tagDefinitions(content, send, extensions) {
    const { tokens, pairs } = scan(content);
    const sends = [], arrays = [];
    for (let i = 0; i < tokens.length - 4; i++) {
        const owner = tokens[i], field = tokens[i + 2], value = tokens[i + 4];
        if (!/^[a-zA-Z_$][\w$]*$/.test(owner.text) || tokens[i + 1].text !== '.' || tokens[i + 3].text !== '=')
            continue;
        if (field.text === 'send' && send && content.startsWith(send, value.start))
            sends.push({ offset: value.start, scope: owner.scope, owner: owner.text });
        if (field.text !== 'extend' || value.text !== '[' || !extensions)
            continue;
        const end = pairs.get(i + 4);
        if (end === undefined)
            continue;
        const parts = [];
        let first = i + 5, j = first;
        while (j < end) {
            if (tokens[j].text === ',') {
                parts.push(content.slice(tokens[first].start, tokens[j].start).trim());
                first = j + 1;
            }
            const close = pairs.get(j);
            j = close === undefined ? j + 1 : close + 1;
        }
        if (first < end)
            parts.push(content.slice(tokens[first].start, tokens[end].start).trim());
        if (parts.length === extensions.length && parts.every((part, index) => part === extensions[index]))
            arrays.push({ offset: owner.start, scope: owner.scope, owner: owner.text });
    }
    return { sends, arrays, locations: tokens.filter(token => send && content.startsWith(send, token.start)).map(token => token.start) };
}
//# sourceMappingURL=definitions.js.map