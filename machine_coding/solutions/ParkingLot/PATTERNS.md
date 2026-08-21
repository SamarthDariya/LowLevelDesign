# Parking Lot — Which Design Patterns Actually Apply?

Key takeaway up front: **in this solution, only Singleton is actually applied.**
Factory, Strategy, and Observer are *latent opportunities* the scoped requirements
didn't force — and leaving them out is **correct restraint, not a miss**. A pattern is
an answer to a specific pressure (varying algorithm, complex creation, live updates);
if that pressure isn't in the requirements, adding the pattern is over-engineering.

---

## ✅ 1. Singleton — actually applied

`ParkingLot` — one instance, globally reachable, private-constructor guard + `get_instance()`.
Justified: there is genuinely one lot, and all gates/displays must share the same instance.

```javascript
static get_instance(){
  if(!ParkingLot.#instance) ParkingLot.#instance = new ParkingLot();
  return ParkingLot.#instance;
}
```

---

## 🟡 2. Factory — opportunity, not yet needed

**Where it would go:** creating vehicles/spots. The client currently does
`new Vehicle(VehicleType.CAR, "CAR_1")` and `new Spot(VehicleType.CAR)` directly.
A factory would centralize that:

```javascript
class VehicleFactory {
  static create(type, plate){
    return new Vehicle(type, plate);   // one place that knows how to build any vehicle
  }
}
```

**Why it isn't earning its keep here:** `Vehicle` and `Spot` are each a single class
*parameterized by type*, so construction is a trivial one-line `new`. A factory would
just wrap that with no added value — so skipping it is the right call.

**Factory WOULD earn its keep if:**
- vehicles became **subclasses** (`Car`, `Truck` with different behavior) → factory hides *which class*, or
- construction got complex (spot IDs, level refs, sensors wired in) → factory centralizes the wiring.

---

## 🟡 3. Strategy — scoped out; would be the star if pricing existed

The classic Parking Lot Strategy hooks are **pricing** and **spot allocation**.
Pricing was **scoped out in Phase 1**, which is exactly why Strategy is absent.

**If pricing were in scope** — inject a strategy so hourly / flat / per-type pricing
swaps without touching the lot:

```javascript
class HourlyPricing { calculate(session, exitTime){ return hours(session, exitTime) * 20; } }
class FlatPricing   { calculate(session, exitTime){ return 100; } }

class ExitGate {
  constructor(lot, pricingStrategy){ this.pricing = pricingStrategy; }   // injected
  exit(session){
    const fee = this.pricing.calculate(session, now());   // delegate — no if/else on pricing type
    // ...
  }
}
```

**Second Strategy hook — spot allocation.** `assign_spot` currently uses a fixed
"first free spot" rule. If the requirement were "assign the nearest spot" or
"spread load across levels," that becomes a `SpotAllocationStrategy` injected into the lot:

```javascript
assign_spot(vehicle){ return this.allocationStrategy.pick(this.#levels, vehicle.type); }
```

Hardcoded first-fit is fine because no requirement asked for a smarter rule. The moment
"nearest spot" appears, swap in a strategy instead of editing `assign_spot`.

---

## 🟡 4. Observer — pull (what we did) vs push

Requirement 5 ("real-time info to customers") is an Observer hook. We implemented it as
**pull**: `get_free_spots()` computes counts on demand. Perfectly valid and simpler.

**Observer (push) would apply if** there were **display boards** that must update live the
instant a spot frees, without polling. Each display `subscribe`s to the lot, and
`assign_spot`/`free_spot` `notify()` them:

```javascript
free_spot(session){ /* ...free spot... */ this.notify({ type, freeCount }); }  // push to all displays
```

**push (Observer)** vs **pull (`get_free_spots`)** — we chose pull; use Observer only if
live boards are a requirement.

---

## Scorecard for this solution

| Pattern | Status | Note |
|---|---|---|
| **Singleton** | ✅ applied | one lot, shared by all gates/displays — justified |
| **Factory** | ⬜ skipped (correctly) | construction is trivial; apply if vehicles subclass or creation gets complex |
| **Strategy** | ⬜ absent | pricing/allocation were scoped out; #1 place it'd slot in otherwise |
| **Observer** | ⬜ pull instead | chose `get_free_spots()` pull; push only if live display boards required |

**The lesson:** the study index lists "Factory, Strategy, Singleton" as *candidates to
reach for* — not a checklist to satisfy. Using only Singleton because it's the only one the
scoped requirements justified is exactly the judgment interviews reward.

**Natural extension for practice:** add pricing to the scope and refactor the exit flow to use
a `PricingStrategy` — the classic interviewer follow-up ("now add billing"), and the best way
to get Strategy wired into a real design here.
