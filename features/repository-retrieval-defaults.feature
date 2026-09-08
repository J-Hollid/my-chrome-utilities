# mutation-stamp: sha256=489dc623000cb3d0f64e31d146ce99bed16758cbaa2e3e05fdee23bac7fa7a44
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-08T14:03:25.351956193Z","feature_name":"Repository retrieval defaults","feature_path":"features/repository-retrieval-defaults.feature","background_hash":"55d0b31f0c670f8c1e83ab81895b37b33fae266e133bcc2bb0c4149719a944a9","implementation_hash":"a372d344377af36cdcff723ca5cdfd13366806a48649172db2ad5275e752f3fa","scenarios":[{"index":2,"name":"Repository retrieval defaults 003","scenario_hash":"12d731fb24c4455a7a9d6074b1c1ea26300f908441b01482ea75feb6b5c41144","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-08T14:03:25.351956193Z"},{"index":4,"name":"Repository retrieval defaults 005","scenario_hash":"b3002c69d8f48bac44e5798ea284bba802239013a28ec0e07a71497a6de8bcf9","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-08T14:03:25.351956193Z"},{"index":0,"name":"Repository retrieval defaults 001","scenario_hash":"6ce49a2011098cc6436e663fe8a227a01093688b11ecde1f21be0bf16b5d0423","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-09-08T14:01:56.751183411Z"},{"index":1,"name":"Repository retrieval defaults 002","scenario_hash":"8a13915fe7281547b826178f60056574df510765a48b016bcc92ad4c8012b681","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-09-08T14:01:56.751183411Z"}]}
# acceptance-mutation-manifest-end

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
