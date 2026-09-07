# Serena initial-instructions follow-up R01

Status: approved by the user on 2026-09-07 for the next QA integration boundary.
Stable task: `serena-initial-instructions-repair`.
Classification: bounded tooling correction.
Contract: `features/swarmforge-serena-initial-instructions.feature`.

The trigger was met at QA `c573b9822b47fdafac617faac73e4ce55c63a252` on
2026-09-07 at 13:54:42 UTC. The architect handoff is complete. The subsequent
queue and activity check found no queued or active task, recorded command, or
progress lease in any of the four roles. Issue this approved correction from
the specification descendant of that QA head. No product task is started next.

## Trigger and order

After the next reviewed implementation is integrated into QA, make this correction
the next follow-up before starting another product task. The expected integration
is `side-panel-companion-brand-correction`; the user's trigger is the next QA
integration, not a fixed date. A documentation commit alone does not trigger it.

Complete the current handoff and check actual role activity through the normal
queue and progress-lease rules. The user expects all roles to be idle then.
Do not infer idleness from integration alone or interrupt a live command. Prepare
the correction from that exact QA descendant and use the ordinary review route.
Refresh role connections only at an idle boundary after the correction is ready.
No routine repeat approval is needed for this recorded scope and timing.

## Confirmed cause and correction

The architect's pinned installation passed inspection. A fresh MCP connection
started and exposed five tools. Serena's connection instruction requires
`initial_instructions`, but the shared tool list omits it from both Serena's
`fixed_tools` and Codex's `enabled_tools`. The same configuration serves all roles.

Add `initial_instructions` to the shared allowed list. Update the generated
project and global configurations in each assigned worktree without downloading
or changing the pinned installation. Keep the server optional and read-only,
with editing, shell, project switching, memories, and onboarding disabled.

## Required proof

Check that both configuration layers expose the required tool. Exercise the
actual pinned connection: initialize, list tools, call `initial_instructions`,
then run a small symbol query against authored code in the assigned worktree.
Check effective delivery for all four roles. Retain unavailable-server fallback.
The regression must detect the missing dependency rather than compare two copies
of the same incomplete tool list.

Use focused Serena configuration, launch, and runtime checks, then exact current
ownership and normal review-ready package evidence. No all-runnable-pack feature
gate, model change, new provisioning, or general verifier redesign is included.
Record the result and distinguish working server connectivity from usable tools.

## Delivery plan and verification

Development focus: the existing Serena provider, launch, launch-runtime, and
server tests, plus a regression that removes only `initial_instructions` from
otherwise valid settings and proves that the required setup sequence is blocked.
Prove the correction using the pinned server, not only a mocked tool catalogue.
Keep deterministic automated coverage separate from recorded local live proof.

Likely existing integration paths are
`swarmforge/scripts/serena/{config,installation,launch-role,server}.mjs`,
the existing focused Serena tests, and their acceptance registration. Assess the
actual paths before edits. Keep configuration generation and local refresh small
and separate from provisioning. Refresh only configuration owned by this setup;
retain the pinned source, environment, language servers, and unrelated settings.
An unchanged second refresh must be safe. No network or package manager may be
invoked by local refresh or normal startup.

QA impact forecast: `shell.serena_development_tools`, with
`verification_process` only where canonical registration or exact ownership
requires it. The coder performs read-only intent classification before coding
and exact changed-path planning after a coherent commit. Use the complete causal
plan, selected properties, and fresh package proof through normal review. No new
production prefix is proposed. Any small new helper must declare the existing
Shell parent, Serena slice, and actual launch/runtime consumers before coding.

The regression and acceptance coverage must observe each role's effective server
and client settings and assigned worktree. The live record must include server
initialization, the exposed tools, a successful `initial_instructions` response,
and one scoped authored-code symbol result. A reachable server alone is not a
pass. Preserve the optional missing-server fallback and explain any unavailable
live proof without claiming success.

Effort expectation: 60 minutes, with a 30-minute progress checkpoint. Report the
cause, remaining work, and forecast if this differs. Expected benefit: remove the
confirmed setup blocker; no speed or token saving is yet measured. Continue with
the bounded correction under the existing approval. Return a concrete scope
decision only if a new dependency requires downloads, changed pins, broader
permissions, or unrelated infrastructure changes. After ordinary architecture
review and QA integration, refresh the four role connections at an idle boundary
and report effective delivery. Never restart a busy role to gather evidence.

Specification checks on 2026-09-07: the APS Gherkin parser passed. The IR DRY
check found 19 unique steps and zero findings. Shared setup is in the Background;
only role and failure condition vary. No acceptance mutation was run by the
specifier. The user's recorded follow-up approval authorizes the coder handoff.
