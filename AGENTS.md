# Repository instructions

## Responses

Always use ASD-STE100 Simplified Technical English. When a feature is complete,
give a summary, a scorecard, what went well, where the process failed, and
recommendations for refinement. Separate specification checks from runtime proof.

## Code constraints

Do not create or extend a monolith without explicit user approval. Split code
that is too large or has unrelated responsibilities. Preserve assigned role,
worktree, handoff, and verification duties under SwarmForge.

## Retrieval

Use `node swarmforge/scripts/retrieval.mjs` by default for ordinary file and text
discovery: `files <directory> [--glob <pattern>]`,
`search <directory> --literal <text>`, or `read <file>`. Follow the printed
continuation. Use `read <file> --full` for a required instruction or complete
review. Direct `rg`, ordinary reads, Serena, and the ownership query remain
available when they fit the question better.

- Before a new investigation, identify the question and the smallest useful
  retrieval. State the route once in normal progress reporting. Stop expanding
  when the question is answered.
- Find uncertain filenames with `rg --files` before opening them. Search a
  relevant directory first. Use literal search for documents, configuration,
  and CSS. Inspect the matching section before reading an entire document.
- For unfamiliar supported code, use a Serena outline, then the required
  symbol bodies or references. Use the canonical ownership query for test
  owners and consumers. Use ordinary inspection if Serena fails or is unsuitable.
- Reuse facts and unchanged instructions already in context. Read explicit
  required includes once per resolved path. Refresh after relevant file changes
  or doubtful results. Read required instructions fully and review complete diffs
  when the assigned duty requires them.
- Return each tool result once. If text and structured fields repeat the same
  answer, present one representation. Retain errors, exit status, omissions,
  continuation details, and any distinct image or resource content.
- Keep discovery output bounded. If a result is cut off, narrow the search or
  continue from the reported position. Do not repeat the same oversized command
  or claim that omitted content was inspected.
- Batch independent queries. Keep dependent reads and edits in order. At the
  next existing progress checkpoint, correct any repeated reads or excessive
  output in subsequent calls. Do not replay work to improve a process score.
- Do not require Serena calls for their own sake, create task-history memories,
  or treat instruction delivery as proof that these habits were used.
