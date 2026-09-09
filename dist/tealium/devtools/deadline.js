/** Bound a source API callback without letting a late result continue the action. */
export function sourceStep(work, signal) {
    return new Promise((resolve, reject) => {
        const aborted = () => reject(Error('Source inspection did not finish; try again'));
        if (signal.aborted)
            aborted();
        else
            signal.addEventListener('abort', aborted, { once: true });
        work.then(value => {
            signal.removeEventListener('abort', aborted);
            if (!signal.aborted)
                resolve(value);
        }, error => { signal.removeEventListener('abort', aborted); reject(error); });
    });
}
//# sourceMappingURL=deadline.js.map