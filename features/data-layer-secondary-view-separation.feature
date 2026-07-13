# mutation-stamp: sha256=cc57f46164e70e88a488a79c2d6f3f616fd27febcc4a049bbc7e91bcb4cce4b0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-13T17:00:53.105138343Z","feature_name":"Data Layer secondary view separation","feature_path":"features/data-layer-secondary-view-separation.feature","background_hash":"d9eb4a42adb29d704d82ae1ace9c082e78388246bd79155fee2fc1d1de1deb86","implementation_hash":"sha256:304276cc704dd7a1897709f41bcac05ed743913dc17a577343897830503bd222","scenarios":[{"index":3,"name":"Data Layer secondary view separation 004","scenario_hash":"967dace3cc6db94f075017d8b3fe798143a66882a75232cb346032caf5e48eaa","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-13T16:54:21.820734520Z"},{"index":0,"name":"Data Layer secondary view separation 001","scenario_hash":"70f18aad46c1a5530c3068ea4345a2dc3eaee9b8d60bf5f215c6726a876d6de3","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-13T15:35:55.318761093Z"},{"index":1,"name":"Data Layer secondary view separation 002","scenario_hash":"9b8191001082bd8a123e16025249c26968331230a005f91d473e7fc5f62d90c9","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T22:19:48.073099078Z"},{"index":2,"name":"Data Layer secondary view separation 003","scenario_hash":"df2d0f6a1c8b623de698e932d0b18bcb98aed3adb93bca1ead4049441bf7b926","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T22:19:48.073099078Z"}]}
# acceptance-mutation-manifest-end

Feature: Data Layer secondary view separation

  Background:
    Given the Data Layer section is displayed

  # Data Layer secondary view separation 001
  Scenario Outline: Data Layer secondary view separation 001
    When Data Layer tab <selected_view> is activated
    Then exactly the <selected_view> tab is selected
    And only the <selected_view> panel is visible in Data Layer content
    And the <first_hidden_view>, <second_hidden_view>, and <third_hidden_view> panels are hidden
    And the Data Layer content is not a combined Library, Sessions, and Schemas view
    And Live testing controls, target selection, settings, and Live event feed are absent from <selected_view> content

    Examples:
      | selected_view | first_hidden_view | second_hidden_view | third_hidden_view |
      | Library       | Live              | Sessions           | Schemas           |
      | Sessions      | Live              | Library            | Schemas           |
      | Schemas       | Live              | Library            | Sessions          |

  # Data Layer secondary view separation 002
  Scenario Outline: Data Layer secondary view separation 002
    Given Data Layer tab <selected_view> is active in a browser
    When the computed presentation of the Data Layer panels is inspected
    Then the <selected_view> panel has a computed display other than none
    And the <first_hidden_view>, <second_hidden_view>, and <third_hidden_view> panels have computed display none
    And hidden Data Layer panels do not occupy layout space or receive keyboard focus

    Examples:
      | selected_view | first_hidden_view | second_hidden_view | third_hidden_view |
      | Library       | Live              | Sessions           | Schemas           |
      | Sessions      | Live              | Library            | Schemas           |
      | Schemas       | Live              | Library            | Sessions          |

  # Data Layer secondary view separation 003
  Scenario Outline: Data Layer secondary view separation 003
    Given the <hidden_view> panel has its normal layout styling
    When Data Layer tab <selected_view> is selected in a browser
    Then the <hidden_view> panel has computed display none
    And its layout styling does not override its hidden state
    And the <hidden_view> content is neither painted nor focusable

    Examples:
      | hidden_view | selected_view |
      | Library     | Sessions      |
      | Sessions    | Schemas       |
      | Schemas     | Library       |

  # Data Layer secondary view separation 004
  Scenario Outline: Data Layer secondary view separation 004
    Given the Schemas view contains <schema_state>
    When the operator leaves Schemas for <selected_view>
    Then schema editors, editor actions, assignment controls, and schema review controls are not visible or focusable
    And no schema-specific control is displayed after the <selected_view> panel
    And only <selected_view> content is available to assistive technology

    Examples:
      | schema_state                | selected_view |
      | an open dirty schema draft  | Live          |
      | an open assignment editor   | Library       |
      | an open reusable rule editor | Sessions     |

  # Data Layer secondary view separation 005
  Scenario: Data Layer secondary view separation 005
    Given the Schemas view has a dirty schema draft with an open editor
    When the operator switches to Library and returns to Schemas
    Then the schema draft and editor values are restored unchanged
    And switching views does not close, save, or discard the draft
    And switching views does not open a discard-changes review

  # Data Layer secondary view separation 006
  Scenario: Data Layer secondary view separation 006
    When schema authoring controls are displayed
    Then Close schema editor and Save and close schema are contained within the schema editor
    And the schema close-review actions are contained within their review
    And Version policy is contained within the assignment editor
    And a standalone Assignment policy control is absent
