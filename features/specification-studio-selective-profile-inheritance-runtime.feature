# mutation-stamp: sha256=a5e32ba8ee7b9d11d4077c0822e87e60d331076ad3f7b59695827f71d5f1781d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-02T10:32:20.860385931Z","feature_name":"Specification Studio selective profile inheritance runtime","feature_path":"features/specification-studio-selective-profile-inheritance-runtime.feature","background_hash":"c1d18a9cc679183993eca176620a733085ecee42d42a913b143962d2e5856bf6","implementation_hash":"sha256:30d3ccaaca54fcb6db73490a4af37d1322ada9dc4343a89b9ed1e03590110e48","scenarios":[{"index":17,"name":"Specification Studio selective profile inheritance runtime 018","scenario_hash":"ff95a31938211a0bd5eab5d8d1b810a00fe5be6bd98fddee1b7deed20faad4dc","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-08-02T10:32:20.860385931Z"},{"index":18,"name":"Specification Studio selective profile inheritance runtime 019","scenario_hash":"28a1f61ceb18afed1eaa2be785b85f919e9bcb74631c39ecb047d23f61756715","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-08-02T10:32:20.860385931Z"},{"index":0,"name":"Specification Studio selective profile inheritance runtime 001","scenario_hash":"26cac4455d76f72179542dbd332d790161db5d1fc944070faaddd7b38edc0dc4","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-31T16:19:26.781074151Z"},{"index":1,"name":"Specification Studio selective profile inheritance runtime 002","scenario_hash":"3dbcc1fc774d5f0021c844246bcce8e8537d72a596150ec6b5f3b4320df5d690","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-31T16:19:26.781074151Z"},{"index":3,"name":"Specification Studio selective profile inheritance runtime 004","scenario_hash":"7416d42cfe1835595af0e5ae59c5542b67d4412997e7102a365bf50d4bdc1950","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-31T16:19:26.781074151Z"},{"index":7,"name":"Specification Studio selective profile inheritance runtime 008","scenario_hash":"07bda448b5b7ead158a705ed40e692b88662c1af84a19c2323a0c2676b1448f0","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-31T16:19:26.781074151Z"},{"index":9,"name":"Specification Studio selective profile inheritance runtime 010","scenario_hash":"e8984ab91dca457a8e4c478c660fceeeea19cbb3323a5a0a9cd6fd908f77bdd1","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-31T16:19:26.781074151Z"},{"index":13,"name":"Specification Studio selective profile inheritance runtime 014","scenario_hash":"be1518394b1e68e2b9e4d94b9c8102ddff1c52c352a2ef80d982d1899dae8fd4","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-31T16:19:26.781074151Z"}]}
# acceptance-mutation-manifest-end

