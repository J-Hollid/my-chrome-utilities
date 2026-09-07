# Data layer schema context JSON Schema export runtime 001–006
Feature: Data layer schema context JSON Schema export runtime

  Background:
    Given the built extension runs with its production schema repository and export controls
    And clipboard writes and browser downloads are observed at the production boundaries

  # Data layer schema context JSON Schema export runtime 001
  Scenario Outline: Data layer schema context JSON Schema export runtime 001
    Given <schema_host> is open in <surface> at <width>px
    When the operator opens Export JSON Schema 2020-12 through the installed controls
    Then the preview names that exact schema context and Draft or displayed revision
    And the Studio export control is in the schema header while each existing editor layout retains its other controls
    And Copy JSON and Download JSON are visible and keyboard and pointer operable
    When both actions succeed
    Then the captured texts equal the complete preview and describe that host's effective schema
    And an independent Draft 2020-12 validator accepts the downloaded schema
    And repository content and publication revisions are unchanged

    Examples:
      | schema_host                 | surface           | width |
      | Saved Schema Draft editor   | Side panel        | 360   |
      | Saved Schema revision viewer | Side panel       | 360   |
      | Shared Profile              | Side panel        | 360   |
      | Shared Profile              | Studio            | 1280  |
      | Property Set                | Side panel        | 360   |
      | Property Set                | Studio            | 1280  |
      | Page                        | Side panel        | 360   |
      | Page                        | Studio            | 1280  |
      | Event                       | Side panel        | 360   |
      | Event                       | Studio            | 1280  |
      | Flow Page instance          | Side panel        | 360   |
      | Flow Page instance          | Flow workspace    | 1280  |
      | Event occurrence            | Side panel        | 360   |
      | Event occurrence            | Flow workspace    | 1280  |

  # Data layer schema context JSON Schema export runtime 002
  Scenario Outline: Data layer schema context JSON Schema export runtime 002
    Given the selected Cart Purchase occurrence inherits a closed object requiring String kind, Number amount, and a products array of objects requiring String name
    And currency allows String EUR or USD and is required only when kind equals purchase
    And the occurrence overrides amount minimum to 10 and excludes inherited tracking
    When the installed exporter downloads the complete effective schema
    And the production validator and independent Draft 2020-12 validator validate <payload>
    Then both outcomes are <outcome>
    And validation uses the downloaded schema without extension data or remote schema requests

    Examples:
      | payload                                                                                               | outcome |
      | {"kind":"purchase","amount":10,"currency":"EUR","products":[{"name":"Book"}]}                   | pass    |
      | {"kind":"purchase","amount":9,"currency":"EUR","products":[{"name":"Book"}]}                    | fail    |
      | {"kind":"purchase","amount":10,"products":[{"name":"Book"}]}                                    | fail    |
      | {"kind":"view","amount":10,"products":[{"name":"Book"}]}                                        | pass    |
      | {"kind":"purchase","amount":10,"currency":"EUR","products":[{"name":"Book"},{}]}                | fail    |
      | {"kind":"purchase","amount":10,"currency":"EUR","products":[{"name":"Book"}],"tracking":true} | fail    |
      | {"kind":"purchase","amount":10,"currency":"EUR","products":[{"name":"Book"}],"debug":true}    | fail    |

  # Data layer schema context JSON Schema export runtime 003
  Scenario: Data layer schema context JSON Schema export runtime 003
    Given a focused property edit changes amount from 10 to 20 without confirmation
    When the operator inspects Export JSON Schema 2020-12
    Then export is disabled and explains the unconfirmed property edit
    When the operator confirms through the production editor and its durable save settles
    Then export becomes available without a reload or another save command
    When the operator opens the preview and the inherited schema then changes
    Then Copy JSON and Download JSON cannot use that stale snapshot
    When Refresh export is activated
    Then the preview and both output actions use the new coherent effective schema with amount 20
    And any required compatibility review must be confirmed again

  # Data layer schema context JSON Schema export runtime 004
  Scenario Outline: Data layer schema context JSON Schema export runtime 004
    Given an export preview is current and valid
    When <boundary> rejects the requested operation
    Then no success status is shown
    And an error retains the preview and offers retry
    And <other_action> remains available
    When the same operation succeeds on retry
    Then success status follows the successful boundary result
    And no schema or project write occurred

    Examples:
      | boundary          | other_action  |
      | clipboard write   | Download JSON |
      | browser download  | Copy JSON     |

  # Data layer schema context JSON Schema export runtime 005
  Scenario: Data layer schema context JSON Schema export runtime 005
    Given a schema export contains one unsupported active rule and one compatible rule
    When the installed compatibility review is cancelled
    Then no clipboard write or browser download is observed
    When the operator reopens export and confirms the listed omission
    Then both captured outputs retain the compatible rule and omit the unsupported rule
    And completion reports 1 omitted rule without claiming full validation equivalence
    And the repository still contains both original active rules

  # Data layer schema context JSON Schema export runtime 006
  Scenario: Data layer schema context JSON Schema export runtime 006
    Given the Side panel is 360px wide and a read-only schema has long property names and nested arrays
    When the operator opens export from the keyboard
    Then all export controls remain within the viewport while JSON scrolls inside the preview
    And property filtering and collapsed branches do not remove exported properties
    When the operator closes the preview
    Then focus returns to the invoking control with the original route and schema selection retained
