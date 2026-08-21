# Machine Coding — LLD Problems

Problem statements from [awesome-low-level-design](https://github.com/ashishps1/awesome-low-level-design/tree/main/problems).
Requirements live in [`problems/`](problems/). Write your solutions in `solutions/<problem-name>/` (JS, same style as `../DesignPatterns/`).

**How to practice each one** (interview-style):
1. Read the requirements. Restate them in your own words.
2. **Identify entities** (nouns → classes) and **actions** (verbs → methods).
3. Call out the **enums** and **relationships** (composition vs aggregation).
4. Decide **which patterns** fit *before* coding — justify each.
5. Code the core flow, then the edge cases. Keep classes single-responsibility.
6. Write a small `main`/driver that exercises the happy path + one failure.

---

## Recommended order (easiest → hardest)

### Tier A — Warm-ups (state machines, basic modeling)
Do these first; they cement entity-modeling and the State/Strategy/Singleton reflexes.

| Problem | Primary patterns to reach for |
|---|---|
| [vending-machine](problems/vending-machine.md) | **State** (idle/hasMoney/dispensing), Strategy |
| [coffee-vending-machine](problems/coffee-vending-machine.md) | **State**, Factory, Builder (recipe) |
| [atm](problems/atm.md) | **State** (card/pin/txn), Chain of Responsibility (cash dispense) |
| [tic-tac-toe](problems/tic-tac-toe.md) | Strategy (win-check), State (turn/phase) |
| [snake-and-ladder](problems/snake-and-ladder.md) | Strategy (dice), simple entities |
| [traffic-signal](problems/traffic-signal.md) | **State** (red/green/yellow), Observer |
| [parking-lot](problems/parking-lot.md) | **Factory** (vehicle/spot), Strategy (fee/allocation), Singleton |
| [elevator-system](problems/elevator-system.md) | **State**, Strategy (scheduling), Observer (floor displays) |

### Tier B — Core systems (relationships, workflows)
The bread-and-butter interview problems. Multiple patterns combined.

| Problem | Primary patterns to reach for |
|---|---|
| [lru-cache](problems/lru-cache.md) | Data-structure design (hashmap + doubly linked list) |
| [logging-framework](problems/logging-framework.md) | **Chain of Responsibility** (levels), Singleton, Observer (sinks), Strategy (format) |
| [splitwise](problems/splitwise.md) | **Strategy** (equal/exact/percent split), Observer (balance updates) |
| [library-management-system](problems/library-management-system.md) | Factory, State (book status), Strategy (fine calc) |
| [movie-ticket-booking-system](problems/movie-ticket-booking-system.md) | **Factory, Observer, Singleton**, State (seat lock) |
| [concert-ticket-booking-system](problems/concert-ticket-booking-system.md) | Observer, State, Strategy (pricing) |
| [restaurant-management-system](problems/restaurant-management-system.md) | State (order), Command (kitchen), Factory |
| [hotel-management-system](problems/hotel-management-system.md) | Factory (room types), State (booking), Strategy (pricing) |
| [car-rental-system](problems/car-rental-system.md) | Factory, Strategy (pricing), State (rental) |
| [task-management-system](problems/task-management-system.md) | State (task status), Observer, Composite (subtasks) |
| [digital-wallet-service](problems/digital-wallet-service.md) | State (txn), Command (transfer), Strategy |
| [pub-sub-system](problems/pub-sub-system.md) | **Observer** (the pattern, at scale) |
| [stack-overflow](problems/stack-overflow.md) | Observer (notifications), Strategy (reputation/voting) |
| [course-registration-system](problems/course-registration-system.md) | Observer (waitlist), State, Strategy |
| [cricinfo](problems/cricinfo.md) | **Observer** (live score), State (match), Strategy |

### Tier C — Complex systems (multiple subsystems, matching/pricing)
Larger designs; expect to combine 4+ patterns and defend trade-offs.

| Problem | Primary patterns to reach for |
|---|---|
| [chess-game](problems/chess-game.md) | **Strategy** (per-piece moves), State (game phase), Memento (undo), Factory |
| [ride-sharing-service](problems/ride-sharing-service.md) | Strategy (matching/pricing), Observer (tracking), State (ride lifecycle) |
| [food-delivery-service](problems/food-delivery-service.md) | Strategy (matching), Observer, State (order lifecycle) |
| [online-shopping-service](problems/online-shopping-service.md) | Factory, Strategy (payment/discount), State (order), Observer |
| [online-auction-system](problems/online-auction-system.md) | **Observer** (bids), State (auction), Strategy |
| [music-streaming-service](problems/music-streaming-service.md) | **Iterator** (playlists), State (player), Strategy (recommend) |
| [airline-management-system](problems/airline-management-system.md) | Factory, Strategy (pricing/seat), State (booking), Observer |
| [online-stock-brokerage-system](problems/online-stock-brokerage-system.md) | **Observer** (price/order updates), Strategy (order types), State |
| [linkedin](problems/linkedin.md) | Observer (feed/notifications), Strategy, Composite (connections) |
| [social-networking-service](problems/social-networking-service.md) | Observer (feed), Strategy, Composite |

> Pattern hints are *starting points*, not a checklist — the skill is justifying (and sometimes rejecting) a pattern for the specific requirements. Not every problem needs a named pattern; over-applying is a red flag.

---

## All 33 problems (alphabetical)

airline-management-system · atm · car-rental-system · chess-game · coffee-vending-machine · concert-ticket-booking-system · course-registration-system · cricinfo · digital-wallet-service · elevator-system · food-delivery-service · hotel-management-system · library-management-system · linkedin · logging-framework · lru-cache · movie-ticket-booking-system · music-streaming-service · online-auction-system · online-shopping-service · online-stock-brokerage-system · parking-lot · pub-sub-system · restaurant-management-system · ride-sharing-service · snake-and-ladder · social-networking-service · splitwise · stack-overflow · task-management-system · tic-tac-toe · traffic-signal · vending-machine
