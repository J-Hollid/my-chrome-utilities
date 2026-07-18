# mutation-stamp: sha256=16928b42fede05bc7dbc9d08b17a36327bd181183dfbb0fac15700350b1947a4
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T01:03:14.412017276Z","feature_name":"Data layer Specification workspace navigation","feature_path":"features/data-layer-specification-workspace-navigation.feature","background_hash":"366d5f7ffd27be9cd74f72eabfa08cd6a822a2732eaba9a117fd03a952c68e52","implementation_hash":"sha256:40132577c403b308cbe1fe606650cadc318a91527a8adcd0474f806b3a767e52","scenarios":[{"index":2,"name":"Data layer Specification workspace navigation 003","scenario_hash":"4e5643d832ad7b8d9ebc85d8ee417c24d226a4dfd250e1057c83dc9d4ce6ecc8","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:14.412017276Z"},{"index":3,"name":"Data layer Specification workspace navigation 004","scenario_hash":"e9f3fcaa91157f8cd800e5c717b32267381e3936b85dedd3807e744d4c0a3cbc","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:14.412017276Z"},{"index":6,"name":"Data layer Specification workspace navigation 007","scenario_hash":"ffa6f5584d3d8018576e73251dcf356515c63fed48dbc1f9b7386fd3719d35b9","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:14.412017276Z"},{"index":7,"name":"Data layer Specification workspace navigation 008","scenario_hash":"1772e1258500fffd8f0439181897159ba97a7ae4e017a5be554a1bc6800584ef","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:14.412017276Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Specification workspace navigation

  Background:
    Given Shop data specification contains profiles, pages, events, applicability sets, flows, fixtures, and releases
    And its full-page Specification Builder is open

  # Data layer Specification workspace navigation 001
  Scenario: Data layer Specification workspace navigation 001
    When the workspace shell is displayed
    Then a persistent project tree exposes Overview, Shared profiles, Pages, Events, Flows, Fixtures, and Releases
    And the selected item opens in the central workspace and contextual inspector
    And a sticky breadcrumb identifies Project, Flow, Step, Event, Profile, and Property when applicable
    And project, environment, draft, release, and autosave state remain visible

  # Data layer Specification workspace navigation 002
  Scenario: Data layer Specification workspace navigation 002
    Given the side panel shows a validation issue for /ecommerce/value
    When the operator opens the issue in Specification Builder
    Then the workspace selects the owning project, flow step, profile, and property
    And the exact failing field is reachable in no more than 2 actions
    And returning to the side panel restores its selected event and scroll position

  # Data layer Specification workspace navigation 003
  Scenario Outline: Data layer Specification workspace navigation 003
    Given the operator selected /ecommerce/value with tree nodes expanded, filter Missing documentation, and scroll position 840 CSS px
    When navigation is interrupted by <navigation_event>
    Then selection, expanded nodes, filter, active view, and scroll position are restored

    Examples:
      | navigation_event        |
      | selecting another flow  |
      | Back then Forward       |
      | workspace reload        |
      | crash recovery          |

  # Data layer Specification workspace navigation 004
  Scenario Outline: Data layer Specification workspace navigation 004
    Given the project index contains <indexed_content>
    When the operator searches globally for <query>
    Then results identify every matching <result_kind> by type and semantic location
    And Where used lists each referencing entity and release
    And selecting a result preserves search and opens its exact source

    Examples:
      | indexed_content                          | query                          | result_kind           |
      | entity named Retail checkout             | Retail checkout                | project entity        |
      | property /ecommerce/transaction_id       | /ecommerce/transaction_id      | property reference    |
      | documentation stating Final order total  | Final order total              | documentation source  |
      | rule named ISO 4217 currency             | ISO 4217 currency              | validation rule       |
      | matcher term /checkout/confirmation      | /checkout/confirmation         | applicability source  |
      | fixture named Trade missing account      | Trade missing account          | fixture               |

  # Data layer Specification workspace navigation 005
  Scenario: Data layer Specification workspace navigation 005
    Given a profile contains local, inherited, overridden, disabled, and conflicting requirements
    When its property outline is displayed
    Then each compact row shows path, type, requirement, origin, issue count, and usage count
    And only the selected row renders editing controls in the inspector
    And inherited branches start collapsed with their effective status visible
    And status does not depend on color alone

  # Data layer Specification workspace navigation 006
  Scenario: Data layer Specification workspace navigation 006
    Given a representative project contains 500 properties and 50 flows
    When the operator searches, filters, selects, and scrolls the project
    Then rendered property and step rows are limited to visible rows plus bounded overscan
    And no operation permanently renders every editor control
    And the fixed benchmark records no interaction task longer than 100 milliseconds
    And the workspace becomes interactive within 2 seconds

  # Data layer Specification workspace navigation 007
  Scenario Outline: Data layer Specification workspace navigation 007
    Given authoring is displayed on <surface>
    When the operator traverses the tree, workspace, and inspector using only the keyboard
    Then <layout_behavior>
    And visible order, focus order, accessible names, and announcements agree

    Examples:
      | surface                   | layout_behavior                                      |
      | 360 CSS px side panel     | one active companion pane has one scroll owner       |
      | 520 CSS px side panel     | one active companion pane has one scroll owner       |
      | 720 CSS px side panel     | one active companion pane has one scroll owner       |
      | full-page workspace       | tree, workspace, and inspector remain persistent     |

  # Data layer Specification workspace navigation 008
  Scenario Outline: Data layer Specification workspace navigation 008
    Given a side-panel authoring sheet is displayed at <width>
    And it contains primary, secondary, overflow, and destructive actions with nested disclosures
    When the operator reviews and traverses the controls
    Then action purpose and hierarchy are distinct through label, placement, and visual treatment without relying on color alone
    And every disclosure name includes its entity or section context
    And the full-height sheet keeps title, context, and actions sticky with one primary scroll owner

    Examples:
      | width      |
      | 360 CSS px |
      | 520 CSS px |
      | 720 CSS px |

  # Data layer Specification workspace navigation 009
  Scenario: Data layer Specification workspace navigation 009
    Given the full-page workspace displays primary, secondary, overflow, and destructive actions with nested disclosures
    When the operator reviews and traverses the controls
    Then action purpose and hierarchy are distinct through label, placement, and visual treatment without relying on color alone
    And every disclosure name includes its entity or section context
    And tree, workspace, inspector, and contextual actions remain persistent
