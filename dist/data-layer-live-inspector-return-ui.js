export function restoreInspectorReturnUi(elements, snapshot) {
    if (elements.eventList)
        elements.eventList.scrollTop = snapshot.scrollTop;
    Array.from(elements.eventFeed?.querySelectorAll("button") ?? [])
        .find((button) => button.dataset.eventId === snapshot.eventId)
        ?.focus({ preventScroll: true });
}
//# sourceMappingURL=data-layer-live-inspector-return-ui.js.map