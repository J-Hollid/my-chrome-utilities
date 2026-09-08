# Retrieval defaults and repository instructions R01

Status: user-approved on 2026-09-08 for coder handoff and focused QA integration.
Task: `repository-retrieval-defaults`.
Prepared: 2026-09-08. Mode: tooling and prompt changes for QA integration.
Specification base: `fa4cbfd95278061ba5a117bb7728a053ebb596a4`.

The user's reply "Approved" authorizes this task after the current
`project-multiple-observation-sources` coder work. Use the ordinary queue without
interrupting that task. Preserve its implementation and review lineage when
starting this task from the applicable current QA base.

## Outcome

Keep a short retrieval rule in root `AGENTS.md`. Provide bounded file discovery,
literal search, and text reads through one small repository-local command.
Use existing checkpoints to correct actual behavior before more retrieval.

The prepared AGENTS.md retains the user's response and code-size rules. It adds
question-first retrieval, filename discovery, scoped symbol work, one result
representation, explicit continuation, and reuse of unchanged context.
The source file owns these concise rules. Do not copy a second full rule set
into every role prompt or include the whole instruction tree in AGENTS.md.

The exact approved initial text is attached as
`docs/repository-retrieval-instructions-R01.md`. Install it as root `AGENTS.md`
with the tooling implementation, then add the helper invocation as specified
below. The attachment records the approved starting text; the installed root
file is the active instruction source. The specifier's local root draft has
the same bytes and is not proof of other-role activation.

## Mechanical defaults

Implement `node swarmforge/scripts/retrieval.mjs` with three read-only operations:

| Operation | Default behavior |
|---|---|
| `files <directory>` | List matching repository-relative filenames in stable order; allow an explicit glob |
| `search <directory> --literal <text>` | Report literal matches with path and line identity; no shell evaluation |
| `read <file>` | Return a bounded portion of text with source position and an exact continuation |

Default discovery output to at most 80 result lines and 12 KiB of body text,
whichever is reached first. These are output defaults, not verification limits.
Report whether more content exists and print a directly usable continuation.
A long single line and Unicode text must remain recoverable without loss.
Continuing an unchanged input must neither skip nor repeat its content. Detect
a changed input before presenting an old continuation as the next part.

Allow an explicit full-read option for a required instruction or complete review.
It needs no user approval. Required includes must never be treated as read when
only their first page was returned. Do not put this reader in test or build
stdout, mutation output, evidence receipts, handoff payloads, or runtime streams.

Keep the repository's existing ignore rules for discovery. Permit an explicitly
named ignored file or directory when it is required. Show a missing file,
unreadable input, or failed search as an error distinct from no matches. Handle
spaces and shell metacharacters as data. Write no index, cache, or telemetry.
Use separate query and rendering modules if one file would mix those purposes.

AGENTS.md will name the helper as the default for ordinary file/text discovery
once it exists. Keep direct `rg`, ordinary reads, Serena, and the ownership query
available for cases they handle better. This is not a shell command blocker.

One-copy MCP presentation is an agent instruction in this change. The repository
does not own every host tool renderer. Do not claim universal mechanical
deduplication or remove MCP structured fields that clients may require. The
Serena server currently forwards protocol output; leave that protocol unchanged.

## Context delivery and activation

Official Codex documentation says project instructions are discovered from the
repository root down to the working directory once per run or launched TUI
session. A root file is therefore useful persistent guidance, but editing it
does not prove that existing sessions reloaded it:
https://learn.chatgpt.com/docs/agent-configuration/agents-md

The specification handoff carries the approved instruction attachment. The
current handoff validator requires focused evidence for root AGENTS.md, so the
coder commits that root file with the tooling candidate and carries it through
normal review. Use an existing safe startup or task boundary for activation.
If a current role has not received the file through native instruction loading,
its normal startup/task instruction may direct one read of that exact local
file. Avoid a second read when its current contents are already supplied.
Preserve existing include resolution and all conditional role duties.

Prove instruction delivery separately from use: inspect the effective instruction
input for each role and perform one small real file retrieval through the helper.
Report a current session as pending until its input or explicit read is observed.
Do not restart a busy role, interrupt the approved observation-source product
task, send unsolicited status mail, or infer activation from generated text alone.
An observed retrieval proves that case only, not permanent agent compliance.

## Focus, ownership, and acceptance

Contract: `features/repository-retrieval-defaults.feature`.
Development focus: one direct CLI fixture test for output/continuation/errors,
the existing startup-reading test if its adapter changes, and one live smoke.
Use tiny temporary fixtures in the assigned worktree and clean them afterward.

Proposed prefixes `swarmforge/scripts/retrieval/` and entry file
`swarmforge/scripts/retrieval.mjs` belong to parent `shell`, proposed slice
`repository_retrieval`, with no product-pack consumers. AGENTS.md and this
program are instructions, not product behavior. Register the helper and focused
tests through existing ownership mechanisms; do not create a new verification pack.

If startup integration needs `swarmforge/scripts/serena/instructions.clj`, its
current owner is Shell's `serena_development_tools` slice. The canonical query
also selects `swarmforge-handoff-control` and Verification Process's
`evidence_promotion` and `reliability_run_intent` slices. Keep that conservative
forecast if the file is touched. Do not edit other role prompts.

The coder performs read-only intent classification before implementation and
exact plan-only preflight after the first coherent commit. Use focused evidence
with properties and package proof. Any coarse all-pack boundary routes the
existing independent preparation rule; it never authorizes a full feature gate.
The specifier completed APS parsing and IR-DRY review without mutation.

## Effort and assessment

Expected implementation and focused review: two hours. At one hour, expect the
reader fixture cases to pass and report remaining integration work. Report at
two hours if work remains. Do not expand into a retrieval platform or protocol
proxy to meet the estimate. Escalate only a material scope change under the
existing autonomy rules.

At the next existing delivery checkpoint, assess one actual retrieval sequence:
was the question answered, did output repeat, and did the agent expand only for
missing information? Record helped, neutral, or impeded in the existing report.
No token baseline, new mandatory reviewer, additional approval gate, or process
telemetry is part of this change.

## Specification scorecard at approval

| Item | Result |
|---|---|
| Repository instructions | Prepared; 2,261 bytes, with original response and code constraints |
| Mechanical contract | Six scenarios; APS parser passed; IR-DRY found no duplicate candidates |
| Helper implementation | Approved for the coder queue; implementation pending |
| Root instruction installation | Approved text attached; coder installs it with focused evidence |
| Other role activation | Pending; no sessions restarted or role files changed |
| Full verification gates | Zero |

What worked: selected symbol bodies established the actual protocol and startup
boundaries. Existing ownership output already supplies expansion commands.
Process issue: a guessed optional config path was absent; filename discovery
must precede such reads. Refinement: apply the root retrieval rules immediately
in this session and keep the mechanical implementation small. The helper can
bound its own output; AGENTS.md and observed use remain necessary because it
cannot intercept every arbitrary shell command or host tool call.
