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
    Then it uses <route>
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
