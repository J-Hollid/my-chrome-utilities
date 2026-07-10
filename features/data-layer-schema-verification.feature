# mutation-stamp: sha256=4a3fd0fc4473284763889735945f27703ddf3cdac144f8ac9e5b55da0c77dada
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T13:22:31.577871956Z","feature_name":"Data layer schema verification","feature_path":"features/data-layer-schema-verification.feature","background_hash":"8d9df54efeccad20c30d1aecf7952778f2b37fb424dd18454bae65ba84cdb59d","implementation_hash":"sha256:schema-verification-semantic-v1","scenarios":[{"index":0,"name":"Data layer schema verification 001","scenario_hash":"258b9b1a20d8603eded532f874b41e2d3e3d6c7c248edb229e5454108488f55b","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:22:31.577871956Z"},{"index":1,"name":"Data layer schema verification 002","scenario_hash":"69db45a1ee9659dc6ab2aa8830ca4623c27410719a263919a47f537140579078","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:22:31.577871956Z"},{"index":2,"name":"Data layer schema verification 003","scenario_hash":"9de8383458b4e1443f8201880af224bc3743bb640a6604f37a6b5194d56ff7ae","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:22:31.577871956Z"},{"index":3,"name":"Data layer schema verification 004","scenario_hash":"da8fcc6deaf24cb8833cfe5e9d5a928f21b50e3169ea3f4606d0dab5bc6262a2","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:22:31.577871956Z"},{"index":4,"name":"Data layer schema verification 005","scenario_hash":"1858347e4b8f35a3fdd67d32399b5972c6f4b48b071a3edaade17019abc04719","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:22:31.577871956Z"},{"index":5,"name":"Data layer schema verification 006","scenario_hash":"726f90d793e8a080bf5029989ce9b17af8d47f8d91fd633b30ec3e6a5a6fc353","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:22:31.577871956Z"},{"index":6,"name":"Data layer schema verification 007","scenario_hash":"2d8a8a7449f8d76a7c6cce1710b0e49f12d85becf42a50d1f204454b880ce9f1","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:22:31.577871956Z"},{"index":7,"name":"Data layer schema verification 008","scenario_hash":"a79d814ea38d0c9a3f6649eb995b1765967735b249802e963e40fa68d92f30b5","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:22:31.577871956Z"}]}
# acceptance-mutation-manifest-end

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
