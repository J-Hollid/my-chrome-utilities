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
