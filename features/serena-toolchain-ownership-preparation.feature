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
