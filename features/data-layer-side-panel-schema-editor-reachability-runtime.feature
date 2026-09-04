Feature: Data layer side-panel schema editor reachability runtime

  Background:
    Given the built extension is running with production Schema Library and compact editor adapters
    And production Shop has a relationship tree taller than the available Side Panel workspace
    And the selected production schema has enough properties to overflow the editor

  # Data layer side-panel schema editor reachability runtime 001
  Scenario Outline: Data layer side-panel schema editor reachability runtime 001
    Given the installed Side Panel viewport is <panel_width> by <panel_height> CSS pixels
    And installed control <schema_open_action> intersects the visible Schema Library bounds
    When actual controls activate <schema_open_action>
    Then measured editor scroll-viewport bounds are fully inside the visible Side Panel workspace
    And the editor heading and first control intersect those bounds
    And the outer Data Layer workspace has no inaccessible overflow above the editor
    And exactly one editor-route vertical scroll owner has scroll height greater than client height
    When native wheel and Page Down input move through that scroll owner
    Then its vertical scroll position increases
    And every property and final editor action can intersect the scroll-owner bounds
    And document horizontal overflow is zero

    Examples:
      | panel_width | panel_height | schema_open_action        |
      | 360         | 760          | Create schema              |
      | 420         | 900          | Open Saved schema          |
      | 520         | 900          | Open project contributor   |

  # Data layer side-panel schema editor reachability runtime 002
  Scenario: Data layer side-panel schema editor reachability runtime 002
    Given installed Schema tree scroll offset, invoking reference, focus, schema bytes, and project bytes are recorded
    When actual controls open and close the compact Schema editor
    Then the outer Data Layer workspace is again the Schema tree vertical scroll owner
    And its scroll offset equals the recorded value
    And document focus returns to the recorded invoking reference
    And installed schema bytes and project bytes equal their recorded values
