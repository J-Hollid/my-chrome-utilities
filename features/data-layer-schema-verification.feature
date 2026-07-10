Feature: Data layer schema verification

  Background:
    Given a repository for project <project_name>
    And schema <schema_name> version <schema_version> is saved

  # Data layer schema verification 001
  Scenario Outline: Data layer schema verification 001
    When schema <schema_name> version <schema_version> is assigned to source <source_name>, event <event_name>, and target <validation_target>
    Then matching captured events and templates can be checked against that schema assignment
    And the assignment distinguishes payload validation from raw-input validation

    Examples:
      | project_name         | schema_name      | schema_version | source_name   | event_name | validation_target |
      | my-chrome-utilities | Purchase event   | 2              | Event history | purchase   | payload           |
      | my-chrome-utilities | Adobe page view  | 1              | Adobe beacons | pageview   | raw input         |

  # Data layer schema verification 002
  Scenario Outline: Data layer schema verification 002
    Given event <event_name> is checked against schema <schema_name> version <schema_version>
    When validation completes with <issue_count> issues
    Then the event validation state is <validation_state>
    And the state is communicated with text and not color alone

    Examples:
      | project_name         | schema_name    | schema_version | event_name | issue_count | validation_state |
      | my-chrome-utilities | Purchase event | 2              | purchase   | 0           | Valid            |
      | my-chrome-utilities | Purchase event | 2              | purchase   | 2           | 2 issues         |

  # Data layer schema verification 003
  Scenario Outline: Data layer schema verification 003
    Given validation of event <event_name> found an issue at instance path <instance_path>
    When validation details are opened
    Then the issue shows instance path <instance_path>, message <message>, expected value <expected>, and actual value <actual>
    And the issue identifies schema <schema_name> version <schema_version> and its schema location

    Examples:
      | project_name         | schema_name    | schema_version | event_name | instance_path    | message       | expected | actual |
      | my-chrome-utilities | Purchase event | 2              | purchase   | /transaction_id  | Required value | string   | missing |

  # Data layer schema verification 004
  Scenario Outline: Data layer schema verification 004
    Given event <event_name> has no applicable schema assignment
    When its validation state is displayed
    Then the state is <validation_state>
    And the event is not reported as valid

    Examples:
      | project_name         | schema_name    | schema_version | event_name | validation_state |
      | my-chrome-utilities | Purchase event | 2              | offer_view | Not checked      |

  # Data layer schema verification 005
  Scenario Outline: Data layer schema verification 005
    Given events have validation states <validation_states>
    When the user filters by validation state <selected_state>
    Then only events with validation state <selected_state> are visible
    And the session summary reports counts for Valid, Issues, and Not checked

    Examples:
      | project_name         | schema_name    | schema_version | validation_states          | selected_state |
      | my-chrome-utilities | Purchase event | 2              | Valid, 2 issues, Not checked | 2 issues       |

  # Data layer schema verification 006
  Scenario Outline: Data layer schema verification 006
    Given event template <template_name> has an editable draft
    When the draft changes
    Then validation results refresh against its assigned schema version
    And validation issues do not mutate or discard the draft
    And a valid JSON draft can be saved or pushed intentionally even when schema issues are present

    Examples:
      | project_name         | schema_name    | schema_version | template_name         |
      | my-chrome-utilities | Purchase event | 2              | Purchase confirmation |

  # Data layer schema verification 007
  Scenario Outline: Data layer schema verification 007
    When the Schemas view is displayed
    Then saved schemas show name, version, assigned sources, event names, and validation target
    And schemas can be searched by name, source, event name, or version
    And visible actions offer Create, Import, Edit as new version, Duplicate, Export, and Delete

    Examples:
      | project_name         | schema_name    | schema_version |
      | my-chrome-utilities | Purchase event | 2              |

  # Data layer schema verification 008
  Scenario Outline: Data layer schema verification 008
    Given saved session <session_name> records validation against schema <schema_name> version <schema_version>
    When schema <schema_name> is revised to version <new_version>
    Then the recorded session result remains associated with version <schema_version>
    And revalidation against version <new_version> requires an explicit action

    Examples:
      | project_name         | schema_name    | schema_version | session_name     | new_version |
      | my-chrome-utilities | Purchase event | 2              | Checkout journey | 3           |
