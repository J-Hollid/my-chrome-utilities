Feature: Data layer compact reorderable editor controls runtime

  Background:
    Given the built extension is running with production editor, repository, history, pointer, keyboard, and accessibility adapters
    And production ordered records have stable item identities and a complete canonical order

  # Data layer compact reorderable editor controls runtime 001
  Scenario Outline: Data layer compact reorderable editor controls runtime 001
    Given actual navigation opens <installed_surface>
    When DOM inspection examines one <ordered_item>
    Then exactly one visible button is its Reorder trigger and drag handle
    And its accessible name contains the item label, current position, and set size
    And the original <primary_controls> remain independently operable
    And no persistent paired positional buttons occur in the item

    Examples:
      | installed_surface                         | ordered_item                 | primary_controls                              |
      | the defect reproduction composer          | manual step                  | add, adjust, and remove                       |
      | Flow table documentation configuration    | property row                 | inclusion checkbox                            |
      | Flow table documentation configuration    | metadata row                 | inclusion checkbox                            |
      | Flow table documentation configuration    | context row                  | inclusion checkbox and step-label input       |
      | Documentation Set Build                   | content-choice row           | inclusion checkbox                            |
      | Documentation Set content                 | concept row                  | inclusion checkbox                            |
      | the Documentation Set outline             | section row                  | section-selection button                      |
      | the Rich template editor                  | block item                   | block editor actions                          |
      | the canonical property editor             | structural property          | structural editor actions                     |
      | the composed property editor              | structural property          | structural editor actions                     |
      | the composed allowed-values editor        | allowed-value row            | typed-value input and remove                  |
      | Page Property Set applications            | application row              | applicability select, open, and remove        |
      | assignment data conditions                | predicate row                | path, type, operator, comparison, and remove  |
      | the guided array editor                   | array-item group             | nested item fields and remove                 |
      | specification table column customization  | column heading               | column selection                              |
      | Page Group memberships                    | membership row               | Open Page Group and Remove                    |

  # Data layer compact reorderable editor controls runtime 002
  Scenario: Data layer compact reorderable editor controls runtime 002
    Given an installed flat list contains Alpha, Bravo, and Charlie
    When accessibility inspection examines Bravo's Reorder trigger
    Then it is a type button menu button named Reorder Bravo, position 2 of 3
    And its expanded state and controlled menu identity reflect whether the menu is open
    And the ordered container and items expose list, item, label, position, and set-size semantics
    And no item or trigger uses aria-grabbed
    And only the Reorder trigger owns drag initiation while Bravo's interactive row body is not draggable

  # Data layer compact reorderable editor controls runtime 003
  Scenario: Data layer compact reorderable editor controls runtime 003
    Given installed Bravo contains a checked checkbox and an input value edited
    When pointer events drag Bravo's handle from position 2 to the insertion target after Charlie
    Then the production reorder callback receives Bravo's stable identity and destination position 3
    And a visible drop indicator precedes the committed drop at that target
    And rerendered production state orders Alpha, Charlie, Bravo
    And Bravo's checkbox and input retain checked and edited
    And pointer events on the checkbox, input, label, and row body invoke no drag callback
    When production Undo is invoked
    Then the exact prior order returns without changing either control value

  # Data layer compact reorderable editor controls runtime 004
  Scenario: Data layer compact reorderable editor controls runtime 004
    Given keyboard focus is on Bravo's installed Reorder trigger at position 2 of 4
    When Space opens the menu and keyboard controls choose Move to last
    Then the menu follows menu-button focus, arrow, Home, End, Enter, and Escape behavior
    And one production reorder callback moves Bravo to position 4
    And focus resolves by Bravo's stable identity to its rerendered Reorder trigger
    And the polite live region announces Bravo moved from position 2 to position 4
    And click or tap can invoke every movement outcome without a dragging movement

  # Data layer compact reorderable editor controls runtime 005
  Scenario: Data layer compact reorderable editor controls runtime 005
    Given production order is Alpha, Bravo, Charlie, Delta while an installed filter renders Bravo and Delta
    When actual controls open Bravo's Reorder menu
    Then drag initiation is disabled and Move… remains enabled
    When actual controls open Move…
    Then a labelled modal dialog receives focus and reports current position 2 of 4
    And its destination controls derive from Alpha, Charlie, and Delta in canonical unfiltered order
    And Escape or Cancel closes the dialog, restores focus to Bravo's trigger, retains the filter, and invokes no reorder callback
    When actual controls reopen the dialog and move Bravo after Delta
    Then the canonical order becomes Alpha, Charlie, Delta, Bravo while the filter remains active

  # Data layer compact reorderable editor controls runtime 006
  Scenario Outline: Data layer compact reorderable editor controls runtime 006
    Given production <hierarchy> contains Bravo, its descendants, and legal sibling and parent destinations
    When actual drag controls move Bravo within its rendered siblings
    Then the command changes only sibling order
    When actual Move… controls inspect every destination
    Then <legal_targets> are enabled
    And Bravo, its descendants, and <illegal_targets> are absent or disabled
    When actual controls confirm one enabled destination
    Then repository inspection finds one reversible move with Bravo visible under its new parent
    And stable identities, descendant order, and unrelated hierarchy hashes remain unchanged

    Examples:
      | hierarchy                | legal_targets                                | illegal_targets       |
      | canonical property tree  | structurally valid parents and sibling edges | inherited-only parents |
      | composed property tree   | locally ownable parents and sibling edges    | unowned destinations   |
      | Rich template block tree | block-accepting parents and sibling edges     | non-container blocks   |

  # Data layer compact reorderable editor controls runtime 007
  Scenario Outline: Data layer compact reorderable editor controls runtime 007
    Given installed <consequential_surface> orders Alpha, Bravo, Charlie
    When actual Reorder controls request Bravo after Charlie
    Then the existing production impact review opens before the repository is called
    And Cancel invokes no repository write and restores focus to Bravo's Reorder trigger
    When actual controls repeat and confirm the move
    Then exactly one production transaction stores Alpha, Charlie, Bravo
    And Undo and reload prove the existing <domain_evidence> behavior is conserved

    Examples:
      | consequential_surface         | domain_evidence                                                  |
      | Page Group memberships        | composition, compiled-target, and stale-export impact             |
      | Page Property Set applications | effective and superseded provenance and structural-conflict rules |

  # Data layer compact reorderable editor controls runtime 008
  Scenario Outline: Data layer compact reorderable editor controls runtime 008
    Given an installed reorderable item is shown at <viewport>
    When browser geometry and computed styles inspect the item, menu, and Move… dialog
    Then the Reorder trigger's pointer target is at least 44 by 44 CSS pixels
    And every menu and dialog action is operable without overlapping another target
    And <layout_result>
    And the document has no horizontal overflow

    Examples:
      | viewport                         | layout_result                                                        |
      | 360 CSS pixels wide              | item content wraps while the Reorder trigger remains visible          |
      | 1280 CSS pixels wide             | item content and the Reorder trigger use one compact row where possible |
      | 320 CSS pixels at 400 percent text zoom | menu and dialog content reflow inside the visible viewport       |

  # Data layer compact reorderable editor controls runtime 009
  Scenario: Data layer compact reorderable editor controls runtime 009
    Given every migrated installed surface contains at least three reorderable items
    When source and DOM inventories inspect its persistent positional controls
    Then no visible Move earlier and Move later, Move up and Move down, or Move left and Move right pair remains
    And each surface invokes its existing domain reorder operation through the shared interaction contract
    And no reorder changes inclusion, edited values, validation, stable identity, or unrelated stored bytes
