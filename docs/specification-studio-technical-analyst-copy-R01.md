# Specification Studio technical analyst copy R01

## Character

The technical analyst is a cheerful, overconfident specification detective. He
treats routine data-layer work as a heroic investigation involving clipboards,
magnifying glasses, improbable machinery, and avoidable public embarrassment.
The joke must illuminate the real advice. A British-comic exclamation may appear,
but never substitutes for a comic premise, image, escalation, personification, or
punchline.

Every entry below is authoritative exact copy, remains workplace-safe, never mocks
the operator, and is no longer than 180 characters.

## General tips

### Project overview

| Identity | Topic | Exact text |
| --- | --- | --- |
| project-overview | Collection selection | A project with no collection is merely a clipboard with ambitions. Pick one on the left and give the specification somewhere to begin. |
| project-overview-context | Project context | Set the project context before the cast arrives. One measurement purpose keeps every collection reading from the same gloriously sensible script. |
| project-overview-search | Global search | Lost an entity in the filing-cabinet jungle? Global search finds it without rearranging a single saved Draft. |
| project-overview-validate | Preflight | Run preflight before publishing. It is considerably cheaper than discovering a missing target while the brass band is already playing. |
| project-overview-inspector | Inspector | Keep the Inspector open when a selected part looks suspicious. It is a magnifying glass with less chance of setting the desk alight. |

### Shared Profiles

| Identity | Topic | Exact text |
| --- | --- | --- |
| shared-profiles | Reusable fields | If Pages keep borrowing the same fields, stop issuing duplicates like raffle tickets. Put them in a Shared Profile and let inheritance do the legwork. |
| shared-profiles-canonical | Canonical authoring | Author each reusable property once in the canonical Profile. Clones seem efficient until they grow moustaches and disagree. |
| shared-profiles-library | Saved Schema adoption | Adopt a published Saved Schema when lineage matters. It keeps the family tree attached, including the branch everyone insists is not theirs. |
| shared-profiles-concepts | Concepts | Concepts arrange Profile properties into sensible documentation gangs. Validation remains unmoved; it has its own clipboard. |
| shared-profiles-policy | Closed fields | Only defined fields shuts the schema gate to surprise extras. Inherited policy still has a key, because bureaucracy loves hierarchy. |

### Pages

| Identity | Topic | Exact text |
| --- | --- | --- |
| pages | Observed event | Give each Page its observed page event before polishing the schema. Even a splendid room needs a doorbell before anyone can prove they visited. |
| pages-location | Path conditions | Path conditions are the Page's doorman: they inspect each observed location and politely—or firmly—decide whether it belongs. |
| pages-groups | Property Set order | Order Property Set memberships deliberately. Otherwise their schema contributions arrive like five inspectors all claiming the same chair. |
| pages-profiles | Shared Profiles | Attach a Shared Profile when a Page needs reusable fields. Copying them by hand only breeds tiny paperwork rebellions later. |
| pages-schema | Effective schema | Review the effective Page schema before adding a local override. Magnify first, meddle second; the ancestors may already have done the work. |

### Property Sets

| Identity | Topic | Exact text |
| --- | --- | --- |
| page-groups-membership | Membership | Group Pages that share applicability or schema contributions. It is a club with useful paperwork, not matching blazers. |
| page-groups-conditions | Conditions | Property Set conditions decide where the shared contribution applies. Make them observable; crystal balls produce dreadful test evidence. |
| page-groups-schema | Inherited fields | Keep shared fields canonical at the group level so member Pages inherit one story instead of exchanging contradictory telegrams. |
| page-groups-order | Contribution order | Reorder group contributions only after checking affected Pages and Flow instances. Moving one chair can upset the entire schema orchestra. |
| page-groups-repair | Conflict repair | When contributions quarrel, open the named Property Set from the evidence. Repair the culprit, not every innocent bystander in the corridor. |

### Events

| Identity | Topic | Exact text |
| --- | --- | --- |
| events-name | Observed name | Give the Event its exact production name. Aliases are charming at parties and catastrophic when the observer is taking attendance. |
| events-source | Observation source | Choose the source that truly carries this Event. Listening at the wrong pipe produces silence, confusion, and an unnecessarily stern clipboard. |
| events-target | Payload target | Set the payload target before wiring Assignments. Otherwise the data arrives heroically with nowhere to put its hat. |
| events-pages | Page and Flow use | Associate interaction Events with the Pages and Flows where they occur. Context keeps the custard pie attached to the correct scene. |
| events-schema | Canonical contributors | Refine Event data through canonical contributors instead of duplicating properties. One trustworthy witness beats a chorus of improvisers. |

### Applicability

