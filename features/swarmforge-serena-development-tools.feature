# mutation-stamp: sha256=9e4736c046c6d9755ca0bed6a659e534f562bcbd81c49ebec3f6a5b96c62cdd7
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-05T21:19:47.860103101Z","feature_name":"SwarmForge Serena development tools","feature_path":"features/swarmforge-serena-development-tools.feature","background_hash":"77110852ee32a384b2b81baec4242bcd6a8307b771e13a73458891d857f89bd3","implementation_hash":"sha256:fa3d576995fa4c03df2abd835d1cee26dc9537736b4f59444a17c433568ee180","scenarios":[{"index":0,"name":"SwarmForge Serena development tools 001","scenario_hash":"7530e6cf1fd2bc8179780dd2144a7e1e10307095e7f8a9428e90525c2d972702","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:19:47.860103101Z"},{"index":1,"name":"SwarmForge Serena development tools 002","scenario_hash":"0f7895d3c744ef5c451eef61e98c3665cb835758f9d760d4965bfb22ed9766e0","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:19:47.860103101Z"},{"index":2,"name":"SwarmForge Serena development tools 003","scenario_hash":"a96a12b745680a468b8062634f098e635a623060d567d129f65669f4b68407e1","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:19:47.860103101Z"},{"index":3,"name":"SwarmForge Serena development tools 004","scenario_hash":"9ad02e47ae3b0663e949415acdb34c666256f9bcf75eb887dc8e5fb11cc80c6e","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:19:47.860103101Z"},{"index":4,"name":"SwarmForge Serena development tools 005","scenario_hash":"8cfb620c24d1fe8e75b4ee50e24d029f58b6910ae3b17d39d57b8ad343910193","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:19:47.860103101Z"},{"index":5,"name":"SwarmForge Serena development tools 006","scenario_hash":"8e90d0ea50ce7de7d753dca9f1d30e796ce9bf9e92453ac1510bdbbf76b1d848","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:19:47.860103101Z"}]}
# acceptance-mutation-manifest-end

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
