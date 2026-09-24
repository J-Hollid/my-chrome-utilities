/** Read only explicit load rule references from a Tealium tag. */
export function tagRuleIds(tag) {
    const direct = tag.loadrule ?? tag.loadRule;
    const rules = tag.rules;
    if (direct === undefined && rules === undefined)
        return undefined;
    const ids = new Set();
    const visit = (value, directList = false) => {
        if (directList && (typeof value === 'string' || typeof value === 'number')) {
            for (const id of String(value).split(',').map(part => part.trim()))
                if (/^\d+$/.test(id))
                    ids.add(id);
            return;
        }
        if (Array.isArray(value)) {
            for (const item of value)
                visit(item, directList);
            return;
        }
        if (!value || typeof value !== 'object')
            return;
        const item = value;
        if (item.type === 'loadRule' && /^\d+$/.test(String(item.uid)))
            ids.add(String(item.uid));
        for (const key of ['apply', 'exclude', 'and', 'or'])
            if (key in item)
                visit(item[key]);
    };
    if (direct !== undefined)
        visit(direct, true);
    if (rules !== undefined)
        visit(rules, typeof rules === 'string' || typeof rules === 'number' ||
            (Array.isArray(rules) && rules.every(item => typeof item === 'string' || typeof item === 'number')));
    return [...ids];
}
//# sourceMappingURL=tag-rules.js.map