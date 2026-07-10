# mutation-stamp: sha256=fa43695ce021261031f16a71824284e336ae9ca7adb29ab351b71c2c9bfb1123
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T19:29:19.058780129Z","feature_name":"Side panel navigation information architecture","feature_path":"features/side-panel-navigation-information-architecture.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:side-panel-information-architecture-v3","scenarios":[{"index":3,"name":"Side panel navigation information architecture 004","scenario_hash":"2181bc9f562cd48a8a92b911f2aa5f70944f15927e6e6220e3f7ea61dcf66bb9","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-10T19:29:19.058780129Z"}]}
# acceptance-mutation-manifest-end

Feature: Side panel navigation information architecture

  # Side panel navigation information architecture 001
  Scenario: Side panel navigation information architecture 001
    Given the side panel is displayed at 320 CSS px wide with Data Layer Live active
    When the closed side panel layout is inspected
    Then the readable application header precedes the primary navigation strip
    And the application header is semantically separate from the primary navigation tab list
    And the primary navigation strip contains only Data Layer then Hotkeys in stable order
    And the Data Layer secondary navigation strip follows inside the active Data Layer section
    And the Live view content follows the secondary navigation strip
    And the header, navigation strips, and active view content occupy non-overlapping regions

  # Side panel navigation information architecture 002
  Scenario: Side panel navigation information architecture 002
    Given the primary navigation strip is displayed
    When Data Layer is active
    Then Data Layer and Hotkeys use tab semantics in one tab list
    And exactly Data Layer is exposed and visibly styled as selected
    And the primary navigation strip is visually distinct from a conventional action button
    When the pointer hovers over Hotkeys and keyboard focus moves to Hotkeys
    Then Hotkeys exposes a hover state and a keyboard-focus state
    When Hotkeys is activated
    Then exactly Hotkeys is exposed and visibly styled as selected
    And only Hotkeys section content is visible below the primary navigation strip

  # Side panel navigation information architecture 003
  Scenario: Side panel navigation information architecture 003
    Given Data Layer is active
    When the secondary navigation strip is displayed
    Then Live, Library, Sessions, and Schemas use tab semantics in one tab list
    And exactly Live is exposed and visibly styled as selected
    And the Live view content is visible below the secondary navigation strip
    And the secondary navigation strip is visually distinct from a conventional action button
    And the secondary navigation strip is visually distinct from contextual action buttons
    When the user activates Library
    Then exactly Library is exposed and visibly styled as selected
    And only the Library view content is visible below the secondary navigation strip
    When Hotkeys is active
    Then the Data Layer secondary navigation strip is absent

  # Side panel navigation information architecture 004
  Scenario Outline: Side panel navigation information architecture 004
    Given Data Layer Live is active in context <context>
    When the <action_label> control is displayed
    Then <action_label> is a conventional action button inside the Live view content
    And activating <action_label> performs its contextual operation without switching navigation sections
    And <action_label> is absent from the primary and secondary navigation strips
    And only actions relevant to <context> are displayed in the Live view

    Examples:
      | context                   | action_label  |
      | no active testing session | Start testing |
      | active testing session    | End testing   |
      | no selected target        | Choose target |
      | selected detached target  | Attach target |
      | selected attached target  | Detach target |
