# Data layer project event transport settings program R01

## Objective

Make observation and push routing part of the active project while keeping the
two paths independent. A project may observe a historical array such as
`queue.history` and send new events through `queue.push`. Switching projects
switches both defaults without rewriting global Library events.

## Project settings

Each project Draft owns:

- one Observation history path used only for Live capture; and
- one Default push path used for direct pushes and as the initial Destination
  of new or captured Library events.

Both settings survive reload, project switching, export, import, and durable
repository migration. A project switch changes the settings subscribed by every
project-bound Data Layer surface only after the active identity changes.

Without an active project, project transport settings are unavailable and no
project is selected implicitly. A new Library event has no inherited Destination
and must receive one before save or push.

## Library destination precedence

The global Library remains separate from project Drafts. A Library event stores
an explicit execution Destination. The active project's Default push path seeds
that field when the event is created or captured, but does not remain a live
reference.

An explicit Library Destination wins when that event is pushed. Changing a
project default or switching projects never rewrites an existing Library event.
Its readiness is re-evaluated against the selected page, and an unavailable
explicit destination blocks truthfully rather than falling back to a project
path.

## Path behavior

Observation requires the configured path to resolve to an array. Push requires
the configured path to resolve to a value with a callable `push` operation. A
missing, invalid, or incompatible path blocks only its affected operation with a
specific status. The other configured path is never substituted as a fallback.

## Delivery boundary

This cycle changes project transport settings, active-context subscription,
direct-push defaults, and Library Destination inheritance and precedence. It does
not redesign captured-event presentation, schema assignment, validation,
sequence replay, or automatic Flow execution.

The focused verification sequence is:

```sh
node scripts/run-focused-acceptance.mjs --pack project_event_transport
node scripts/package.mjs
```

The pack contains both project event transport contracts and focused production
evidence for three project path pairs, observation/push separation, new-event
defaulting, explicit Library precedence, project switching, no-project behavior,
portability, invalid-path blocking, and durable source isolation.
