import { explainRule } from './rule-explanation.js';
const byId = (id) => document.getElementById(id);
const resultText = (value) => value ? 'True' : 'False';
const label = (rule) => rule.name || `Load rule ${rule.id}`;
function stepNode(step) {
    const node = document.createElement('div');
    node.className = 'rule-step';
    node.dataset.result = step.result === null ? 'unknown' : String(step.result);
    const title = document.createElement('strong');
    title.textContent = `${step.result === null ? 'Unavailable' : resultText(step.result)} · ${step.label}`;
    node.append(title);
    if (step.actual !== undefined) {
        const actual = document.createElement('p');
        actual.textContent = `Current value: ${step.actual}`;
        node.append(actual);
    }
    for (const child of step.children ?? [])
        node.append(stepNode(child));
    return node;
}
export function renderRules(state, select) {
    const list = byId('rule-rows'), pane = byId('rule-list'), scroll = pane.scrollTop;
    const existing = new Map(Array.from(list.children).map(child => [child.dataset.key, child]));
    const retained = new Set(state.rules.map(rule => rule.key));
    for (const [key, node] of existing)
        if (!retained.has(key ?? ''))
            node.remove();
    state.rules.forEach((rule, index) => {
        let button = existing.get(rule.key);
        if (!button) {
            button = document.createElement('button');
            button.className = 'rule';
            button.dataset.key = rule.key;
            button.append(document.createElement('span'), document.createElement('small'));
            button.onclick = () => select(rule.key);
        }
        button.firstElementChild.textContent = `${label(rule)} · ${rule.id}`;
        button.lastElementChild.textContent = `${resultText(rule.result)} · Frame ${rule.frameId} / ${rule.profile}`;
        button.classList.toggle('rule-true', rule.result);
        button.classList.toggle('rule-false', !rule.result);
        button.setAttribute('aria-pressed', String(rule.key === state.selectedRule));
        if (list.children[index] !== button)
            list.insertBefore(button, list.children[index] ?? null);
    });
    pane.scrollTop = scroll;
    byId('rule-count').textContent = `${state.rules.filter(rule => rule.result).length} true · ${state.rules.filter(rule => !rule.result).length} false · ${state.rules.length} load rules`;
    const rule = state.rules.find(item => item.key === state.selectedRule);
    byId('rule-inspector').hidden = !rule;
    byId('rule-working').classList.toggle('selected', Boolean(rule));
    if (!rule)
        return;
    byId('rule-name').textContent = `${label(rule)} · ${rule.id}`;
    byId('rule-result').textContent = `Runtime result: ${resultText(rule.result)}`;
    byId('rule-result').className = rule.result ? 'rule-true' : 'rule-false';
    byId('rule-context').textContent = `Frame ${rule.frameId} / ${rule.profile} · ${rule.pageUrl}`;
    const explanation = explainRule(rule), conditions = byId('rule-conditions');
    conditions.replaceChildren();
    if (!explanation)
        conditions.textContent = 'Published condition details are unavailable for this rule.';
    else {
        if (explanation.result !== null && explanation.result !== rule.result) {
            const note = document.createElement('p');
            note.textContent = 'Current condition values differ from the recorded runtime result.';
            conditions.append(note);
        }
        conditions.append(stepNode(explanation));
    }
}
export function renderTagRules(row, rules, select) {
    const list = byId('tag-rules');
    list.replaceChildren();
    if (!row)
        return;
    const profileRules = rules.filter(rule => rule.frameId === row.frameId &&
        rule.documentId === row.documentId && rule.profile === row.profile);
    const linked = row.loadRuleIds?.length ? profileRules.filter(rule => row.loadRuleIds.includes(rule.id)) : profileRules;
    byId('tag-rule-scope').textContent = row.loadRuleIds?.length ?
        'Rules assigned to this tag in profile metadata.' :
        'Rules evaluated for this profile. Tag assignment metadata is unavailable.';
    if (!linked.length) {
        list.textContent = 'No evaluated load rules are available for this tag.';
        return;
    }
    for (const rule of linked) {
        const button = document.createElement('button');
        button.className = `rule ${rule.result ? 'rule-true' : 'rule-false'}`;
        button.textContent = `${label(rule)} · ${rule.id} · ${resultText(rule.result)}`;
        button.onclick = () => select(rule.key);
        list.append(button);
    }
}
//# sourceMappingURL=rule-render.js.map