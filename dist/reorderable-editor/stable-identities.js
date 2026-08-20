import { reorderItems } from "./model.js";
export class StableIdentitySequence {
    prefix;
    #create;
    #values = [];
    constructor(prefix, create = () => `${prefix}:${crypto.randomUUID()}`) {
        this.prefix = prefix;
        this.#create = create;
    }
    reconcile(length) {
        const size = Math.max(0, length);
        if (this.#values.length > size)
            this.#values = this.#values.slice(0, size);
        while (this.#values.length < size)
            this.#values.push(this.#create());
        return this.values();
    }
    values() { return [...this.#values]; }
    replace(values) { this.#values = [...values]; }
    append() { const value = this.#create(); this.#values.push(value); return value; }
    remove(index) { if (index >= 0 && index < this.#values.length)
        this.#values.splice(index, 1); }
    move(fromIndex, toIndex) {
        const item = this.#values[fromIndex];
        if (item === undefined)
            return;
        this.#values = reorderItems(this.#values.map(id => ({ id })), item, toIndex).map(({ id }) => id);
    }
}
//# sourceMappingURL=stable-identities.js.map