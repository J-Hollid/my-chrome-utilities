# Native permission test: approved Xvfb provisioning

Status: explicitly approved by the user on 2026-09-21 after the specifier asked
to add pinned Xvfb support and provision it for isolated native-permission tests.
This is the named installation request required by the optional-tool rules.

Continue stable task
`verification-slice-portability-durable-state-declaration` under active handoff
`20260921T173303Z_001043_from_specifier`. The coder owns implementation and
provisioning; refactorer and architect retain their review duties. The specifier
owns routing and QA acceptance. No new product behavior or master promotion is
authorized.

## Approved work

1. Add only the Xvfb provider and pin needed by the existing optional-tool
   mechanism. Follow `swarmforge/toolchain/README.md`. Verify the source revision
   and distribution digest; do not invent pins or override a core tool pin.
   Use the existing inspect/provision entry point. Keep installation local where
   supported and avoid unrelated package upgrades or a general installer redesign.
2. Provision Xvfb through the explicit named operation. Start a display owned
   by the test, use a disposable Chrome profile, and bind native input and
   observation to that display and the launched Chrome process. Clean up only
   owned processes and temporary files. Never fall back to shared display `:0`
   for global input.
3. Continue the existing native-permission observation/control repair. Preserve
   the pre-click image and window evidence. Observe the actual Allow control's
   readiness and confirm native permission settlement after the intended input.
   A disabled button, input dispatch, or unchanged pending request is not a pass.
   Do not bypass the prompt, mock permission, or weaken the assertion.
4. Prove the causal correction through the existing governed repair route and
   failing leaf, then obtain fresh exact focused evidence with properties and
   packaging. Follow coder, refactorer, architect, and QA integration in order.

Preserve declaration candidate `84c50799f`, observation candidate `d52c8409a`,
base `c0ec9345d9`, all original declaration/product remainders, failed receipts,
and incident `3bb9de5b-82bb-4a9d-aeb4-c14d21c6dae1`. Keep the consumed retry and
failure classification unchanged. Record provisioning and harness changes
separately from the retained declaration delta. Old receipts cannot prove new
bytes, and successful provisioning alone cannot support QA integration.

## Scope and verification

Development focus: provider inspection/provisioning, owned-display lifecycle,
native observation control, and the exact installed permission-recovery leaf.
Likely shared paths are `swarmforge/toolchain/` under Shell's
`development_toolchain` slice, plus the native support module and C helper under
their declared installed-side-panel consumers. Use canonical ownership intent
before coding and the actual changed-path preflight before complete evidence.
Preserve current/base consumer coverage; do not infer the final plan from an
earlier task count. Keep the core checker, artifact identity, incident policy,
and terminal gate unchanged. No all-runnable-pack feature run is authorized.

Report concrete progress and forecast at 30 minutes and assess scope, cost, and
remaining work at 60 minutes. Continue within the approved outcome when the path
remains bounded. Report an exact new provisioning or evidence limitation when
needed; do not stop for another routine approval of this same Xvfb installation
or same-family native-driver correction.
