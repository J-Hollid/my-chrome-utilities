Feature: Data layer schema property removal

  Background:
    Given schema Page view has current revision 3
    And its working draft is open in the schema editor

  # Data layer schema property removal 001
  Scenario: Data layer schema property removal 001
    When the property tree is displayed
    Then every editable property row has a property-specific Remove property action
    And every inherited property row has an Exclude inherited property action instead
    And neither action is presented as removing a property from the parent schema

  # Data layer schema property removal 002
  Scenario: Data layer schema property removal 002
    Given local leaf property /debug has no attached rules
    When the operator activates Remove property for /debug
    Then /debug is removed immediately from the Page view working draft
    And feedback identifies /debug and offers Undo
    And current revision 3 remains unchanged
    When the operator activates Undo
    Then /debug is restored to its prior tree position with its prior definition

  # Data layer schema property removal 003
  Scenario: Data layer schema property removal 003
    Given local object property /commerce contains descendants /commerce/order/id and /commerce/order/value
    And the subtree has 3 attached rules including reusable rule Order identifier
    When the operator activates Remove property for /commerce
    Then no property or rule changes yet
    And a confirmation identifies /commerce, both descendants, and all 3 affected rule attachments
    And Remove property and Cancel are available
    When the operator activates Cancel
    Then the complete /commerce subtree and its 3 rule attachments remain unchanged

  # Data layer schema property removal 004
  Scenario: Data layer schema property removal 004
    Given the removal confirmation is open for /commerce and its 3 attached rules
    When the operator confirms Remove property
    Then /commerce and all of its local descendants are removed from the working draft
    And property-specific required references and local rule attachments in that subtree are removed
    And reusable rule Order identifier remains unchanged in the Rule Library
    And current revision 3 remains unchanged

  # Data layer schema property removal 005
  Scenario Outline: Data layer schema property removal 005
    Given removing leaf property <removed_property> leaves empty ancestor <ancestor> with origin <ancestor_origin>
    When property removal completes
    Then empty ancestor <ancestor> has outcome <ancestor_outcome>

    Examples:
      | removed_property     | ancestor        | ancestor_origin | ancestor_outcome                |
      | /commerce/order/id   | /commerce/order | manual          | removed from the working draft |
      | /commerce/order/id   | /commerce       | observed        | retained in the working draft  |

  # Data layer schema property removal 006
  Scenario: Data layer schema property removal 006
    Given /page_type is the final property in the Page view working draft
    When the operator removes /page_type
    Then the working draft contains 0 properties
    And Publish revision is blocked with reason Add at least one property
    And Add property remains available
    And current revision 3 remains unchanged

  # Data layer schema property removal 007
  Scenario Outline: Data layer schema property removal 007
    Given local property <removed_property> is selected in tree order <tree_order>
    When the operator removes <removed_property>
    Then keyboard focus moves to <focus_destination>

    Examples:
      | removed_property | tree_order     | focus_destination |
      | /debug           | before /items  | /items             |
      | /items           | after /debug   | /debug             |
      | /page_type       | only property  | Add property       |

  # Data layer schema property removal 008
  Scenario: Data layer schema property removal 008
    Given /debug has been removed from the Page view working draft
    When the side panel reloads and Page view is reopened
    Then /debug remains absent from the working-draft property tree
    And current revision 3 still contains /debug
    When publication review opens
    Then removal of /debug and its removed property-specific constraints is identified
