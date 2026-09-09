/** Bound a source API callback without letting a late result continue the action. */
export function sourceStep<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const aborted = (): void => reject(Error('Source inspection did not finish; try again'));
    if (signal.aborted) aborted();
    else signal.addEventListener('abort', aborted, {once: true});
    work.then(value => {
      signal.removeEventListener('abort', aborted);
      if (!signal.aborted) resolve(value);
    }, error => { signal.removeEventListener('abort', aborted); reject(error); });
  });
}
