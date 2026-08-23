Feature: Data layer compact reorderable editor controls

  Background:
    Given an ordered editor contains uniquely identified items with existing selection, editing, validation, and save rules
    And the complete order is known independently of any active filter

  # Data layer compact reorderable editor controls 001
  Scenario Outline: Data layer compact reorderable editor controls 001
    Given <surface> shows <item_content> for each item in <ordering_scope>
    When the operator inspects one reorderable item
    Then the item offers one compact Reorder affordance that is its drag handle
    And no persistent paired earlier and later, up and down, or left and right move buttons are present
    And <item_content> retains its existing behavior independently of reordering
    And a move cannot cross <ordering_scope>

    Examples:
      | surface                              | item_content                                  | ordering_scope                       |
      | manual reproduction steps            | step text and add, adjust, and remove actions | the current pathname segment         |
      | Flow documentation properties        | an inclusion checkbox                         | the complete property-column order   |
      | Flow documentation metadata          | an inclusion checkbox                         | the selected metadata-column order   |
      | Flow documentation contexts          | an inclusion checkbox and editable step label | the complete context order           |
      | Documentation Set content choices    | an inclusion checkbox                         | the configured section-kind order    |
      | Documentation concepts               | an inclusion checkbox                         | the complete concept order           |
      | Documentation section outline        | a section-selection action                    | the selected-section order           |
      | composed allowed values              | an editable typed value                       | the current allowed-value draft      |
      | assignment data conditions           | path, type, operator, and comparison controls | the current predicate group          |
      | guided array items                   | the item's nested editable fields             | the current array                     |
      | Page Property Set applications       | applicability, open, and remove controls      | the Page application stack           |
      | specification table columns          | the configured column heading                 | the visible configured columns       |
      | Page Group memberships               | Open Page Group and Remove actions             | the Page membership stack            |
      | canonical and composed property trees | structural editing actions                    | the property's legal structure scope |
      | Rich template blocks                 | block editing actions                          | the template's legal block scope     |

  # Data layer compact reorderable editor controls 002
  Scenario: Data layer compact reorderable editor controls 002
    Given a flat ordered list contains Alpha, Bravo, and Charlie
    And Bravo contains a selected checkbox and an edited text value
    When the operator drags Bravo's Reorder handle after Charlie
    Then the displayed order becomes Alpha, Charlie, Bravo
    And an insertion indicator identified that exact result before the drop
    And Bravo retains its stable identity, selected checkbox, and edited text value
    And operating or selecting content in Bravo never starts a drag
    And Undo move restores Alpha, Bravo, Charlie with the same values

  # Data layer compact reorderable editor controls 003
  Scenario: Data layer compact reorderable editor controls 003
    Given a flat ordered list contains Alpha, Bravo, Charlie, and Delta
    When the operator opens Bravo's Reorder menu while filtering
    Then it offers Move to first, Move one position earlier, Move one position later, Move to last, and Move…
    And every action remains visible while an unavailable boundary action is disabled
    When the operator chooses Move to last
    Then the displayed order becomes Alpha, Charlie, Delta, Bravo
    And the menu closes with focus on Bravo's Reorder trigger in position 4
    And status reports Bravo moved from position 2 to position 4
    And the same move is reversible without dragging

  # Data layer compact reorderable editor controls 004
  Scenario: Data layer compact reorderable editor controls 004
    Given the complete order is Alpha, Bravo, Charlie, Delta
    And a filter shows only Bravo and Delta
    When the operator opens Bravo's Reorder menu
    Then direct dragging is unavailable while the filter is active
    When the operator chooses Move…
    Then the destination dialog identifies Bravo as position 2 of 4
    And it presents Alpha, Charlie, and Delta in complete unfiltered order as before-or-after destinations
    When the operator moves Bravo after Delta
    Then the complete order becomes Alpha, Charlie, Delta, Bravo
    And the filter remains active with Bravo and Delta visible
    And cancelling the destination dialog instead would leave the complete order unchanged

  # Data layer compact reorderable editor controls 005
  Scenario: Data layer compact reorderable editor controls 005
    Given manual reproduction steps 2 and 3 belong to pathname segment /products
    And manual step 4 belongs to pathname segment /checkout
    When the operator opens step 3's Reorder menu
    Then Move one position later is visible and disabled at the /products boundary
    And Move… offers positions only within /products
    And guidance states that reordering stays within /products
    When the operator attempts a destination in /checkout
    Then no move is available and every reproduction step remains unchanged

  # Data layer compact reorderable editor controls 006
  Scenario Outline: Data layer compact reorderable editor controls 006
    Given <surface> contains Alpha, Bravo, and Charlie in that order
    When the operator requests moving Bravo after Charlie from its Reorder menu
    Then the existing impact review describes <affected_outcomes> before persistence
    And cancelling returns focus to Bravo's Reorder trigger with order and project bytes unchanged
    When the operator repeats and confirms the move
    Then one reversible project command stores Alpha, Charlie, Bravo
    And <affected_outcomes> are recomputed under the existing domain rules

    Examples:
      | surface                        | affected_outcomes                                                     |
      | Page Group membership stack    | effective properties, Page instances, compiled targets, and exports   |
      | Page Property Set applications | effective and superseded provenance, properties, and structural rules |

  # Data layer compact reorderable editor controls 007
  Scenario Outline: Data layer compact reorderable editor controls 007
    Given <hierarchy> contains movable item Bravo with children and visible siblings Alpha and Charlie
    When the operator drags Bravo within its visible sibling group
    Then only Bravo's sibling position can change
    When the operator chooses Move… for Bravo
    Then the dialog offers <legal_destination> with an exact before-or-after placement
    And it excludes Bravo and <illegal_destination>
    When the operator confirms a legal destination
    Then Bravo is visible at that destination with its identity and descendants unchanged
    And one inverse move can restore the former hierarchy

    Examples:
      | hierarchy                            | legal_destination                | illegal_destination          |
      | a canonical or composed property tree | another structurally legal parent | every descendant of Bravo    |
      | a Rich template block tree           | a block-accepting parent           | Bravo or a non-container block |

  # Data layer compact reorderable editor controls 008
  Scenario Outline: Data layer compact reorderable editor controls 008
    Given a completed reorder occurs in <surface_kind>
    When the editor applies its existing persistence boundary
    Then <persistence_result>
    And inclusion, edited values, validation, identities, and unrelated project content remain unchanged

    Examples:
      | surface_kind                    | persistence_result                                                              |
      | an unsaved local configuration  | the order remains staged until the existing owning save and Undo move restores it |
      | an ordinary durable workspace   | one reversible project command survives reload                                  |
      | a consequential durable workspace | confirmation precedes one reversible project command                           |

  # Data layer compact reorderable editor controls 009
  Scenario: Data layer compact reorderable editor controls 009
    Given a reorderable item contains its longest supported label and primary controls
    When the ordered editor is shown at 360 CSS pixels wide
    Then its one persistent Reorder trigger remains visible and operable
    And the item content wraps without horizontal page scrolling
    And the menu and destination dialog remain inside the viewport
    And no hidden paired positional controls reserve row space

  # Data layer compact reorderable editor controls 010
  Scenario Outline: Data layer compact reorderable editor controls 010
    Given the <schema_projection> Table contains inherited and locally owned properties
    When the property table renders
    Then the first intrinsic-width Property editor column contains only its existing Property actions button
    And no Reorder trigger, drag handle, or drop target appears in any Table cell
    And Path contains only the complete friendly property path at its agreed combined width
    And every remaining heading, data cell, inline editor, provenance value, and validation state retains its agreed allocation
    And structural movement remains available only from the corresponding Tree or focused Structure editor

    Examples:
      | schema_projection |
      | canonical schema  |
      | composed schema   |

  # Data layer compact reorderable editor controls 011
  Scenario: Data layer compact reorderable editor controls 011
    Given inherited and locally owned sibling properties appear in schema structural editors
    When the operator compares the Tree and focused Structure editor
    Then an inherited property has no Reorder affordance until Override here establishes its local structural identity
    And a locally owned property with no legal destination has no Reorder affordance or drag target
    And a locally owned property with a legal destination has exactly one grip that is its drag handle
    And the item's one movement menu contains at least one enabled legal action
    And the move cannot cross an ownership, sibling, parent, or descendant boundary prohibited by the existing schema rules

  # Data layer compact reorderable editor controls 012
  Scenario: Data layer compact reorderable editor controls 012
    Given Page Property composition contains exactly one applied Property Set
    When the application row renders
    Then no Reorder trigger, movement menu, drag handle, or drop target appears
    When a second Property Set is applied
    Then each application row has exactly one Reorder trigger that is its drag handle
    And each movement menu contains at least one enabled legal action

  # Data layer compact reorderable editor controls 013
  Scenario Outline: Data layer compact reorderable editor controls 013
    Given an actionable reorder control appears at the leading edge of <host_shape>
    When the operator inspects the item at rest
    Then one always-visible vertical six-dot grip represents reordering without visible Reorder text
    And the 16 CSS-pixel grip is centered in a square 44 by 44 CSS-pixel target
    And the target is centered on the host without wrapping or increasing its block size beyond the existing content and target
    And no permanent filled button surface, border, or shadow makes the grip appear bulkier than the host
    When the operator hovers, focuses, or drags from the grip
    Then hover, visible focus, and grab or grabbing feedback clearly identify its current interaction state
    And product themes and forced colors retain the grip and focus indication

    Examples:
      | host_shape                |
      | an ordered list row       |
      | an ordered card           |
      | a structural tree item    |
      | a configured column heading |

  # Data layer compact reorderable editor controls 014
  Scenario Outline: Data layer compact reorderable editor controls 014
    Given an actionable reorder item <actions_menu_state>
    When its drag handle and actions render
    Then the rendered handle is <handle_contract>
    And the movement menu is <movement_menu_contract>
    And the item contains exactly one movement-menu button
    And every non-dragging movement outcome remains available to pointer, keyboard, speech, and assistive-technology users

    Examples:
      | actions_menu_state               | handle_contract                                                      | movement_menu_contract                                                  |
      | has no existing actions menu     | the native button and sole drag handle                                | opened by the grip button                                                 |
      | already has an actions menu      | a non-button drag affordance with no additional focus stop             | the one existing actions menu containing the movement actions             |

  # Data layer compact reorderable editor controls 015
  Scenario Outline: Data layer compact reorderable editor controls 015
    Given a migrated <host_family> contains an actionable item with <primary_content>
    When responsive layout presents the host at the wide and constrained reference widths
    Then its visible ordinal when present, six-dot grip, and <primary_content> share one primary visual row
    And the grip never occupies a standalone full-width row above the content it orders
    And primary text wraps within a flexible content column beside the fixed 44-pixel grip column
    And existing secondary fields, nested content, and trailing actions retain their alignment and behavior
    And the host introduces no horizontal page scrolling

    Examples:
      | host_family                                | primary_content                    |
      | Documentation ordered-choice row           | checkbox and choice label           |
      | Documentation flat export row              | first choice or editable identity   |
      | Documentation outline or Rich block        | section or block identity           |
      | schema structure or allowed-value row      | property or value identity          |
      | Property Set application or Page Group row | application or membership identity |
      | predicate or guided-array row              | first labelled field                |
      | configured specification heading           | heading text                        |
      | defect reproduction row                    | reproduction-step text              |
