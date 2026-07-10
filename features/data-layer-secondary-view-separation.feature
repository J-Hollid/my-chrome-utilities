# mutation-stamp: sha256=d4ae3233196bf3e36afaf50986bb37592e875c1aca51e588f591a4eb240479ac
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T21:41:42.342844382Z","feature_name":"Data Layer secondary view separation","feature_path":"features/data-layer-secondary-view-separation.feature","background_hash":"d9eb4a42adb29d704d82ae1ace9c082e78388246bd79155fee2fc1d1de1deb86","implementation_hash":"sha256:data-layer-secondary-view-visibility-v1","scenarios":[{"index":0,"name":"Data Layer secondary view separation 001","scenario_hash":"6b4a6476385defe14cc19c1aaff6ba63aada9b59c720bb1ae9ecc67437672a14","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T21:41:42.342844382Z"},{"index":1,"name":"Data Layer secondary view separation 002","scenario_hash":"9b8191001082bd8a123e16025249c26968331230a005f91d473e7fc5f62d90c9","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T21:41:42.342844382Z"}]}
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
    And Live testing controls, target selection, settings, and session timeline are absent from <selected_view> content

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
