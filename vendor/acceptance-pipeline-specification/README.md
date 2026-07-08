# Acceptance Pipeline Specification tooling

This directory vendors the Babashka implementation of the APS Gherkin parser and
IR-DRY checker from:

https://github.com/unclebob/Acceptance-Pipeline-Specification

Source commit:

`accaa33d503340c56513ef387258f8da929ba902`

Vendored scope:

- `bb/src/aps/gherkin.clj`
- `bb/src/aps/dry.clj`
- `bb/src/aps/json.clj`
- `bb/src/aps/cli/gherkin_parser.clj`
- `bb/src/aps/cli/gherkin_ir_dry_checker.clj`

The local `bb.edn` exposes the same task names used by the APS spec:

```sh
bb gherkin-parser <feature-file> <json-output>
bb gherkin-ir-dry-checker [--include-exact] <json-ir> <report-output>
```
