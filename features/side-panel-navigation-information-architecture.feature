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
