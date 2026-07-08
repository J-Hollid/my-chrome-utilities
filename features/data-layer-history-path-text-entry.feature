# mutation-stamp: sha256=bfa81d81fc04a90507317f09778fb0233a52c497f8c63ce8866171418ca8f5f6
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-08T22:24:05.668392918Z","feature_name":"Data layer history path text entry","feature_path":"features/data-layer-history-path-text-entry.feature","background_hash":"fd7ebacbadc15551b8070613222c77f8c6313a80e688b998d1c274b10a624d71","implementation_hash":"sha256:cf780bc297094adb76784d842c58a14e35271393af078a3141fb2701792b657f","scenarios":[{"index":0,"name":"Data layer history path text entry 001","scenario_hash":"5d52542582d19dfdec72189018b2d0e523092280ceeb5fb6783c23550732f39b","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-08T22:24:05.668392918Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer history path text entry

  Background:
    Given a repository for project <project_name>
    And the data layer testing settings are opened

  # Data layer history path text entry 001
  Scenario Outline: Data layer history path text entry 001
    When the user enters history array path <history_path> in the path field
    Then the path field value is <history_path>
    And the configured history array path is <history_path>

    Examples:
      | project_name         | history_path             |
      | my-chrome-utilities | test_obj.history         |
      | my-chrome-utilities | some.deep.object.history |
