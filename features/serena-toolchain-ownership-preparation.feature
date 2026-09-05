# mutation-stamp: sha256=77cef4a9846d9b3204b9a227d7205070118e93f7e2df229377da653f4b6296f4
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-05T18:47:10.602059259Z","feature_name":"Serena toolchain ownership preparation","feature_path":"features/serena-toolchain-ownership-preparation.feature","background_hash":"3a19725cf23930291fa167b81293d2babc741f31cb7863c7b0719ac8587c0d11","implementation_hash":"sha256:ba3eb8c3002c12a2e2b90fd455973864b7aa7e2c556fabf858cbea36edd1ca8c","scenarios":[{"index":0,"name":"Serena toolchain ownership preparation 001","scenario_hash":"701e68c3d4ac0ed077621f2a2ca28e9d70323e1ae12f044a15e6f800342cafb3","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-09-05T18:47:10.602059259Z"},{"index":1,"name":"Serena toolchain ownership preparation 002","scenario_hash":"5182b2ca3fd96418a6f833f46154649667e40199ad9d54c48ac788a69d321c09","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-05T18:47:10.602059259Z"},{"index":2,"name":"Serena toolchain ownership preparation 003","scenario_hash":"ad1eac748b9ba6d81f5734b307a9755d5208ab06cb668dc891762d839ca1dbcf","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-09-05T18:47:10.602059259Z"},{"index":3,"name":"Serena toolchain ownership preparation 004","scenario_hash":"0fdb4741141ee823598b2f7291c2cf67a2a64007da1d004b61c5bf4a2e14ee05","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-05T18:47:10.602059259Z"},{"index":5,"name":"Serena toolchain ownership preparation 006","scenario_hash":"a4b7573a8b933a4214d8ec5218214d24b4f28ce6f7880abf035354ef6e9f5829","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-09-05T18:47:10.602059259Z"}]}
# acceptance-mutation-manifest-end

# Serena toolchain ownership preparation 001
# Serena toolchain ownership preparation 002
# Serena toolchain ownership preparation 003
# Serena toolchain ownership preparation 004
# Serena toolchain ownership preparation 005
# Serena toolchain ownership preparation 006
Feature: Serena toolchain ownership preparation

  Background:
    Given the optional development-tool boundary is separate from core runtime authority
    And the original Serena pilot has no implementation delta

  # Serena toolchain ownership preparation 001
  Scenario Outline: Serena toolchain ownership preparation 001
    Given the composed toolchain has pin condition <condition>
    When the optional checker validates the requested tool
    Then it reports <result>
    And it cannot override any pin in the core lock

    Examples:
      | condition | result |
      | one valid optional pin from the subordinate fragment | that exact pin and its authority source |
      | a requested optional name has no pin | a missing-pin error |
      | an optional pin is invalid | an invalid-pin error |
      | the fragment duplicates a core tool name | an authority-conflict error |
      | the fragment uses an unknown schema | a schema error |

  # Serena toolchain ownership preparation 002
  Scenario Outline: Serena toolchain ownership preparation 002
    Given an optional tool is absent locally
    When the optional entry point receives <operation>
    Then it attempts <action>
    And it does not install any other tool

    Examples:
      | operation | action |
      | inspect the named optional tool | offline inspection with an unavailable result |
      | explicitly provision a valid named optional tool | only that tool's pinned provisioning operation |
      | provision without a tool name | a nonzero request error before any download |
      | provision an unknown tool name | a nonzero request error before any download |

  # Serena toolchain ownership preparation 003
  Scenario Outline: Serena toolchain ownership preparation 003
    Given the worker has core runtime state <core_state>
    And its optional development tools are absent
    When offline role startup performs strict runtime validation
    Then the core result remains <core_result>
    And no optional download starts

    Examples:
      | core_state | core_result |
      | all locked runtime requirements pass | pass |
      | Node differs from the lock | fail |
      | TypeScript is missing | fail |
      | Babashka is invalid | fail |
      | the vendored APS digest differs | fail |

  # Serena toolchain ownership preparation 004
  Scenario Outline: Serena toolchain ownership preparation 004
    Given the reviewed boundary receives a later change to <path_kind>
    When canonical verification planning selects its impact
    Then it preserves <selection>

    Examples:
      | path_kind | selection |
      | an optional development-tool module | its Shell slice, direct checks, and exact consumer closure |
      | the subordinate optional pin fragment | its Shell slice, pin checks, and exact consumer closure |
      | the core runtime checker | the existing global impact |
      | the core toolchain lock | the existing global impact and core evidence identity binding |

  # Serena toolchain ownership preparation 005
  Scenario: Serena toolchain ownership preparation 005
    Given the preparation adds a narrower optional-tool mapping
    When its own canonical base and candidate plan is computed
    Then every required historical owner, prerequisite, consumer, and property is retained
    And quarantine restrictions and terminal obligations remain in force
    And neither core global declaration is removed or narrowed
    And a complete all-pack result remains blocked in feature mode

  # Serena toolchain ownership preparation 006
  Scenario Outline: Serena toolchain ownership preparation 006
    Given the independent preparation has status <status>
    When the original Serena pilot is considered for resumption
    Then its resumption state is <resumption>

    Examples:
      | status | resumption |
      | only a committed preparation specification | waiting for reviewed implementation |
      | an unreviewed implementation candidate | waiting for reviewed implementation |
      | exact architect qa-ready proof integrated into QA with both causal path dispositions | reissue the same pilot task from that QA head |
