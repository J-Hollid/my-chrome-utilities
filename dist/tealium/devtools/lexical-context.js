const controls = new Set(['if', 'while', 'for', 'with', 'switch', 'catch']);
// Delimiter pairs distinguish control conditions from calls and grouping.
// Unproved brace contexts cannot establish source locations.
export function closingSlashContext(tokens, opens) {
    const text = (index) => tokens[index]?.text ?? '';
    const control = (index) => !['.', '?.'].includes(text(index - 1)) &&
        (controls.has(text(index)) || (text(index) === 'await' && text(index - 1) === 'for'));
    const last = tokens.length - 1, open = opens.get(last);
    if (open === undefined)
        return 'unknown';
    if (text(last) === ')')
        return control(open - 1) ? 'regex' : 'division';
    const before = text(open - 1);
    const declaration = (start) => {
        if (text(start - 1) === 'async')
            start--;
        const prefix = text(start - 1);
        if (['', ';', '{', '}', 'export', 'default'].includes(prefix))
            return 'regex';
        if (['=', '(', '[', ',', ':', 'return', '=>'].includes(prefix))
            return 'division';
        return 'unknown';
    };
    if (before === ')') {
        const parameters = opens.get(open - 1);
        if (parameters === undefined)
            return 'unknown';
        if (control(parameters - 1))
            return 'regex';
        let start = parameters - 1;
        if (text(start) !== 'function' && /^[\w$]+$/.test(text(start)))
            start--;
        if (text(start) === '*')
            start--;
        return text(start) === 'function' ? declaration(start) : 'unknown';
    }
    if (before === 'class')
        return declaration(open - 1);
    if (text(open - 2) === 'class')
        return declaration(open - 2);
    if (['', ';', '{', '}', 'else', 'do', 'try', 'finally'].includes(before))
        return 'regex';
    if (['=', '(', '[', ',', 'return', '=>'].includes(before))
        return 'division';
    return 'unknown';
}
//# sourceMappingURL=lexical-context.js.map