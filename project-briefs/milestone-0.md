# my-chrome-utilities — Milestone 0

Build the first milestone of `my-chrome-utilities`, a personal Chrome utility shell.

This is not a data layer testing tool yet. It is a small, keyboard-first Chrome extension shell that future utilities can plug into.

## Goal

Create a loadable Chrome extension with:

- Manifest V3
- Side panel
- Command registry
- Command palette
- One demo command
- Build output that can be copied to another machine and loaded unpacked in Chrome

## Development environment

Development happens in WSL using CLI tools and Codex.

Chrome will run outside WSL, potentially on a separate machine. Therefore the project must provide a portable build artifact, preferably a `dist/` folder and a zip file, that can be copied to another machine and loaded as an unpacked Chrome extension.

## Product name

my-chrome-utilities

## UX direction

The extension should feel like a personal utility shell inspired by Emacs:

- commands first
- keyboard-first operation
- command palette
- minimal mouse dependency
- small utilities can be added later
- avoid overbuilding a plugin framework now

## Technical direction

Use:

- Manifest V3
- TypeScript
- Vite or similarly simple build tooling
- Chrome side panel
- Minimal permissions
- No backend
- No data layer testing module yet
- No content scripts yet unless absolutely required for the demo

## Expected extension behavior

After build and loading the unpacked extension in Chrome:

1. The extension appears as "my-chrome-utilities".
2. Clicking the extension action opens the side panel.
3. The side panel displays a simple app shell.
4. A command palette can be opened inside the side panel.
5. The command palette lists at least one demo command.
6. Running the demo command shows visible feedback, such as appending a log entry or showing a toast/message.
7. The command registry is implemented separately from the UI so future utilities can register commands.

## Suggested demo command

Command ID:
demo.say-hello

Command title:
Demo: Say hello

Behavior:
Adds a visible message to the panel command log:
"Hello from my-chrome-utilities"

## Non-goals

- No data layer capture
- No event replay
- No schema validation
- No storage system beyond what is needed for the demo
- No user-editable keybinding UI
- No dynamic plugin system
- No publish-to-Chrome-Web-Store flow
- No remote sync
- No backend
- No complicated styling

## Deliverables

- Source code
- Build scripts
- `dist/` output
- Zip packaging command
- README with:
  - prerequisites
  - install dependencies
  - build
  - create zip
  - copy to another machine
  - load unpacked in Chrome
  - basic smoke test