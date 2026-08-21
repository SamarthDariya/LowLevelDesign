# How To Approach a Machine-Coding Problem

Reread this before each problem. The three skills below are *method, not talent* — they
are the difference between "I stared at the prompt and blanked" and "I had a design in 10 minutes."

---

## The 5-phase loop (interview simulation)

1. **Requirements** — restate the prompt in your own words; ask clarifying questions *before* designing.
2. **Design out loud** — entities → relationships → enums → patterns (justify each) → key method signatures.
3. **Curveball** — a new requirement mid-design; a good design absorbs it as a pure addition.
4. **Code** — one file, skeleton-first, core flow + a driver (happy path + one failure).
5. **Review** — run it; check SRP, no switch-on-type, no leaked mutable state, failure paths handled.

**Rough timebox (45-min interview):** ~15 min design · ~25 min code · ~5 min test.

---

## Skill 1 — Extracting entities (don't go by gut)

Gut gives you the *obvious* nouns and misses the *conceptual* ones. Do this on paper, every time:

1. **Underline every noun** in the requirements → candidate classes.
2. **Underline every verb** → candidate methods. Then for each verb ask:
   **"does this action produce a record that outlives the call?"**
   → *assign/release, book, borrow, order, split, reserve* all do →
   **that is where the hidden entity lives.**
3. **For each pair of entities:** "what's the relationship, and *who owns the link*?"
   → catches bidirectional-reference smells; the link usually wants its own object.
4. **List the enums** (fixed sets → types, statuses, directions).

> **The #1 miss:** a *transient relationship between two long-lived things almost always
> deserves its own object.* The requirement rarely names it — you infer it from a verb.
> Same insight every time:
> **Parking Ticket · Splitwise Expense · Movie Booking · Library Loan · Order · Reservation.**

---

## Skill 2 — Recurring LLD decisions (so you need less help over time)

LLD problems reuse ~10 core decisions. Once you've *seen* each, it transfers. Running list:

- [ ] **Transient relationship → its own entity** (Ticket / Session / Booking / Loan / Order / Expense).
- [ ] **Avoid bidirectional references** — one object owns the link; don't make A→B *and* B→A (they drift).
- [ ] **Don't put session/transaction state on a long-lived entity** — a `Vehicle` shouldn't know its spot; a `Session` should. (SRP)
- [ ] **Atomic "find-and-reserve"** for shared resources — find + claim in ONE guarded operation (seats, spots, inventory). Splitting find from claim reopens a race.
- [ ] **O(1) availability** — keep a running count/map, updated on change; don't rescan on every query.
- [ ] **Parameterize variants that differ only by a value** — one `Spot(type)` / `NoteHandler(denom)`, not a subclass each.
- [ ] **Handle the failure path visibly** — full / not-found / invalid input; guard downstream against null.
- [ ] **Pick a pattern only under real pressure** — varying algorithm → Strategy; self-transitioning object → State;
      complex/varying creation → Factory; live updates → Observer. No pressure → no pattern (over-engineering is a red flag).

_(Add to this list after every problem.)_

---

## Skill 3 — Coding faster

What slowed problem #1, and the fix for each:

- **Designed while coding → thrashing.**
  **Fix:** lock the blueprint FIRST (class names + key method signatures as a table). Then coding is just *transcription*.
- **9 files with import/export wiring → slow + module errors.**
  **Fix:** in a timed interview, use **ONE file, multiple classes.** No imports, no export wiring.
  (File-per-class is production hygiene, not interview speed.)
- **Perfecting one class before moving on.**
  **Fix — skeleton first:** write ALL class declarations with empty method stubs top-to-bottom, then fill in.
  You see the whole shape early and stop polishing prematurely.
- **No timebox.**
  **Fix:** use the 15/25/5 budget above; notice when you're behind.

---

## Pre-flight checklist (glance before you start coding)

- [ ] Restated the prompt + asked clarifying questions
- [ ] Did the noun/verb extraction — including "which verb produces a record?"
- [ ] Listed entities, enums, and who-owns-each-relationship
- [ ] Named patterns *and justified each* (or justified NOT using one)
- [ ] Wrote the blueprint (class + method signatures) BEFORE typing
- [ ] Coding in one file, skeleton-first
- [ ] Driver exercises happy path + one failure
