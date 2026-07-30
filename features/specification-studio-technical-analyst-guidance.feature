Feature: Specification Studio technical analyst guidance

  Background:
    Given an operator is actively using a populated Specification Studio
    And technical analyst guidance uses dedicated space outside navigation content when the navigation rail is visible

  # Specification Studio technical analyst guidance 001
  Scenario Outline: Specification Studio technical analyst guidance 001
    Given the Studio navigation rail is visible
    When the Studio presents the technical analyst in the navigation rail
    Then the artwork is anchored at the <horizontal_edge> of its dedicated space
    And its displayed width is <displayed_width> instead of <previous_width>
    And its aspect ratio and transparent background are preserved
    And <unchanged_surface> artwork is unchanged

    Examples:
      | horizontal_edge | displayed_width | previous_width | unchanged_surface     |
      | left            | 6.5rem          | 5.2rem         | no-project start-card |

  # Specification Studio technical analyst guidance 002
  Scenario Outline: Specification Studio technical analyst guidance 002
    Given the Studio navigation rail is visible
    And the Studio has remained visible and active for <elapsed_time>
    And no dialog, menu, or blocking layer is open
    When the hint schedule is evaluated
    Then the hint bubble is <result>

    Examples:
      | elapsed_time                               | result                    |
      | less than 10 seconds after Studio is ready | not shown                 |
      | 10 seconds after Studio is ready            | shown once                |
      | less than 120 seconds after the prior hint  | not shown                 |
      | 120 seconds after the prior hint             | shown once when available |

  # Specification Studio technical analyst guidance 003
  Scenario Outline: Specification Studio technical analyst guidance 003
    Given the guidance scheduler has selected the next hint
    When the current Studio route is <route>
    Then the bubble says <hint>
    And its tail visibly points to the technical analyst
    And it uses a cheesy classic British-comic treatment inspired by Beano and Dandy
    And that treatment has bold irregular ink, cream paper, halftone texture, mustard accent, and playful lettering
    And the hint is not repeated in the same Studio session until every applicable hint has been presented

    Examples:
      | route             | hint                                                                                          |
      | Project overview  | A project with no collection is merely a clipboard with ambitions. Pick one on the left and give the specification somewhere to begin.                              |
      | Shared Profiles   | If Pages keep borrowing the same fields, stop issuing duplicates like raffle tickets. Put them in a Shared Profile and let inheritance do the legwork.               |
      | Pages             | Give each Page its observed page event before polishing the schema. Even a splendid room needs a doorbell before anyone can prove they visited.                       |
      | Flows             | Pages are the rooms; Events are the custard pies. Add the rooms first, then put each splat where it actually happened.                                                 |
      | Documentation     | Refresh the preview after changing a Documentation Set. Yesterday's snapshot is beautifully formatted and completely unaware of today.                               |

  # Specification Studio technical analyst guidance 004
  Scenario Outline: Specification Studio technical analyst guidance 004
    Given timed guidance is currently displayed
    When <event> occurs
    Then the hint bubble is <result>
    And focus remains on the operator's current control
    And focus, project state, revision, and Undo history remain unchanged

    Examples:
      | event                              | result                                 |
      | 10 seconds elapse                  | disappears automatically               |
      | the Studio document becomes hidden | disappears and pauses the hint interval |

  # Specification Studio technical analyst guidance 005
  Scenario Outline: Specification Studio technical analyst guidance 005
    Given the Studio guidance layout is evaluated at <presentation>
    Then the analyst and bubble are <visibility>
    And visible guidance occupies only its dedicated space
    And no navigation item, workspace control, or Inspector control is covered
    And no horizontal page scroll is introduced
    And an automatic hint is a polite advisory announcement
    And reduced-motion presentation uses no entrance or exit animation

    Examples:
      | presentation                          | visibility |
      | 1280 by 900 CSS pixel Studio          | visible    |
      | 200 percent browser zoom              | visible    |
      | narrow Studio with navigation hidden  | hidden     |

  # Specification Studio technical analyst guidance 006
  Scenario Outline: Specification Studio technical analyst guidance 006
    Given the technical analyst is visible as an interactive guidance control
    When <pointer_or_focus_state> applies
    Then the analyst is displayed at <scale>
    And a mustard and ink interaction outline is <outline_state>
    And no border, oval plate, or drop shadow is visible
    And the visual change causes no layout movement or content overlap

    Examples:
      | pointer_or_focus_state               | scale       | outline_state |
      | resting state                        | 100 percent | absent        |
      | pointer hover begins                 | 105 percent | visible       |
      | keyboard focus arrives               | 105 percent | visible       |
      | pointer hover or keyboard focus ends | 100 percent | absent        |

  # Specification Studio technical analyst guidance 007
  Scenario Outline: Specification Studio technical analyst guidance 007
    Given the technical analyst is visible
    When the operator activates him with <activation>
    Then the next unused tip for the current Studio part appears immediately
    And any visible tip is replaced
    And the ordinary hint interval restarts at 120 seconds
    And focus, project state, revision, and Undo history remain unchanged

    Examples:
      | activation |
      | click      |
      | Enter      |
      | Space      |

  # Specification Studio technical analyst guidance 008
  Scenario: Specification Studio technical analyst guidance 008
    Given the analyst's head is on the left
    And a hint bubble is visible to his right
    Then the tail's narrow end begins beside the right side of his head
    And the tail travels rightward and curves downward
    And its wide end joins the left edge of the bubble
    And the complete tail remains inside dedicated guidance space

  # Specification Studio technical analyst guidance 009
  Scenario Outline: Specification Studio technical analyst guidance 009
    Given the page being left has <current_tip_state>
    When the operator changes to a different Studio page
    Then the current bubble is hidden
    And the automatic hint timer restarts at 10 seconds
    And previously presented tip identities remain remembered for the session

    Examples:
      | current_tip_state |
      | no visible tip    |
      | a visible tip     |

  # Specification Studio technical analyst guidance 010
  Scenario Outline: Specification Studio technical analyst guidance 010
    Given the operator is using <studio_part>
    Then that part has at least 5 distinct general tips
    And every tip gives accurate advice specific to that part
    And automatic or requested tips rotate without repetition until that part's pool is exhausted

    Examples:
      | studio_part      |
      | Project overview |
      | Shared Profiles  |
      | Pages            |
      | Page Groups      |
      | Events           |
      | Applicability    |
      | Flows            |
      | Fixtures         |
      | Assignments      |
      | Documentation    |

  # Specification Studio technical analyst guidance 011
  Scenario Outline: Specification Studio technical analyst guidance 011
    Given the pointer or keyboard focus remains on one visible named Studio control for <dwell_time>
    And no dialog, menu, or blocking layer is open
    When control guidance is considered
    Then a control-specific analyst tip is <result>
    And the tip uses the same reserved bubble without moving focus or covering content
    And showing control guidance starts a fresh 120-second wait for ordinary guidance
    And it does not retrigger until the pointer and keyboard focus leave that control

    Examples:
      | dwell_time                               | result      |
      | less than 3 seconds                      | not shown   |
      | 3 seconds of continuous pointer hover    | shown once  |
      | 3 seconds of continuous keyboard focus   | shown once  |

  # Specification Studio technical analyst guidance 012
  Scenario Outline: Specification Studio technical analyst guidance 012
    Given a complete analyst tip has been selected
    When its bubble uses <motion_preference>
    Then visible text presents <output>
    And the interval between successive visible characters is <character_interval>
    And space for the complete final text is reserved before the first character appears
    And replacing, hiding, or navigating away from the tip cancels its active print sequence
    And assistive technology receives the complete tip once rather than each partial string
    And focus, project state, revision, and Undo history remain unchanged

    Examples:
      | motion_preference | output                                   | character_interval |
      | standard motion   | one complete visible character at a time | 20 milliseconds    |
      | reduced motion    | the complete tip immediately              | 0 milliseconds     |

  # Specification Studio technical analyst guidance 013
  Scenario Outline: Specification Studio technical analyst guidance 013
    Given project navigation inventory is <navigation_inventory>
    When the analyst guidance region is laid out
    Then the analyst is anchored at the bottom-left corner of the visible rail
    And his left and bottom insets do not depend on the final navigation button's position
    And navigation items occupy the remaining space above the reserved guidance footer
    And an overflowing navigation list scrolls without moving or covering the analyst
    And the bubble remains to his right without covering navigation content

    Examples:
      | navigation_inventory                       |
      | a short list ending well above the footer  |
      | a long list requiring navigation scrolling |

  # Specification Studio technical analyst guidance 014
  Scenario Outline: Specification Studio technical analyst guidance 014
    Given a non-repeated general tip is selected for <route>
    When the tip is presented automatically or requested from the analyst
    Then it says <hint>
    And it combines accurate route-specific advice with a playful British-comic character flourish
    And it uses the established cream, ink, halftone, mustard, curved-tail, and typewriter presentation
    And no additional tip falls back to a neutral documentation sentence without that character voice

    Examples:
      | route            | hint                                                                                                                                                      |
      | Project overview | Lost an entity in the filing-cabinet jungle? Global search finds it without rearranging a single saved Draft.                                             |
      | Shared Profiles  | Concepts arrange Profile properties into sensible documentation gangs. Validation remains unmoved; it has its own clipboard.                             |
      | Pages            | Path conditions are the Page's doorman: they inspect each observed location and politely—or firmly—decide whether it belongs.                            |
      | Assignments      | Run preflight before testing. Missing targets and tied candidates are easier to catch before they put on matching moustaches.                              |
      | Documentation    | Generate rich copy or Excel only after refreshing the preview. Exporting stale work merely gives yesterday better stationery.                             |

  # Specification Studio technical analyst guidance 015
  Scenario Outline: Specification Studio technical analyst guidance 015
    Given the pointer or keyboard focus dwells for 3 seconds on <control> in <route>
    When the analyst presents control guidance
    Then the analyst delivers <tip>
    And the tip identifies the action, explains its consequence, and says when or why to use it
    And it never says only that the control is available here or can be used here
    And it uses the same comic character, speech bubble, tail, and typewriter behavior as general tips
    When a visible named control has no curated or semantic explanation
    Then no control tip appears instead of fabricated generic guidance

    Examples:
      | route            | control        | tip                                                                                                                                                            |
      | Pages            | Add Page       | Every grand journey needs somewhere for the trouble to begin. Add Page creates a real location before you send it marching onto a Flow.                       |
      | Project overview | Run preflight   | Run preflight before publishing. It is considerably cheaper than discovering a missing target while the brass band is already playing.                       |
      | Project overview | Coverage matrix | The Coverage matrix catches untested properties hiding behind the curtains. Open it when surely something covers that stops sounding scientific.            |
      | Pages            | Undo            | Made a magnificent blunder? Undo rewinds the latest change on this page while the published revision remains safely behind glass.                             |
      | Project overview | Publish release | Publish release turns today's Draft into an immutable revision. Give the review one heroic squint first; even boffins check the parachute.                    |

  # Specification Studio technical analyst guidance 016
  Scenario: Specification Studio technical analyst guidance 016
    Given the approved technical-analyst copy catalogue
    When any general or control-specific tip is presented
    Then its complete text matches its catalogue entry
    And it gives accurate advice about an action, consequence, concept, or useful moment
    And a situation-specific comic image, escalation, personification, or punchline is integral to that advice
    And it speaks as the same cheerful, overconfident specification detective
    And a prefixed exclamation without an integral comic device cannot satisfy the character voice
    And its humour is warm, workplace-safe, and never mocks the operator
    And its complete text is at most 180 characters

  # Specification Studio technical analyst guidance 017
  Scenario Outline: Specification Studio technical analyst guidance 017
    Given the approved catalogue contains the <route> general-tip pool
    Then the pool retains at least 5 distinct tips
    And its distinct advice collectively covers <topics>
    And no topic is replaced by another wording of advice already present in that pool

    Examples:
      | route            | topics                                                                                          |
      | Project overview | collection selection, project context, global search, preflight, and Inspector                  |
      | Shared Profiles  | reusable fields, canonical authoring, Saved Schema adoption, concepts, and closed fields        |
      | Pages            | observed event, path conditions, Page Group order, Shared Profiles, and effective schema        |
      | Page Groups      | membership, conditions, inherited fields, contribution order, and conflict repair               |
      | Events           | observed name, observation source, payload target, Page and Flow use, and canonical contributors |
      | Applicability    | priority, observable conditions, fallback, overlap preflight, and Assignment selection          |
      | Flows            | Page insertion, Page frames, Event containment, relationships, and Documentation refresh        |
      | Fixtures         | observations, expected outcomes, context, guided validation, and advisory coverage              |
      | Assignments      | Event selection, Applicability, contributor target, priority, and preflight                     |
      | Documentation    | preview refresh, section selection, concepts, theme save, and export                            |

  # Specification Studio technical analyst guidance 018
  Scenario: Specification Studio technical analyst guidance 018
    Given Add Page, Run preflight, Coverage matrix, Undo, and Publish release have curated control guidance
    When the catalogue is replaced with its comic rewrite
    Then all 5 controls retain control-specific guidance
    And every prior general-tip topic remains represented on its original Studio route
    And timing, rotation, dwell, session history, presentation, and accessibility behavior remain unchanged
