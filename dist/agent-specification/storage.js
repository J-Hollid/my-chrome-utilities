export class AgentSessionStore {
    opening;
    database() {
        return this.opening ??= new Promise((resolve, reject) => {
            const request = indexedDB.open("twatility-agent-sessions", 1);
            request.onupgradeneeded = () => request.result.createObjectStore("sessions", { keyPath: "projectId" });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async load(projectId) {
        const db = await this.database();
        return new Promise((resolve, reject) => { const request = db.transaction("sessions").objectStore("sessions").get(projectId); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    }
    async save(value) {
        const db = await this.database();
        await new Promise((resolve, reject) => { const transaction = db.transaction("sessions", "readwrite"); transaction.objectStore("sessions").put(structuredClone(value)); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error ?? new Error("The agent review could not be saved.")); });
    }
}
//# sourceMappingURL=storage.js.map