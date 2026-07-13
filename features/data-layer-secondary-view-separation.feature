# mutation-stamp: sha256=1f44bf420ef9152211300d2712387e6d93106814dd1dc0bcb9529ad24b8b8e6b
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T22:19:48.073099078Z","feature_name":"Data Layer secondary view separation","feature_path":"features/data-layer-secondary-view-separation.feature","background_hash":"d9eb4a42adb29d704d82ae1ace9c082e78388246bd79155fee2fc1d1de1deb86","implementation_hash":"sha256:data-layer-hidden-css-v1","scenarios":[{"index":0,"name":"Data Layer secondary view separation 001","scenario_hash":"6b4a6476385defe14cc19c1aaff6ba63aada9b59c720bb1ae9ecc67437672a14","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T22:19:48.073099078Z"},{"index":1,"name":"Data Layer secondary view separation 002","scenario_hash":"9b8191001082bd8a123e16025249c26968331230a005f91d473e7fc5f62d90c9","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T22:19:48.073099078Z"},{"index":2,"name":"Data Layer secondary view separation 003","scenario_hash":"df2d0f6a1c8b623de698e932d0b18bcb98aed3adb93bca1ead4049441bf7b926","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T22:19:48.073099078Z"}]}
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
