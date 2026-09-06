# mutation-stamp: sha256=ba15e93bc341feaaef73d331a9b18e4acf27605a720541fcb2e2c68388f6c1a8
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-06T11:45:05.168477342Z","feature_name":"SwarmForge Serena use assessment","feature_path":"features/swarmforge-serena-use-assessment.feature","background_hash":"73832f8a743ea07d25205276b11a62cc3a67bacbe0f9b02464ef8dff76210e43","implementation_hash":"c570f1d4117161826a28cf3849f2c9260e0c94d3","scenarios":[{"index":0,"name":"SwarmForge Serena use assessment 001","scenario_hash":"c05d27a34410a0253e08dfc4d4eb241b6c35769c5c8bfe7a3b74a960279fcf05","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-09-06T11:45:05.168477342Z"},{"index":1,"name":"SwarmForge Serena use assessment 002","scenario_hash":"07cbfbbf101c08b9b587b7f0156360560e33bf717740005bade7ea6286a71b99","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-09-06T11:45:05.168477342Z"},{"index":2,"name":"SwarmForge Serena use assessment 003","scenario_hash":"1bcbe5ce6bde4ffbb9766aee864c83a6f994e5a049eb38a6f69326a1851c72dd","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-09-06T11:45:05.168477342Z"}]}
# acceptance-mutation-manifest-end

# SwarmForge Serena use assessment 001
# SwarmForge Serena use assessment 002
# SwarmForge Serena use assessment 003
Feature: SwarmForge Serena use assessment

  Background:
    Given the shared tool-use rule is delivered by the production role instruction generator

  # SwarmForge Serena use assessment 001
  Scenario Outline: SwarmForge Serena use assessment 001
    Given the receiving role is <role>
    When its effective startup and required includes are resolved
    Then it receives the Serena assessment rule once from the shared source
    And it must assess suitable symbol use before broad unfamiliar code reading
    And the instruction retains the role's conditional duties and complete review requirements

    Examples:
      | role       |
      | specifier  |
      | coder      |
      | refactorer |
      | architect  |

  # SwarmForge Serena use assessment 002
  Scenario Outline: SwarmForge Serena use assessment 002
    Given the next real exploration question concerns <question>
    When the role selects and explains its first reading route
    Then the selected exploration route is <route>
    And wider reading follows only for a concrete unanswered question

    Examples:
      | question                                 | route                              |
      | unfamiliar supported module structure    | a scoped Serena symbol overview    |
      | callers affected by a split or interface  | Serena symbols and references      |
      | a CSS selector or literal configuration   | ordinary file search               |
      | verification owners and consumers        | the canonical ownership query      |
      | complete architecture review             | full diff and suitable symbol work |

  # SwarmForge Serena use assessment 003
  Scenario Outline: SwarmForge Serena use assessment 003
    Given Serena has condition <condition>
    When that condition prevents a reliable answer to the current question
    Then ordinary inspection continues with one short fallback reason
    And the role does not install tools, replay work, or create a tool-use gate
    And any usage report distinguishes actual queries from generated instructions

    Examples:
      | condition             |
      | missing tool          |
      | server failure        |
      | stale symbol result   |
      | unsupported file type |
