export function createDurablePersistenceReadiness(publish, settle) {
    let generation = 0;
    return {
        saving() { generation += 1; publish("saving"); },
        async saved() {
            const candidate = generation;
            try {
                await settle();
                if (candidate === generation)
                    publish("settled");
            }
            catch {
                if (candidate === generation)
                    publish("failed");
            }
        },
        failed() { generation += 1; publish("failed"); },
    };
}
//# sourceMappingURL=persistence-readiness.js.map