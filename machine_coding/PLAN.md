# Machine Coding — Solve Plan

A deliberate order. Each step introduces **one new skill** and reuses the previous ones, so difficulty ramps smoothly. We won't do all 33 in sequence — we do a **14-problem core path** that covers every major modeling challenge and pattern combo, then the rest are themed extra practice.

**How we run each problem (interview simulation):**
- You drive: requirements → entities → relationships → enums → patterns (justify each) → code → driver.
- I play interviewer: probe your choices, drop a **curveball requirement** mid-design, then review your code.
- Definition of done: runs, exercises happy path + one failure, classes are single-responsibility, no `switch`-on-type where polymorphism belongs.

Solutions go in `solutions/<problem-name>/`.

---

## The Core Path (do these in order)

| # | Problem | New skill it introduces | Patterns in play | Status |
|---|---------|-------------------------|------------------|--------|
| 1 | **parking-lot** | Entity modeling from a prompt; the "nouns→classes, verbs→methods" reflex | Factory, Strategy (fee), Singleton | ✅ |
| 2 | **vending-machine** | A clean, isolated **State machine** (the pattern in its purest form) | State | ☐ |
| 3 | **atm** | State machine + delegating a sub-task down a chain | State, Chain of Responsibility (cash) | ☐ |
| 4 | **tic-tac-toe** | Modeling a **game**: board, players, turn loop, win-detection | Strategy (win-check), State (turn) | ☐ |
| 5 | **snake-and-ladder** | Game loop with injected randomness; board-with-rules | Strategy (dice), simple entities | ☐ |
| 6 | **elevator-system** | Harder state machine + a **scheduling algorithm** + notifying displays | State, Strategy (scheduling), Observer | ☐ |
| 7 | **logging-framework** | A rich **pattern combo** in one small design | Chain of Responsibility (levels), Singleton, Strategy (format), Observer (sinks) | ☐ |
| 8 | **lru-cache** | Pure **data-structure design** (no patterns) — hashmap + doubly linked list, O(1) ops | — | ☐ |
| 9 | **splitwise** | A **graph of relationships** (who owes whom) + swappable algorithms | Strategy (equal/exact/%), Observer | ☐ |
| 10 | **movie-ticket-booking-system** | **Concurrency**: seat locking / double-booking prevention | Factory, Observer, Singleton, State (seat) | ☐ |
| 11 | **library-management-system** | CRUD-heavy modeling; many entities & their lifecycles | Factory, State (book), Strategy (fine) | ☐ |
| 12 | **chess-game** *(capstone)* | Big design: many interacting rules; **undo** | Strategy (per-piece moves), State (phase), Memento (undo), Factory | ☐ |
| 13 | **ride-sharing-service** | Real-world lifecycle + **matching/pricing** engines | Strategy (match/price), Observer (track), State (ride) | ☐ |
| 14 | **online-stock-brokerage-system** | **Observer at scale** + multiple order types | Observer (price/order), Strategy (order types), State | ☐ |

> After these 14 you'll have hit: entity modeling, state machines, game loops, scheduling, concurrency, graphs of relationships, data-structure design, undo/memento, matching engines, and observer-at-scale. That's the full surface area interviews probe.

---

## Extra practice (by theme, after the core path)

Pick from these to reinforce a specific muscle. Most reuse skills from the core path.

- **State-machine reps:** coffee-vending-machine, traffic-signal
- **Booking/reservation systems:** concert-ticket-booking-system, hotel-management-system, car-rental-system, airline-management-system, restaurant-management-system, course-registration-system
- **Observer / feed / real-time:** pub-sub-system, cricinfo, online-auction-system, stack-overflow
- **Large product designs:** online-shopping-service, food-delivery-service, music-streaming-service, linkedin, social-networking-service
- **Workflow / transactions:** task-management-system, digital-wallet-service

---

## Progress log
_(update as we go)_

- 2026-08-21 — Plan created. Patterns (all 16, Tier 1 + Tier 2) completed. Starting core path next.
- 2026-08-21 — #1 parking-lot DONE. Clean modular design: Ticket/ParkingSession owns vehicle↔spot link (no bidirectional refs), Level keeps O(1) free-count map per type, Singleton lot, Spot parameterized by type, Entry/Exit gates. Fixed: made the lot-full failure path visible + guarded exit against null session. Open polish (not blocking): redundant has_free_spot+assign_spot double-check, no spot ids, O(n) scan to locate the free spot.
