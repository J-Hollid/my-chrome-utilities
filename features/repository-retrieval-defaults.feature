# User-approved 2026-09-08: repository-retrieval-defaults.
# Repository retrieval defaults 001 through 006
Feature: Repository retrieval defaults

  Background:
    Given an isolated repository fixture uses the production retrieval helper and instruction adapter

  # Repository retrieval defaults 001
  Scenario Outline: Repository retrieval defaults 001
    Given a text fixture has <shape> beyond the default output limit
    When the operator reads it and follows every printed continuation
    Then each default page stays within 80 result lines and 12288 body bytes
    And page source positions reconstruct the unchanged fixture without omissions or repetitions
    And the last page reports completion

    Examples:
      | shape                              |
      | many short lines                   |
      | one long line                      |
      | Unicode characters across a boundary |

  # Repository retrieval defaults 002
  Scenario Outline: Repository retrieval defaults 002
    Given a repository has matching files under <directory> and unrelated files elsewhere
    When the operator runs <operation> scoped to <directory>
    Then only matching files within <directory> appear in stable order
    And output states whether more results exist with an explicit continuation when needed
    And input text and paths are passed as data without shell execution

    Examples:
      | directory        | operation                       |
      | docs with spaces | filename discovery              |
      | src              | literal search for $() syntax   |

  # Repository retrieval defaults 003
  Scenario Outline: Repository retrieval defaults 003
    Given the selected input has condition <condition>
    When the retrieval helper processes that input
    Then it reports <result> without a false complete-read claim
    And errors retain a nonzero exit status

    Examples:
      | condition                         | result                       |
      | missing file                      | File not found               |
      | unreadable file                   | Cannot read file             |
      | no literal matches                | No matches                   |
      | input changed after the last page | Input changed; restart read  |

  # Repository retrieval defaults 004
  Scenario: Repository retrieval defaults 004
    Given a required instruction file exceeds the default output limit
    When the operator uses the explicit full-read option
    Then its complete contents are returned without a confirmation request
    And the helper does not alter any source, runtime state, or verification receipt

  # Repository retrieval defaults 005
  Scenario Outline: Repository retrieval defaults 005
    Given role <role> receives the repository AGENTS.md through <route>
    When its effective startup or task instruction input is inspected
    Then the current retrieval rules are present without a second mandatory read
    And the complete assigned role and its conditional handoff and verification duties remain present

    Examples:
      | role       | route                         |
      | specifier  | native startup loading        |
      | coder      | explicit safe-boundary reading |
      | refactorer | native startup loading        |
      | architect  | explicit safe-boundary reading |

  # Repository retrieval defaults 006
  Scenario: Repository retrieval defaults 006
    Given generated startup text exists but a running role has not loaded or read the new AGENTS.md
    When activation is reported
    Then that role remains Pending rather than Active
    And a real successful retrieval is reported only for the observed call
    And no busy role is restarted and no product handoff is interrupted
