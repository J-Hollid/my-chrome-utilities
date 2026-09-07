/** Listen before reading status so an early completion cannot be lost. */
export async function completeContextDownload(api, options) {
    const id = await api.download(options);
    await new Promise((resolve, reject) => {
        const finish = (error) => {
            api.onChanged.removeListener(changed);
            if (error)
                reject(error);
            else
                resolve();
        };
        const terminal = (state, error) => {
            if (state === "complete")
                finish();
            if (state === "interrupted")
                finish(new Error(`The browser rejected or interrupted the download: ${error ?? "unknown reason"}.`));
        };
        const changed = (delta) => {
            if (delta.id === id)
                terminal(delta.state?.current, delta.error?.current);
        };
        api.onChanged.addListener(changed);
        void api.search({ id }).then(([item]) => {
            if (!item)
                finish(new Error("The browser download is no longer available."));
            else
                terminal(item.state, item.error);
        }, error => finish(error instanceof Error ? error : new Error(String(error))));
    });
}
export function contextExportBrowserPorts(document) {
    return {
        copy: async (text) => { await document.defaultView.navigator.clipboard.writeText(text); },
        download: async (snapshot) => {
            const view = document.defaultView, url = view.URL.createObjectURL(new Blob([snapshot.text], { type: "application/schema+json" }));
            try {
                await completeContextDownload(chrome.downloads, { url, filename: snapshot.filename, saveAs: false });
            }
            finally {
                view.URL.revokeObjectURL(url);
            }
        },
    };
}
//# sourceMappingURL=browser-ports.js.map