| Identity | Topic | Exact text |
| --- | --- | --- |
| applicability-priority | Priority | Order Applicability Sets deliberately; higher matches speak first. Without priority, every candidate lunges for the same megaphone. |
| applicability-conditions | Observable conditions | Build conditions from observable, type-compatible data. The engine understands evidence, not meaningful eyebrow movements. |
| applicability-fallback | Fallback | Keep one truthful fallback for observations matching nothing specific. Every mystery needs a sensible exit, preferably not through the shrubbery. |
| applicability-overlap | Overlap preflight | Run preflight for overlapping Applicability Sets. Two winners are not twice as correct; they are one argument wearing two hats. |
| applicability-assignments | Assignment selection | Use Applicability Sets to steer Assignments toward the right contributor. It is traffic control for data, minus the tiny fluorescent jacket. |

### Flows

| Identity | Topic | Exact text |
| --- | --- | --- |
| flows | Page insertion | Pages are the rooms; Events are the custard pies. Add the rooms first, then put each splat where it actually happened. |
| flows-frames | Page frames | Use Page frames to show where each journey step occurs. A loose Event on the carpet is evidence, but not the helpful sort. |
| flows-occurrences | Event containment | Place each Event occurrence inside its owning Page frame and state its obligation. Containment keeps the plot from wandering off at intermission. |
| flows-relationships | Relationships | Connect Page frames to Page frames. Events belong inside them; asking an Event to become a road sign is above its pay grade. |
| flows-documentation | Documentation refresh | Refresh Documentation after changing a selected Flow. The old value map is loyal, polished, and confidently describing yesterday. |

### Fixtures

| Identity | Topic | Exact text |
| --- | --- | --- |
| fixtures-observations | Observations | Capture representative observations for the path you mean to test. One heroic sample cannot impersonate the entire visiting public. |
| fixtures-expected | Expected outcomes | Record the expected outcome, not merely the raw sample. Evidence without an expectation is just data loitering near a clipboard. |
| fixtures-context | Context | Link each Fixture to the Page, Event, and Flow it demonstrates. Context tells the detective which room contains the footprint. |
| fixtures-guided | Guided validation | Use guided validation to compare a Fixture with the compiled specification. Let the machinery argue with the evidence while you supervise. |
| fixtures-warning | Advisory coverage | Incomplete Fixture coverage is advisory, not a schema blockade. It waves a small warning flag; canonical validation still guards the gate. |

### Assignments

| Identity | Topic | Exact text |
| --- | --- | --- |
| assignments-event | Event selection | Choose the observed Event before mapping its Assignment. Even the finest parcel needs a name on the label. |
| assignments-applicability | Applicability | Select an Applicability Set that yields one clear context. Ambiguity is simply two confident ushers pointing at different seats. |
| assignments-target | Contributor target | Point the Assignment at the contributor that owns the schema. Data dislikes being delivered to a building marked Probably Here. |
| assignments-priority | Priority | Use priority only to settle otherwise valid competing candidates. It is a tie-breaker, not a ceremonial crown for your favourite. |
| assignments-preflight | Preflight | Run preflight before testing. Missing targets and tied candidates are easier to catch before they put on matching moustaches. |

### Documentation

| Identity | Topic | Exact text |
| --- | --- | --- |
| documentation | Preview refresh | Refresh the preview after changing a Documentation Set. Yesterday's snapshot is beautifully formatted and completely unaware of today. |
| documentation-sections | Section selection | Select only the sections this audience needs. A document containing everything is a cupboard falling open, not a briefing. |
| documentation-concepts | Concepts | Order and include Concepts to keep grouped tables consistent. Otherwise the headings queue like shoppers who have spotted a second till. |
| documentation-theme | Theme save | Save the project-local theme before refreshing the preview. Unsaved branding is just a splendid waistcoat left on the chair. |
| documentation-export | Export | Generate rich copy or Excel only after refreshing the preview. Exporting stale work merely gives yesterday better stationery. |

## Control-specific tips

| Route | Control | Exact text |
| --- | --- | --- |
| Pages | Add Page | Every grand journey needs somewhere for the trouble to begin. Add Page creates a real location before you send it marching onto a Flow. |
| Project overview | Run preflight | Run preflight before publishing. It is considerably cheaper than discovering a missing target while the brass band is already playing. |
| Project overview | Coverage matrix | The Coverage matrix catches untested properties hiding behind the curtains. Open it when surely something covers that stops sounding scientific. |
| Pages | Undo | Made a magnificent blunder? Undo rewinds the latest change on this page while the published revision remains safely behind glass. |
| Project overview | Publish release | Publish release turns today's Draft into an immutable revision. Give the review one heroic squint first; even boffins check the parachute. |
