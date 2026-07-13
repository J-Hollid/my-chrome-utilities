# mutation-stamp: sha256=5b5934b23524bf6530186fe34fc02ff7788718eb15c046efd9075fbf38a7fb5a
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-13T17:00:58.532078258Z","feature_name":"Data layer schema rule editor visibility","feature_path":"features/data-layer-schema-rule-editor-visibility.feature","background_hash":"d7476f6c0a479abd40eb33ab4fcb6fc265ff87e605cf6e60d9e92a56d107c390","implementation_hash":"sha256:5f9153b68df361903af707e0a0749ef9e87d35845300d332e8b2539e2f4bc683","scenarios":[{"index":0,"name":"Data layer schema rule editor visibility 001","scenario_hash":"30890db9896030a28d8bdf57124bbe585e4c835d05d0aecf925991e41b03aac8","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-12T17:04:35.932352157Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema rule editor visibility

  Background:
    Given the Data Layer workspace is displayed

  # Data layer schema rule editor visibility 001
  Scenario Outline: Data layer schema rule editor visibility 001
    Given Data Layer view <view_name> is active
    And no reusable rule editor is open
    When the active view is displayed
    Then Rule configuration is not visible

    Examples:
      | view_name |
      | Live      |
      | Library   |
      | Sessions  |
      | Schemas   |

  # Data layer schema rule editor visibility 002
  Scenario: Data layer schema rule editor visibility 002
    Given the Schema workspace Rule Library subview is displayed
    When the operator opens the reusable rule editor
    Then Rule configuration is visible inside the reusable rule editor
