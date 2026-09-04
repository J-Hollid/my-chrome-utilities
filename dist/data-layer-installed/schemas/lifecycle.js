/** Owns one installed Schema controller listener generation. */
export function createSchemaLifecycle() {
    let mounted = false;
    let generation = 0;
    let disposers = [];
    return {
        mount() {
            if (mounted)
                return false;
            mounted = true;
            generation += 1;
            return true;
        },
        listen(target, type, listener, options) {
            if (!mounted || !target)
                return;
            const eventListener = listener;
            target.addEventListener(type, eventListener, options);
            disposers.push(() => target.removeEventListener(type, eventListener, options));
        },
        own(dispose) {
            if (!mounted) {
                dispose();
                return;
            }
            disposers.push(dispose);
        },
        dispose() {
            if (!mounted)
                return false;
            mounted = false;
            generation += 1;
            for (const dispose of disposers.splice(0).reverse())
                dispose();
            return true;
        },
        isMounted: () => mounted,
        generation: () => generation,
        isCurrent: (candidate) => mounted && candidate === generation,
    };
}
//# sourceMappingURL=lifecycle.js.map