Feature: Specification Studio selective profile inheritance runtime

  Background:
    Given the built extension is running with production Specification Studio and durable project storage
    And production Master is a Shared Profile with hundreds of canonical properties grouped by concepts
    And production Pages, Page Groups, and Events use layered schema compilation

  # Specification Studio selective profile inheritance runtime 001
  Scenario Outline: Specification Studio selective profile inheritance runtime 001
    Given the operator opens production <target>
    When Master is added through the actual Shared Profile source control
    Then durable state contains one inheritance recipe for Master and <target>
    And actual recipe controls select concepts, property branches, and individual properties
    And compiler input contains only the recipe-selected Master contribution before the local target contribution
    And every target kind mounts the same production recipe component

    Examples:
      | target              |
      | Error Page          |
      | Checkout Page Group |
      | Offer Click Event   |

  # Specification Studio selective profile inheritance runtime 002
  Scenario Outline: Specification Studio selective profile inheritance runtime 002
    When the actual Master recipe starts from <starting_point>
    Then rendered and derived initial selection contains <initial_selection>
    And the production review displays its effective property count before commit

    Examples:
      | starting_point    | initial_selection                  |
      | Everything        | every Master property              |
      | Choose concepts   | no property until a concept is chosen |
      | Choose properties | no property until a branch or property is chosen |
      | Start empty       | structural root only               |

  # Specification Studio selective profile inheritance runtime 003
  Scenario: Specification Studio selective profile inheritance runtime 003
    When the installed recipe workspace renders
    Then the ordinary target form contains one compact Master summary card
    And compact starting-point and copy controls precede the installed search and filter toolbar
    And one rendered selection tree nests concept, structural-branch, and property nodes
    And visible checkboxes expose checked, unchecked, and indeterminate states independently of active treeitem and expansion state
    And each rendered parent exposes selected and total descendant counts
    And the sticky action bar exposes effective properties, exclusions, issues, Review selection, Cancel, and Apply inheritance
    And DOM inspection finds no recalculated composition preview or row-by-row effective-property list in the workspace
    And DOM inspection finds no complete inherited-property table inside the ordinary target form

  # Specification Studio selective profile inheritance runtime 004
  Scenario Outline: Specification Studio selective profile inheritance runtime 004
    Given production Master contains concepts page, form, ecommerce, error, and offer
    When actual controls compose <target>
    Then durable recipe selection equals <selection>
    And compiled effective schema contains no unselected Master property

    Examples:
      | target              | selection                                             |
      | Error Page          | all page properties and selected error properties    |
      | Checkout Page Group | all form properties and selected ecommerce and error properties |
      | Offer Click Event   | all offer properties                                  |

  # Specification Studio selective profile inheritance runtime 005
  Scenario: Specification Studio selective profile inheritance runtime 005
    Given the production Error Page recipe selects all concept page and seven fixed error properties
    When a production command adds one page property and one error property to Master
    Then compilation includes the new page property
    And compilation excludes the new error property
    And rendered summary distinguishes synchronized page selection from seven fixed error identities
    And every explicit exclusion remains absent from compiler input

  # Specification Studio selective profile inheritance runtime 006
  Scenario: Specification Studio selective profile inheritance runtime 006
    Given production Master defines object error with code, message, and details descendants
    When actual controls select error and then deselect details
    Then the error control exposes mixed state
    And durable recipe retains code and message while excluding details
    And compiled JSON Schema contains a valid partial error object with no details definition
    And Master canonical bytes remain unchanged

  # Specification Studio selective profile inheritance runtime 007
  Scenario: Specification Studio selective profile inheritance runtime 007
    Given the actual recipe directly selects only /error/message
    When production selection closure runs
    Then compiler input contains /error as a structural dependency and /error/message as a direct selection
    And the message constraint retains every source facet, rule, documentation field, example, and provenance entry
    And rendered counts distinguish the structural container from the direct property
    And validation does not accept an unselected error sibling

  # Specification Studio selective profile inheritance runtime 008
  Scenario Outline: Specification Studio selective profile inheritance runtime 008
    Given selected production error_message has an ordinary rule depending on unselected page_type
    When actual missing-dependency control performs <action>
    Then compiled output has <outcome>
    And durable resolution belongs only to this target recipe
    And Master plus another consumer hashes remain unchanged

    Examples:
      | action                         | outcome                                                   |
      | Include page_type              | original rule and dependency effective                    |
      | Exclude this rule              | inherited error_message without that rule                 |
      | Replace rule for this target   | inherited error_message with one reviewed replacement     |

  # Specification Studio selective profile inheritance runtime 009
  Scenario: Specification Studio selective profile inheritance runtime 009
    Given production Master makes error_message required when page_type equals error
    And production Standalone Error Event selects error_message without page_type
    When the operator excludes the conditional presence rule through its actual control
    Then compiled Event schema contains optional error_message
    And compiled Event schema contains no page_type condition or missing dependency
    And rendered provenance names the Master rule and Event-boundary exclusion
    And compilation for another Page still requires error_message when page_type equals error

  # Specification Studio selective profile inheritance runtime 010
  Scenario Outline: Specification Studio selective profile inheritance runtime 010
    Given production selected inherited rule is <rule_kind>
    When the actual recipe requests <change>
    Then <persisted_result>
    And target storage contains no untracked copy of the source rule

    Examples:
      | rule_kind             | change                   | persisted_result                                               |
      | ordinary validation   | exclude it               | stable source rule identity is recorded as excluded            |
      | ordinary validation   | replace it               | replacement names the stable source rule                       |
      | conditional presence  | replace it with required | target presence is required and source condition is absent     |
      | invariant validation  | exclude or weaken it     | control is unavailable and source invariant is identified      |

  # Specification Studio selective profile inheritance runtime 011
  Scenario: Specification Studio selective profile inheritance runtime 011
    Given production recipe controls have staged selection and rule-resolution changes
    When actual Apply inheritance is confirmed
    Then one durable Draft command stores stable profile, property, and rule identities
    And production recompilation uses the selected source plus local target contribution
    And Cancel writes no recipe or local contribution
    And actual Undo and Redo restore the whole prior and applied recipe
    And serialized recipe bytes contain no copied Master property definitions

  # Specification Studio selective profile inheritance runtime 012
  Scenario: Specification Studio selective profile inheritance runtime 012
    Given a production target has selective Master and Commerce recipes with overlapping properties
    When production selection consequences and compiler output recalculate
    Then existing peer composition determines effective facets and conflicts after source filtering
    And installed Needs attention names both profiles and every conflicting path beside its resolution route
    And committing the recipes preserves an unresolved Draft conflict while compiled readiness remains blocked
    And excluding a source changes resolution only after its actual contribution is removed

  # Specification Studio selective profile inheritance runtime 013
  Scenario: Specification Studio selective profile inheritance runtime 013
    Given production Checkout Page Group has an applied Master recipe
    When its installed schema workspace opens
    Then the Master card renders synchronized concepts, fixed selections, exclusions, rule overrides, and effective count
    And Edit selection restores the complete recipe workspace state
    And effective rows expose Master source, selection reason, local differences, and provenance
    When an actual local override is reset
    Then effective bytes return to the recipe-selected Master definition
    And excluded Master paths remain absent

  # Specification Studio selective profile inheritance runtime 014
  Scenario Outline: Specification Studio selective profile inheritance runtime 014
    Given a durable recipe references a stable Master property or rule
    When a production command performs <source_change>
    Then installed target state shows <target_effect>
    And validation, Test case, documentation, and export projections become stale
    And rendered impact lists added, removed, or changed effective paths before current status returns

    Examples:
      | source_change                                      | target_effect                                             |
      | rename or move of a selected property              | stable selection displays its new path                    |
      | edit of an included non-overridden rule            | current source rule becomes effective                     |
      | edit of an excluded rule                           | exclusion remains attached to the stable rule             |
      | deletion of a pinned selected property             | missing selection repair is displayed                     |
      | new dependency in a live selected property rule    | explicit rule-dependency resolution is required           |

  # Specification Studio selective profile inheritance runtime 015
  Scenario: Specification Studio selective profile inheritance runtime 015
    Given production Error Page has a reviewed Master recipe
    When actual Copy selection from Error Page is used for another target
    Then the destination draft copies concept queries, stable property identities, exclusions, and rule resolutions
    And the installed tree and sticky action bar recalculate target-specific closure, issue count, and effective total
    And the copied recipe is immediately applicable because its dependency closure is complete
    And later durable edits to either recipe leave the other recipe unchanged
    And repository inspection finds no named preset entity

  # Specification Studio selective profile inheritance runtime 016
  Scenario: Specification Studio selective profile inheritance runtime 016
    When the actual recipe workflow is completed at desktop width, 360 CSS pixels, and 200 percent browser zoom using only the keyboard
    Then rendered tree work is bounded and search, expansion, activeElement, selection, and scroll position persist
    And accessibility inspection resolves visible and programmatic names and states for concept, branch, property, dependency, and rule-resolution controls
    And the sticky action bar and Apply inheritance remain reachable with zero horizontal document overflow
    And focus returns to the operated property, dependency, or Master card after every action
    And computed presentation distinguishes selection, mixed state, dependency, conflict, and exclusion without color alone

  # Specification Studio selective profile inheritance runtime 017
  Scenario: Specification Studio selective profile inheritance runtime 017
    Given production concept ecommerce contains object branch product with product_id and product_name
    When the installed inheritance selection tree renders
    Then DOM hierarchy nests product beneath ecommerce and both properties beneath product
    And each parent exposes separate disclosure-button and indeterminate-capable checkbox semantics
    And each leaf renders a checkbox, primary property name, and secondary type and presence
    When actual input selects ecommerce
    Then durable staged state contains synchronized ecommerce and all current descendant identities
    When actual input deselects product_name
    Then computed ecommerce and product checkbox states are indeterminate
    And durable staged state records product_name as an explicit exclusion
    And adding another ecommerce property includes its stable identity in derived selection

  # Specification Studio selective profile inheritance runtime 018
  Scenario Outline: Specification Studio selective profile inheritance runtime 018
    Given production activeElement is on <node_state> in the inheritance selection tree
    When actual keyboard input dispatches <keyboard_action>
    Then installed tree navigation produces <navigation_result>
    And hashes for unrelated checkbox and expansion state remain unchanged

    Examples:
      | node_state         | keyboard_action | navigation_result                                           |
      | a collapsed parent | Right Arrow     | aria-expanded becomes true and aria-checked is unchanged     |
      | an expanded parent | Left Arrow      | aria-expanded becomes false and aria-checked is unchanged    |
      | a visible node     | Down Arrow      | activeElement becomes the next visible treeitem             |
      | a visible checkbox | Space           | only that checkbox and derived ancestor states change       |

  # Specification Studio selective profile inheritance runtime 019
  Scenario Outline: Specification Studio selective profile inheritance runtime 019
    Given the production inheritance tree indexes hundreds of properties
    When installed <discovery_control> matches a property by <criterion>
    Then DOM hierarchy retains the matching property's visible concept and structural ancestors
    And matching ancestors expand without changing durable selection bytes
    And clearing the discovery control restores prior expanded IDs, active property ID, and scroll offset
    When the installed property-details disclosure is activated
    Then it renders full path, description, example, provenance, and rules for only that property

    Examples:
      | discovery_control | criterion       |
      | search            | name            |
      | search            | path            |
      | search            | description     |
      | search            | example         |
      | filters           | concept         |
      | filters           | type            |
      | filters           | presence        |
      | filters           | selection state |

  # Specification Studio selective profile inheritance runtime 020
  Scenario: Specification Studio selective profile inheritance runtime 020
    Given production staged selection has one synchronized concept, one fixed property, one exclusion, one missing rule dependency, and one peer conflict
    When installed selection consequences recalculate
    Then Needs attention renders the missing dependency and peer conflict with operable resolution routes
    And the sticky action bar renders effective total, one exclusion, and two issues
    And Apply inheritance is disabled while missing-rule-dependency count is one
    When actual Review selection disclosure expands
    Then its summary contains synchronized concepts, fixed properties, exclusions, rule resolutions, and issues
    When actual controls resolve the missing dependency
    Then Apply inheritance is enabled and the peer conflict remains visibly Draft-blocking
