# mutation-stamp: sha256=31166ec6898e189626ac470af10e2bfa7e5d9f1544c481bedfe370097abf24bb
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T21:17:18.579257078Z","feature_name":"Data Layer secondary view separation","feature_path":"features/data-layer-secondary-view-separation.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:data-layer-secondary-view-separation-v1","scenarios":[{"index":0,"name":"Data Layer secondary view separation 001","scenario_hash":"0452a656b1c450dd8f94972fedeba8194cd6b98c463bb18ee1a15435b05fe2d7","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-10T21:17:18.579257078Z"}]}
# acceptance-mutation-manifest-end

Feature: Data Layer secondary view separation

  # Data Layer secondary view separation 001
  Scenario Outline: Data Layer secondary view separation 001
    Given the Data Layer section is displayed
    When Data Layer tab <selected_view> is activated
    Then exactly the <selected_view> tab is selected
    And only the <selected_view> panel is visible in Data Layer content
    And the <first_hidden_view> and <second_hidden_view> panels are hidden
    And the Data Layer content is not a combined Library, Sessions, and Schemas view

    Examples:
      | selected_view | first_hidden_view | second_hidden_view |
      | Library       | Sessions          | Schemas            |
      | Sessions      | Library           | Schemas            |
      | Schemas       | Library           | Sessions           |
