# SwarmForge Serena startup reading 001
# SwarmForge Serena startup reading 002
# SwarmForge Serena startup reading 003
# SwarmForge Serena startup reading 004
Feature: SwarmForge Serena startup reading

  Background:
    Given the role uses the generated startup instruction and shared Serena usage rule

  # SwarmForge Serena startup reading 001
  Scenario Outline: SwarmForge Serena startup reading 001
    Given the current role is <role>
    When its startup instruction is generated
    Then required startup reading includes <role_prompt>
    And it includes the constitution, all constitution articles, handoff rules, and shared tool-use rule
    And each explicit required instruction include is read once per resolved path
    And file references alone do not request recursive reading

    Examples:
      | role | role_prompt |
      | specifier | swarmforge/roles/specifier.prompt |
      | coder | swarmforge/roles/coder.prompt |
      | refactorer | swarmforge/roles/refactorer.prompt |
      | architect | swarmforge/roles/architect.prompt |

  # SwarmForge Serena startup reading 002
  Scenario Outline: SwarmForge Serena startup reading 002
    Given a required instruction refers to <reference>
    When the worker selects required reading for its current task
    Then the reference has reading treatment <treatment>

    Examples:
      | reference | treatment |
      | an explicit required instruction file | read it or report that the required file is missing |
      | the selected task program and contracts | read for the selected task |
      | the current scope and applicable mode rules | read when selecting the task |
      | a completed task history link | do not read from that link alone |
      | an example source path or command argument | inspect only when the task needs it |
      | another role prompt with no explicit required include | do not load it at startup |

  # SwarmForge Serena startup reading 003
  Scenario Outline: SwarmForge Serena startup reading 003
    Given the current exploration question concerns <question>
    When the worker selects a tool under the shared usage rule
    Then the recommended first route is <route>
    And wider reading requires a concrete unanswered question

    Examples:
      | question | route |
      | a filename or literal configuration value | ordinary file search |
      | an unfamiliar module structure | a scoped symbol overview |
      | a changed public function and its callers | targeted symbol bodies and references |
      | verification ownership and required consumers | the canonical ownership query helper |
      | a complete architecture review | the full candidate diff with targeted follow-up queries |

  # SwarmForge Serena startup reading 004
  Scenario Outline: SwarmForge Serena startup reading 004
    Given Serena had observed effect <effect> during a naturally requested task
    When the normal delivery report is written
    Then an applicable pilot observation is <observation> with its concrete reason
    And missing observation data cannot block delivery
    And the pilot requires no repeated task, benchmark run, or new telemetry collection

    Examples:
      | effect | observation |
      | a targeted query avoided an unnecessary module read | helped |
      | ordinary search already answered the question | neutral |
      | server recovery delayed the work | impeded |
