# my-chrome-utilities

A small Manifest V3 side panel extension.

## Portable Build

Create the unpacked extension build:

```sh
npm run build
```

Create a portable zip archive:

```sh
npm run package
```

To move the extension to another machine, copy `build/package/my-chrome-utilities.zip`.
You can also copy the `dist` directory directly for unpacked testing.

On the target machine, open Chrome extensions, enable developer mode, choose
load unpacked, and select the copied `dist` directory.

Smoke test:

1. Open the extension side panel.
2. Click Commands or press Ctrl+K inside the side panel.
3. Run `demo.say-hello`.
4. Confirm the visible command log records that `demo.say-hello` ran.
