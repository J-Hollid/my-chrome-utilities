# mutation-stamp: sha256=d03c99480c7503f31a82306ddb7ff3000cf7a5d2f7f24a302e8dc738b7b58067
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T14:48:25.251643807Z","feature_name":"Data layer schemas operator layout","feature_path":"features/data-layer-schemas-operator-layout.feature","background_hash":"bca0999aab9faf67bb7eb8a109c5dd184a51426267a7124a13e21dae4f476980","implementation_hash":"sha256:operator-interface-semantic-v2","scenarios":[{"index":0,"name":"Data layer schemas operator layout 001","scenario_hash":"2eabb3793477343e30ef381d5d823375d112819555c9c800174fbae3cae70c5a","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:25.251643807Z"},{"index":1,"name":"Data layer schemas operator layout 002","scenario_hash":"ffb9f32f2543d797fab5f75b0c8cf8811d0bcb1939fc32b6b64135f89f3ceed2","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:25.251643807Z"},{"index":2,"name":"Data layer schemas operator layout 003","scenario_hash":"48052c887820d0918c298abadf0891f90287961bca46c17c3d73a10ab5e43ffc","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:25.251643807Z"},{"index":3,"name":"Data layer schemas operator layout 004","scenario_hash":"d5021e9cc60761828c78427b81482e795294f59f45498845b940e2551b3ff009","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:25.251643807Z"},{"index":4,"name":"Data layer schemas operator layout 005","scenario_hash":"549d037096381fc3db8cd59271d58b4cb99b0df9929af85f24c6429794e95f0c","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:25.251643807Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schemas operator layout

  Background:
    Given a repository for project <project_name>
    And the Data Layer Schemas view is displayed

  # Data layer schemas operator layout 001
  Scenario Outline: Data layer schemas operator layout 001
    Given schema <schema_name> version <version> has assignment <assignment> and usage count <usage_count>
    When schemas are listed
    Then <schema_name> is the row's primary label
    And the row shows version <version>, <assignment>, validation target, and <usage_count> usages
    And the selected schema is visually distinct without relying on color alone

    Examples:
      | project_name         | schema_name    | version | assignment                     | usage_count |
      | my-chrome-utilities | Purchase event | 2       | event.history purchase payload | 14          |

  # Data layer schemas operator layout 002
  Scenario Outline: Data layer schemas operator layout 002
    Given schema <schema_name> version <version> is selected
    When its detail is displayed
    Then schema identity, version, assignments, validation target, and usage appear before the schema document
    And schema document, assignments, and validation examples are available as distinct detail groups
    And actions <schema_actions> remain reachable while the schema document scrolls

    Examples:
      | project_name         | schema_name    | version | schema_actions                                  |
      | my-chrome-utilities | Purchase event | 2       | Edit as new version, Duplicate, Export, Delete |

  # Data layer schemas operator layout 003
  Scenario Outline: Data layer schemas operator layout 003
    Given validation found <issue_count> issues against schema <schema_name> version <version>
    When validation details are displayed
    Then the summary shows <issue_count> issues and identifies schema <schema_name> version <version>
    And each issue shows instance path, message, expected value, actual value, and schema location in aligned fields
    And selecting an issue reveals the complete values without losing the issue list position

    Examples:
      | project_name         | issue_count | schema_name    | version |
      | my-chrome-utilities | 2           | Purchase event | 2       |

  # Data layer schemas operator layout 004
  Scenario Outline: Data layer schemas operator layout 004
    Given schema <schema_name> version <version> is being edited
    When the editor is displayed
    Then identity, target, parent, and assignment controls appear before property and general rule authoring
    And validation examples and generated-document status are shown near the editor rather than in the schema list
    And the generated schema document is a secondary disclosure rather than the primary authoring control
    And persistent actions <editor_actions> remain reachable while the property tree scrolls

    Examples:
      | project_name         | schema_name    | version | editor_actions |
      | my-chrome-utilities | Purchase event | 3       | Save and Cancel |

  # Data layer schemas operator layout 005
  Scenario Outline: Data layer schemas operator layout 005
    Given schema <schema_name> has unsaved version <version>
    When the user selects another schema
    Then the unsaved schema document is not discarded without confirmation
    And choosing to remain restores schema <schema_name> version <version> and its editor position

    Examples:
      | project_name         | schema_name    | version |
      | my-chrome-utilities | Purchase event | 3       |
