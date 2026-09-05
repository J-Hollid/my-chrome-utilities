# SwarmForge Serena development tools 001
# SwarmForge Serena development tools 002
# SwarmForge Serena development tools 003
# SwarmForge Serena development tools 004
# SwarmForge Serena development tools 005
# SwarmForge Serena development tools 006
Feature: SwarmForge Serena development tools

  Background:
    Given the Serena pilot uses local stdio and the Codex context
    And ordinary role startup must preserve the locked toolchain and sandbox

  # SwarmForge Serena development tools 001
  Scenario Outline: SwarmForge Serena development tools 001
    Given the <role> role has assigned worktree <worktree>
    When that role starts with provisioned Serena tools
    Then its Serena process binds to <worktree>
    And another role cannot change that process project

    Examples:
      | role | worktree |
      | specifier | /repo |
      | coder | /repo/.worktrees/coder |
      | refactorer | /repo/.worktrees/refactorer |
      | architect | /repo/.worktrees/architect |

  # SwarmForge Serena development tools 002
  Scenario Outline: SwarmForge Serena development tools 002
    Given Serena has startup condition <condition>
    When an ordinary role starts without network access
    Then the role receives tasks using <exploration>
    And startup attempts no dependency download or project toolchain change

    Examples:
      | condition | exploration |
      | pinned tools are present and ready | Serena and ordinary tools |
      | the Serena executable is missing | ordinary tools with a missing-tool reason |
      | the language server cannot start | ordinary tools with a server-failure reason |
      | MCP startup times out | ordinary tools with a timeout reason |

  # SwarmForge Serena development tools 003
  Scenario Outline: SwarmForge Serena development tools 003
    Given the pinned Serena session exposes its effective tool configuration
    When the worker requests capability <capability>
    Then its configured availability is <availability>

    Examples:
      | capability | availability |
      | symbol overview and targeted symbol bodies | enabled |
      | symbol references | enabled |
      | symbolic edits | disabled |
      | duplicate shell and whole-file tools | disabled |
      | memories and onboarding | disabled |
      | usage reporting | disabled |

  # SwarmForge Serena development tools 004
  Scenario Outline: SwarmForge Serena development tools 004
    Given an authored file has path <path>
    When the worker needs its definition and references
    Then the pilot supports <route>

    Examples:
      | path | route |
      | src/example.ts | current symbol queries through the TypeScript server |
      | scripts/example.mjs | current symbol queries through the TypeScript server |
      | test/example.mjs | current symbol queries through the TypeScript server |
      | swarmforge/scripts/example.mjs | current symbol queries through the TypeScript server |
      | acceptance/src/example.clj | Clojure symbol queries when provisioned, otherwise ordinary tools |
      | swarmforge/scripts/example.bb | ordinary tools |

  # SwarmForge Serena development tools 005
  Scenario Outline: SwarmForge Serena development tools 005
    Given the active worktree has changed through <change>
    When a query still returns the previous symbol body or references
    Then the worker uses a successful current refresh or ordinary file inspection
    And it cannot treat the stale answer as current code or verification proof

    Examples:
      | change |
      | an external edit |
      | a task checkout |

  # SwarmForge Serena development tools 006
  Scenario Outline: SwarmForge Serena development tools 006
    Given a repository file belongs to <area>
    When ordinary Serena exploration selects candidate files
    Then the area is <selection>
    And that selection does not filter the canonical ownership query

    Examples:
      | area | selection |
      | authored product code | available |
      | authored tests and process code | available |
      | nested worker worktrees | excluded |
      | dependencies and vendored source | excluded |
      | generated output, caches, and runtime receipts | excluded |
