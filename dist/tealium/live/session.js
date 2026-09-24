export class ObservationSession {
    read;
    publish;
    state;
    generation = 0;
    busy = false;
    recoverTo = 'Ready';
    constructor(tabId, read, publish) {
        this.read = read;
        this.publish = publish;
        this.state = { tabId, sessionId: '', status: 'Ready', accessReady: false, url: '', rows: [], rules: [],
            inventory: { frames: [], limits: [] }, selected: null, selectedRule: null, view: 'tags', search: '', codeFilter: '',
            profileFilter: '', completed: 0, readMilliseconds: 0, error: '' };
    }
    start() {
        if (!['Ready', 'Ended'].includes(this.state.status))
            return;
        this.generation++;
        this.state.sessionId = crypto.randomUUID();
        this.state.rows = [];
        this.state.rules = [];
        this.state.selected = null;
        this.state.selectedRule = null;
        this.state.inventory = { frames: [], limits: [] };
        this.state.status = 'Observing';
        this.publish(this.state);
        void this.observe();
    }
    pause() {
        if (this.state.status !== 'Observing')
            return;
        this.generation++;
        this.state.status = 'Paused';
        this.publish(this.state);
    }
    resume() {
        if (this.state.status !== 'Paused')
            return;
        this.state.status = 'Observing';
        this.publish(this.state);
        void this.observe();
    }
    end() {
        this.generation++;
        this.state.status = 'Ended';
        this.recoverTo = 'Ended';
        this.publish(this.state);
    }
    closeTarget() {
        this.end();
        this.state.status = 'Target closed';
        this.state.rows = [];
        this.state.rules = [];
        this.state.selected = null;
        this.state.selectedRule = null;
        this.publish(this.state);
    }
    reset() {
        this.generation++;
        if (!['Permission required', 'Target closed'].includes(this.state.status))
            this.state.status = 'Ready';
        this.recoverTo = 'Ready';
        Object.assign(this.state, { sessionId: '', rows: [], rules: [], inventory: { frames: [], limits: [] },
            selected: null, selectedRule: null, view: 'tags', search: '', codeFilter: '', profileFilter: '', completed: 0 });
        this.publish(this.state);
    }
    invalidate(frameId) {
        this.generation++;
        this.state.rows = frameId === undefined ? [] : this.state.rows.filter(row => row.frameId !== frameId);
        this.state.rules = frameId === undefined ? [] : this.state.rules.filter(rule => rule.frameId !== frameId);
        this.state.inventory.frames = frameId === undefined ? [] :
            this.state.inventory.frames.filter(frame => frame.frameId !== frameId);
        if (!this.state.rows.some(row => row.key === this.state.selected))
            this.state.selected = null;
        if (!this.state.rules.some(rule => rule.key === this.state.selectedRule))
            this.state.selectedRule = null;
        this.publish(this.state);
    }
    context(url) {
        this.state.url = url;
        this.publish(this.state);
    }
    accessLost() {
        this.state.accessReady = false;
        if (this.state.status === 'Target closed' || this.state.status === 'Permission required')
            return;
        this.recoverTo = this.state.status;
        this.generation++;
        this.state.status = 'Permission required';
        this.publish(this.state);
    }
    restoreAccess() {
        if (this.state.status !== 'Permission required')
            return;
        this.state.status = this.recoverTo;
        this.state.error = '';
        this.publish(this.state);
        if (this.state.status === 'Observing')
            void this.observe();
    }
    select(key) {
        if (key !== null && !this.state.rows.some(row => row.key === key))
            return;
        this.state.selected = key;
        this.state.view = 'tags';
        this.publish(this.state);
    }
    selectRule(key) {
        if (key !== null && !this.state.rules.some(rule => rule.key === key))
            return;
        this.state.selectedRule = key;
        this.state.view = 'rules';
        this.publish(this.state);
    }
    setView(view) {
        this.state.view = view;
        this.publish(this.state);
    }
    filters(search, codeFilter, profileFilter) {
        Object.assign(this.state, { search, codeFilter, profileFilter });
        this.publish(this.state);
    }
    async observe() {
        if (this.busy || this.state.status !== 'Observing')
            return;
        this.busy = true;
        const generation = this.generation, started = performance.now();
        try {
            const inventory = await this.read();
            if (generation !== this.generation || this.state.status !== 'Observing')
                return;
            const rows = inventory.frames.flatMap(frame => frame.observation.tags.map(tag => ({ ...tag,
                key: JSON.stringify([this.state.tabId, frame.documentId, frame.frameId, tag.profile, tag.uid]),
                tabId: this.state.tabId, frameId: frame.frameId, documentId: frame.documentId,
                pageUrl: frame.observation.url })));
            rows.sort((left, right) => left.frameId - right.frameId || left.profile.localeCompare(right.profile) ||
                left.uid.localeCompare(right.uid, undefined, { numeric: true }));
            this.state.rows = rows;
            this.state.rules = inventory.frames.flatMap(frame => (frame.observation.rules ?? []).map(rule => ({ ...rule,
                key: JSON.stringify([this.state.tabId, frame.documentId, frame.frameId, rule.profile, rule.id]),
                tabId: this.state.tabId, frameId: frame.frameId, documentId: frame.documentId,
                pageUrl: frame.observation.url }))).sort((left, right) => left.frameId - right.frameId ||
                left.profile.localeCompare(right.profile) || left.id.localeCompare(right.id, undefined, { numeric: true }));
            this.state.inventory = inventory;
            this.state.url = inventory.frames.find(frame => frame.frameId === 0)?.observation.url ?? this.state.url;
            if (!rows.some(row => row.key === this.state.selected))
                this.state.selected = null;
            if (!this.state.rules.some(rule => rule.key === this.state.selectedRule))
                this.state.selectedRule = null;
            this.state.completed++;
            this.state.readMilliseconds = performance.now() - started;
            this.state.error = '';
            this.publish(this.state);
        }
        catch (error) {
            if (generation !== this.generation || this.state.status !== 'Observing')
                return;
            this.state.error = error instanceof Error ? error.message : 'Page read failed';
            this.accessLost();
        }
        finally {
            this.busy = false;
        }
    }
}
//# sourceMappingURL=session.js.map