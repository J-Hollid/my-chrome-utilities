# mutation-stamp: sha256=4a47baf113d230e41435253f7faa3b43e2ab1fea6e06ddd6133c7ec067979171
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-05T21:20:18.013545099Z","feature_name":"SwarmForge Serena startup reading","feature_path":"features/swarmforge-serena-startup-reading.feature","background_hash":"cb5936c4ebed6f5a12ebc560e9ab45a2ca7ec48d17392d7fcff003f4bbf320ad","implementation_hash":"sha256:af63e0e7aff666d87a444f3bfe88a4142cc5ba8c9aff7a6bad7b32e4ec93696e","scenarios":[{"index":0,"name":"SwarmForge Serena startup reading 001","scenario_hash":"ab21f747d90c0fd5af31a82efb97e5ca4838142db3c2947b12755cde93bd35c6","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:20:18.013545099Z"},{"index":1,"name":"SwarmForge Serena startup reading 002","scenario_hash":"41c8c69b9a73d8dda5ad94afc25a12579442b1130424610d507843aea7f24745","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:20:18.013545099Z"},{"index":2,"name":"SwarmForge Serena startup reading 003","scenario_hash":"6ce4658400c6e48dbc90a3ae8056a5d73ebb37fd2318573c11bad5734a1f4eb2","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:20:18.013545099Z"},{"index":3,"name":"SwarmForge Serena startup reading 004","scenario_hash":"3323a6a92cf2da708cc561fd02ff1bd4f1a5cd81ee9630a290f51dbd4c1f7170","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:20:18.013545099Z"}]}
# acceptance-mutation-manifest-end

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
