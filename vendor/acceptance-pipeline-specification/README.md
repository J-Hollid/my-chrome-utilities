# Acceptance Pipeline Specification tooling

This directory vendors the Babashka implementation of the APS Gherkin parser,
IR-DRY checker, and Gherkin mutator from:

https://github.com/unclebob/Acceptance-Pipeline-Specification

Source commit:

`accaa33d503340c56513ef387258f8da929ba902`

Vendored scope:

- `bb/src/aps/gherkin.clj`
- `bb/src/aps/dry.clj`
- `bb/src/aps/json.clj`
- `bb/src/aps/mutation.clj`
- `bb/src/aps/cli/gherkin_parser.clj`
- `bb/src/aps/cli/gherkin_ir_dry_checker.clj`
- `bb/src/aps/cli/gherkin_mutator.clj`

Local adjustment:

- `bb/src/aps/mutation.clj` emits status heartbeat lines during long mutation
  runs at the configured `--status-interval`.

The local `bb.edn` exposes the same task names used by the APS spec:

```sh
bb gherkin-parser <feature-file> <json-output>
bb gherkin-ir-dry-checker [--include-exact] <json-ir> <report-output>
bb gherkin-mutator --runner-worker <command> [options]
```
