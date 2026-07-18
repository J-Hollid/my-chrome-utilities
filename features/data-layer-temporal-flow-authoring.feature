# mutation-stamp: sha256=d16f8456f90be54689e9128bac1ef00d49d17ea23f01455d8ff2dcbdef14ff5b
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T01:03:16.287213562Z","feature_name":"Data layer temporal flow authoring","feature_path":"features/data-layer-temporal-flow-authoring.feature","background_hash":"3dbd49d76ab68fcd04039fe06b14293d435970ce49372c09d331b8229830180e","implementation_hash":"sha256:71ceb843406db90b78f9c359cb188ef286e4d0d7adcf58b8aa14dffc6385e652","scenarios":[{"index":2,"name":"Data layer temporal flow authoring 003","scenario_hash":"7957f77405f84901c94674379a8e566a9f128b4ee831ed0b02c37a70b71248f7","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:16.287213562Z"},{"index":4,"name":"Data layer temporal flow authoring 005","scenario_hash":"bd0bfa5291996d873e0158f4f19da1e813d691091e976b9a743bddf44051315f","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:16.287213562Z"},{"index":7,"name":"Data layer temporal flow authoring 008","scenario_hash":"98a501de7535969c1d4017d81c99aa98e2bd28aa119b0d544ae085f86305c11d","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:16.287213562Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer temporal flow authoring

  Background:
    Given Shop data specification contains page Checkout confirmation and event Purchase
    And Specification Builder is open to Flows

  # Data layer temporal flow authoring 001
  Scenario: Data layer temporal flow authoring 001
    When the operator creates flow Retail checkout
    Then an accessible structured step editor supports ordered steps and explicit transitions
    And steps can be optional, repeatable, or bounded by minimum and maximum occurrences
    And branches, joins, entry conditions, exit conditions, and timeouts are available
    And an optional diagram is an overview rather than the primary editor

  # Data layer temporal flow authoring 002
  Scenario: Data layer temporal flow authoring 002
    Given Retail checkout contains Product, optional Upsell, Checkout, and Confirmation steps
    When the operator configures Product as repeatable from 1 through 10 occurrences
    And connects optional Upsell to Checkout through a branch and join
    Then the structured step list states order, optionality, occurrence constraints, transitions, and branch membership
    And unreachable or unjoined paths are identified before save

  # Data layer temporal flow authoring 003
  Scenario Outline: Data layer temporal flow authoring 003
    Given Retail checkout and Trade checkout both finish with Purchase at /checkout/confirmation
    And the final event contains no funnel marker
    And prior steps established the current flow as <flow_name>
    When the confirmation event is evaluated
    Then selected confirmation is <selected_step>
    And effective profiles are <effective_profiles>
    And excluded requirements are <excluded_requirements>

    Examples:
      | flow_name       | selected_step        | effective_profiles                                               | excluded_requirements       |
      | Retail checkout | Retail confirmation  | Sitewide, Commerce, Purchase, Retail confirmation                 | Trade account               |
      | Trade checkout  | Trade confirmation   | Sitewide, Commerce, Purchase, Trade account, Purchase order       | Retail confirmation         |

  # Data layer temporal flow authoring 004
  Scenario: Data layer temporal flow authoring 004
    Given a flow step references named page, event, applicability, and requirement profiles
    When the step is inspected
    Then occurrence policy, transition conditions, effective requirements, and reference provenance are visible together
    And every reference has Where used and impact navigation
    And deleted or missing references block the flow draft

  # Data layer temporal flow authoring 005
  Scenario Outline: Data layer temporal flow authoring 005
    Given a flow instance uses <correlation_mode>
    When <lifecycle_event> occurs
    Then flow-state outcome is <state_outcome>

    Examples:
      | correlation_mode                     | lifecycle_event                      | state_outcome                                  |
      | current browser tab session          | same-tab navigation and reload       | prior matched steps are retained               |
      | current browser tab session          | explicit exit or configured timeout  | the instance is closed                         |
      | configured transaction variable      | a matching event arrives             | the corresponding instance advances            |
      | two equally matching active instances | a shared final event arrives         | ambiguity blocks automatic step selection       |

  # Data layer temporal flow authoring 006
  Scenario: Data layer temporal flow authoring 006
    Given a flow draft contains edited steps, branches, variables, and transitions
    When the operator navigates away, reloads, or recovers after a crash
    Then the complete structured flow draft and selected step are restored
    And one Undo reverses the last complete flow transaction
    And one Redo reapplies the last complete flow transaction
    And no partial transition remains

  # Data layer temporal flow authoring 007
  Scenario: Data layer temporal flow authoring 007
    Given legacy replay sequences contain ordered event pushes
    When compatibility views are displayed
    Then replay remains available as an authoring accelerator
    And it is not labelled a validated flow unless page, event, transition, occurrence, and state semantics are explicitly converted
    And conversion review identifies all missing flow semantics

  # Data layer temporal flow authoring 008
  Scenario Outline: Data layer temporal flow authoring 008
    Given the structured flow editor is displayed on <surface>
    When the operator adds, reorders, branches, and inspects steps using only the keyboard
    Then <surface_behavior>
    And focus, order, occurrence, branch, issue, and selection state are exposed without color

    Examples:
      | surface               | surface_behavior                                      |
      | 360 CSS px side panel | Open in Specification Builder preserves flow context  |
      | full-page workspace   | step list, coverage, and inspector remain available   |

  # Data layer temporal flow authoring 009
  Scenario: Data layer temporal flow authoring 009
    Given temporal runtime validation is disabled for the project environment
    When a structured flow and its coverage are displayed
    Then the flow is labelled Organizational only
    And no current-step, traversal, transition-pass, or journey-validation claim is shown
    And the operator can still author and export the flow structure
