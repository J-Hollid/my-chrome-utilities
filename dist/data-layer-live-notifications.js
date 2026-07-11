export function createLiveNotificationController(render, schedule, durationMs = 4000) {
    let revision = 0;
    return {
        announce(message) {
            revision += 1;
            const currentRevision = revision;
            render(message);
            schedule(() => {
                if (revision === currentRevision)
                    render("");
            }, durationMs);
        },
    };
}
//# sourceMappingURL=data-layer-live-notifications.js.map