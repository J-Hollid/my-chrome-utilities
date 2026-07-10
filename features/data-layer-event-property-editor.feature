# mutation-stamp: sha256=a4fd682b58fdc33d73a8908bbe22e7ec4e0e637e7f9cb570bab9bf0d4c4252e1
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T13:32:54.244935562Z","feature_name":"Data layer event property editor","feature_path":"features/data-layer-event-property-editor.feature","background_hash":"06f38ced56e1b16d32f32500ce0064703fc7466c27617c94f36dd282217ae0ae","implementation_hash":"sha256:event-property-editor-semantic-v2","scenarios":[{"index":0,"name":"Data layer event property editor 001","scenario_hash":"d95ed66864544545c532b2c29117e1518fd4becf396171c32a431bb6a485a03c","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:32:54.244935562Z"},{"index":1,"name":"Data layer event property editor 002","scenario_hash":"fe35657c0020114fe764d22d74ae0958642a83fb944e71c9799851c7ee7f2e07","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:32:54.244935562Z"},{"index":2,"name":"Data layer event property editor 003","scenario_hash":"453bdc60783c0383134bf02da28c8be40e911254502f989c40ea3adb44aac67a","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:32:54.244935562Z"},{"index":3,"name":"Data layer event property editor 004","scenario_hash":"629ee1ccf50bf9b84730aabb7bd853652282e56671c3cc6ac305750cb5abc01e","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:32:54.244935562Z"},{"index":4,"name":"Data layer event property editor 005","scenario_hash":"e7222f9a89c833b48297471ea5142161ca439450d4a52d6ebe0f4d9da25fdfbe","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:32:54.244935562Z"},{"index":5,"name":"Data layer event property editor 006","scenario_hash":"2dc53a24a1ac9cd71ae5b7a218cb88075aaa455b3ad83883356769624ba66f79","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:32:54.244935562Z"},{"index":6,"name":"Data layer event property editor 007","scenario_hash":"d3bca3f85ed8d1d9d31d6b8df421d3dfb77fd9e830bf6f56debbc51611787e15","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:32:54.244935562Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer event property editor

  Background:
    Given a repository for project <project_name>
    And event template <template_name> is open for editing

  # Data layer event property editor 001
  Scenario Outline: Data layer event property editor 001
    When the property editor is displayed
    Then Properties, JSON, and Validation views edit the same draft
    And the Properties view preserves string, number, boolean, null, object, and array value types
    And switching views does not save or discard draft changes

    Examples:
      | project_name         | template_name         |
      | my-chrome-utilities | Purchase confirmation |

  # Data layer event property editor 002
  Scenario Outline: Data layer event property editor 002
    Given property <property_path> has value <old_value>
    When the user performs <edit_action>
    Then the structured draft and JSON draft both reflect <expected_result>
    And the original template remains unchanged until the draft is saved

    Examples:
      | project_name         | template_name         | property_path  | old_value | edit_action             | expected_result |
      | my-chrome-utilities | Purchase confirmation | transaction_id | test-123  | change value to test-456 | test-456        |
      | my-chrome-utilities | Purchase confirmation | debug           | true      | remove property          | property absent |
      | my-chrome-utilities | Purchase confirmation | revenue         | absent    | add number 49.95         | number 49.95    |

  # Data layer event property editor 003
  Scenario Outline: Data layer event property editor 003
    Given the JSON draft contains <invalid_content>
    When the user attempts to save or push the draft
    Then the action is blocked
    And a visible error identifies the invalid JSON location
    And template <template_name> remains unchanged

    Examples:
      | project_name         | template_name         | invalid_content      |
      | my-chrome-utilities | Purchase confirmation | missing closing brace |

  # Data layer event property editor 004
  Scenario Outline: Data layer event property editor 004
    Given event template <template_name> has version <old_version>
    And the draft contains valid changes
    When the user saves the draft as a revision
    Then template <template_name> has version <new_version>
    And version <old_version> remains available to pinned test sequences

    Examples:
      | project_name         | template_name         | old_version | new_version |
      | my-chrome-utilities | Purchase confirmation | 3           | 4           |

  # Data layer event property editor 005
  Scenario Outline: Data layer event property editor 005
    Given a valid unsaved draft targets <destination>
    When the user pushes the draft to the active page
    Then the exact draft payload is sent to <destination>
    And the editor reports the active page, adapter, destination, and result
    And template <template_name> retains its last saved version

    Examples:
      | project_name         | template_name         | destination   |
      | my-chrome-utilities | Purchase confirmation | event.history |

  # Data layer event property editor 006
  Scenario Outline: Data layer event property editor 006
    Given the draft has unsaved changes
    When the user leaves the property editor
    Then the user can keep editing, discard the draft, or save it
    And unsaved changes are not discarded without an explicit choice

    Examples:
      | project_name         | template_name         |
      | my-chrome-utilities | Purchase confirmation |

  # Data layer event property editor 007
  Scenario Outline: Data layer event property editor 007
    Given nested property <property_path> has value <old_value>
    When the user expands its parent and changes it to <new_value>
    Then the draft retains the surrounding object and array structure
    And nested property <property_path> has value <new_value> in Properties and JSON views

    Examples:
      | project_name         | template_name         | property_path       | old_value | new_value |
      | my-chrome-utilities | Purchase confirmation | /items/0/product_id | sku-123   | sku-456   |
