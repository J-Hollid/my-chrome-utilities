export function contextExportBrowserPorts(document) {
    return {
        copy: async (text) => { await document.defaultView.navigator.clipboard.writeText(text); },
        download: async (snapshot) => {
            const view = document.defaultView, url = view.URL.createObjectURL(new Blob([snapshot.text], { type: "application/schema+json" }));
            const link = document.createElement("a");
            link.href = url;
            link.download = snapshot.filename;
            link.hidden = true;
            document.body.append(link);
            try {
                const accepted = link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view }));
                if (!accepted)
                    throw new Error("The browser rejected the download request.");
            }
            finally {
                link.remove();
                view.setTimeout(() => view.URL.revokeObjectURL(url), 1000);
            }
        },
    };
}
//# sourceMappingURL=browser-ports.js.map