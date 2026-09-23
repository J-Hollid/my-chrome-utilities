# Repository instructions

## Responses

Always use ASD-STE100 Simplified Technical English. When a feature is complete,
give a summary, a scorecard, what went well, where the process failed, and
recommendations for refinement. Separate specification checks from runtime proof.

## Code constraints

Do not create or extend a monolith without explicit user approval. Split code
that is too large or has unrelated responsibilities.

## Development

Use the normal Codex workflow. Start from `qa` for feature work. Review the
relevant code and specification, make small changes, and run direct checks for
the changed behavior. `npm run typecheck`, `npm run build`, and focused
`node test/<name>.mjs` commands are available. Use a browser test when the
change affects an installed control. Report the exact checks and their limits.

Use `rg`, the bounded retrieval helper, or Serena when each helps answer a
specific question. Serena is optional. SwarmForge role handoffs, ownership
queries, receipt checks, and verification packs are historical tools. They are
not required for ordinary feature work or QA integration. Do not repair these
systems to pass a product task. Keep existing historical evidence and user work.
