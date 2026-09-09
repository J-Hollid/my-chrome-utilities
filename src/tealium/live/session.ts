import type { Inventory, TagRow } from '../detection/types.js';

export type SessionStatus = 'Ready' | 'Observing' | 'Paused' | 'Ended' |
  'Permission required' | 'Target closed';
export interface LiveState {
  sessionId: string;
  tabId: number;
  status: SessionStatus;
  accessReady: boolean;
  url: string;
  rows: TagRow[];
  inventory: Inventory;
  selected: string | null;
  search: string;
  codeFilter: string;
  profileFilter: string;
  completed: number;
  readMilliseconds: number;
  error: string;
}

export class ObservationSession {
  readonly state: LiveState;
  private generation = 0;
  private busy = false;
  private recoverTo: SessionStatus = 'Ready';

  constructor(tabId: number, private readonly read: () => Promise<Inventory>,
    private readonly publish: (state: LiveState) => void) {
    this.state = {tabId, sessionId: '', status: 'Ready', accessReady: false, url: '', rows: [],
      inventory: {frames: [], limits: []}, selected: null, search: '', codeFilter: '',
      profileFilter: '', completed: 0, readMilliseconds: 0, error: ''};
  }

  start(): void {
    if (!['Ready', 'Ended'].includes(this.state.status)) return;
    this.generation++;
    this.state.sessionId = crypto.randomUUID();
    this.state.rows = [];
    this.state.selected = null;
    this.state.inventory = {frames: [], limits: []};
    this.state.status = 'Observing';
    this.publish(this.state);
    void this.observe();
  }

  pause(): void {
    if (this.state.status !== 'Observing') return;
    this.generation++;
    this.state.status = 'Paused';
    this.publish(this.state);
  }

  resume(): void {
    if (this.state.status !== 'Paused') return;
    this.state.status = 'Observing';
    this.publish(this.state);
    void this.observe();
  }

  end(): void {
    this.generation++;
    this.state.status = 'Ended';
    this.recoverTo = 'Ended';
    this.publish(this.state);
  }

  closeTarget(): void {
    this.end();
    this.state.status = 'Target closed';
    this.state.rows = [];
    this.state.selected = null;
    this.publish(this.state);
  }

  reset(): void {
    this.generation++;
    if (!['Permission required', 'Target closed'].includes(this.state.status)) this.state.status = 'Ready';
    this.recoverTo = 'Ready';
    Object.assign(this.state, {sessionId: '', rows: [], inventory: {frames: [], limits: []},
      selected: null, search: '', codeFilter: '', profileFilter: '', completed: 0});
    this.publish(this.state);
  }

  invalidate(frameId?: number): void {
    this.generation++;
    this.state.rows = frameId === undefined ? [] : this.state.rows.filter(row => row.frameId !== frameId);
    this.state.inventory.frames = frameId === undefined ? [] :
      this.state.inventory.frames.filter(frame => frame.frameId !== frameId);
    if (!this.state.rows.some(row => row.key === this.state.selected)) this.state.selected = null;
    this.publish(this.state);
  }

  context(url: string): void {
    this.state.url = url;
    this.publish(this.state);
  }

  accessLost(): void {
    this.state.accessReady = false;
    if (this.state.status === 'Target closed' || this.state.status === 'Permission required') return;
    this.recoverTo = this.state.status;
    this.generation++;
    this.state.status = 'Permission required';
    this.publish(this.state);
  }

  restoreAccess(): void {
    if (this.state.status !== 'Permission required') return;
    this.state.status = this.recoverTo;
    this.state.error = '';
    this.publish(this.state);
    if (this.state.status === 'Observing') void this.observe();
  }

  select(key: string | null): void {
    if (key !== null && !this.state.rows.some(row => row.key === key)) return;
    this.state.selected = key;
    this.publish(this.state);
  }

  filters(search: string, codeFilter: string, profileFilter: string): void {
    Object.assign(this.state, {search, codeFilter, profileFilter});
    this.publish(this.state);
  }

  async observe(): Promise<void> {
    if (this.busy || this.state.status !== 'Observing') return;
    this.busy = true;
    const generation = this.generation, started = performance.now();
    try {
      const inventory = await this.read();
      if (generation !== this.generation || this.state.status !== 'Observing') return;
      const rows = inventory.frames.flatMap(frame => frame.observation.tags.map(tag => ({...tag,
        key: JSON.stringify([this.state.tabId, frame.documentId, frame.frameId, tag.profile, tag.uid]),
        tabId: this.state.tabId, frameId: frame.frameId, documentId: frame.documentId,
        pageUrl: frame.observation.url})));
      rows.sort((left, right) => left.frameId - right.frameId || left.profile.localeCompare(right.profile) ||
        left.uid.localeCompare(right.uid, undefined, {numeric: true}));
      this.state.rows = rows;
      this.state.inventory = inventory;
      this.state.url = inventory.frames.find(frame => frame.frameId === 0)?.observation.url ?? this.state.url;
      if (!rows.some(row => row.key === this.state.selected)) this.state.selected = null;
      this.state.completed++;
      this.state.readMilliseconds = performance.now() - started;
      this.state.error = '';
      this.publish(this.state);
    } catch (error) {
      if (generation !== this.generation || this.state.status !== 'Observing') return;
      this.state.error = error instanceof Error ? error.message : 'Page read failed';
      this.accessLost();
    } finally {
      this.busy = false;
    }
  }
}
