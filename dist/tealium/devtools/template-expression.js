// Skip expression text without treating any of it as definition evidence.
// Nested templates and slash grammar remain unsupported and fail closed.
export function templateExpressionEnd(source, start) {
    const stack = ['{'];
    let quote = '', escaped = false;
    for (let i = start; i < source.length; i++) {
        const char = source[i];
        if (quote) {
            if (escaped)
                escaped = false;
            else if (char === '\\')
                escaped = true;
            else if (char === quote)
                quote = '';
            continue;
        }
        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }
        if (char === '`' || char === '/' || ['<!--', '-->', '#!'].some(marker => source.startsWith(marker, i)))
            return null;
        if (['{', '[', '('].includes(char))
            stack.push(char);
        if (['}', ']', ')'].includes(char)) {
            if (stack.pop() !== ({ '}': '{', ']': '[', ')': '(' }[char]))
                return null;
            if (!stack.length)
                return i + 1;
        }
    }
    return null;
}
//# sourceMappingURL=template-expression.js.map