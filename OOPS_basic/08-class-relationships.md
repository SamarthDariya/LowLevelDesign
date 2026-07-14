# Class Relationships

## What is it?

Classes rarely live alone — a real design is a web of classes that know about, use, contain, and own each other. **Class relationships** are the standard vocabulary for describing exactly *how* two classes are connected, and *how strongly*. Getting the strength right matters: too-tight coupling makes systems rigid; too-loose modeling misses real constraints.

There are four relationships you must know (plus inheritance from file 03). From weakest to strongest:

1. **Dependency** — *"A uses B briefly."* A method receives or creates a B, uses it, and forgets it. A `ReportPrinter` that accepts an `Order` parameter depends on `Order`, but doesn't keep it.
2. **Association** — *"A knows B."* A holds a lasting reference to B, but neither owns the other; both live independently. A `Doctor` has a list of `Patient`s — but patients exist regardless of any doctor.
3. **Aggregation** — *"A has B (shared, detachable)."* A whole-part relationship where the part survives without the whole. A `Team` has `Player`s; disband the team and the players still exist (and may join other teams).
4. **Composition** — *"A owns B (exclusive, lifecycle-bound)."* The strongest form: the part is created by, belongs exclusively to, and dies with the whole. A `House` is composed of `Room`s; demolish the house and its rooms cease to exist.

Real-world anchor: think of a **car**. The car *depends on* a fuel station (uses it briefly), is *associated with* its registered owner (knows them; both independent), *aggregates* passengers (has them now; they exist without it), and is *composed of* its engine and chassis (built with the car, scrapped with the car).

In UML text notation (worth memorizing for whiteboards):

```
Dependency:   A ┄┄> B     (dashed arrow — "uses")
Association:  A ──> B     (solid arrow — "knows / has a reference to")
Aggregation:  A ◇──> B    (hollow diamond on the WHOLE — "has, shared")
Composition:  A ◆──> B    (filled diamond on the WHOLE — "owns, exclusive")
Inheritance:  A ──▷ B     (hollow triangle at the PARENT — "is a")
```

## Why does it matter in LLD?

After you name your classes in an LLD interview, the very next question — asked explicitly or judged silently — is *"how do they relate?"* Your class diagram is mostly arrows, and each arrow is one of these relationships. Saying *"ParkingLot is **composed of** Floors, a Floor **aggregates** ParkingSpots... actually no — spots die with the floor, so that's composition too; a Ticket is **associated with** a Vehicle"* demonstrates precise thinking. Vague "X is connected to Y" answers cost points.

The practical stakes are lifecycle and ownership: composition tells you *who creates and destroys what* (the `ParkingLot` constructor builds its `Floor`s; nobody else holds them), aggregation tells you parts are *shared or injected* (players are passed into the team), and dependency tells you the coupling is *transient* (safe to change). These decisions directly shape your constructors, method signatures, and how testable the design is — aggregated/injected parts can be mocked; composed parts cannot.

Finally, this topic hosts one of the most-asked design questions anywhere: **"composition over inheritance" — what does it mean and why?** (Covered with code below.) Interviewers use it to separate people who memorized `extends` from people who can actually structure a system.

## Code Example

```javascript
// relationships.js — run with: node relationships.js

// =====================================================================
// 1) DEPENDENCY  ( ReportPrinter ┄┄> Order )  — "uses briefly"
// =====================================================================
class Order {
  constructor(id, amount) {
    this.id = id;
    this.amount = amount;
  }
}

class ReportPrinter {
  // Order arrives as a parameter, is used, and is NOT stored.
  print(order) {
    console.log(`[report] Order #${order.id}: $${order.amount}`);
  }
}

new ReportPrinter().print(new Order(1, 250));

// =====================================================================
// 2) ASSOCIATION  ( Doctor ──> Patient )  — "knows; both independent"
// =====================================================================
class Patient {
  constructor(name) {
    this.name = name;
  }
}

class Doctor {
  #patients = []; // lasting references — but NO ownership

  constructor(name) {
    this.name = name;
  }

  addPatient(patient) {
    this.#patients.push(patient);
  }

  listPatients() {
    console.log(`Dr. ${this.name} treats:`, this.#patients.map((p) => p.name).join(", "));
  }
}

const alice = new Patient("Alice"); // patients exist FIRST, independently
const bob = new Patient("Bob");
const drWho = new Doctor("Who");
drWho.addPatient(alice);
drWho.addPatient(bob);
drWho.listPatients();
// Delete the doctor — Alice and Bob are unaffected. That's association.

// =====================================================================
// 3) AGGREGATION  ( Team ◇──> Player )  — "has; parts outlive the whole"
// =====================================================================
class Player {
  constructor(name) {
    this.name = name;
  }
}

class Team {
  #players = [];

  constructor(name) {
    this.name = name;
  }

  // Parts are INJECTED from outside — the team didn't create them
  recruit(player) {
    this.#players.push(player);
    console.log(`${player.name} joined ${this.name}`);
  }

  roster() {
    return this.#players.map((p) => p.name);
  }
}

const ronaldo = new Player("Ronaldo");
let team = new Team("All-Stars");
team.recruit(ronaldo);
console.log("Roster:", team.roster());

team = null; // team disbanded...
console.log(`${ronaldo.name} still exists!`); // ...players live on

// =====================================================================
// 4) COMPOSITION  ( House ◆──> Room )  — "owns; parts die with the whole"
// =====================================================================
class Room {
  constructor(label, sqft) {
    this.label = label;
    this.sqft = sqft;
  }
}

class House {
  #rooms; // created INSIDE, never handed out, die with the house

  constructor(plan) {
    // The whole CREATES its parts — the composition signature.
    this.#rooms = plan.map(({ label, sqft }) => new Room(label, sqft));
  }

  totalArea() {
    return this.#rooms.reduce((sum, r) => sum + r.sqft, 0);
  }

  describe() {
    console.log(
      `House with ${this.#rooms.length} rooms, ${this.totalArea()} sqft total`
    );
  }
}

const house = new House([
  { label: "bedroom", sqft: 140 },
  { label: "kitchen", sqft: 90 },
  { label: "living", sqft: 200 },
]);
house.describe(); // House with 3 rooms, 430 sqft total
// No external variable ever references a Room — when `house` is garbage
// collected, its rooms go with it. That lifecycle bond is composition.

// =====================================================================
// COMPOSITION OVER INHERITANCE — the classic discussion, in code
// =====================================================================
// Requirement: robots and ducks. Some things fly, some quack, some both.
// The INHERITANCE approach explodes: FlyingDuck, QuackingRobot,
// FlyingQuackingDuck... every combination needs a class.
//
// The COMPOSITION approach: model behaviors as small parts and PLUG them in.

class FlyBehavior {
  fly() {
    console.log("  flying with wings!");
  }
}

class NoFly {
  fly() {
    console.log("  cannot fly.");
  }
}

class QuackBehavior {
  quack() {
    console.log("  quack quack!");
  }
}

class Duck {
  constructor(name, flyBehavior, quackBehavior) {
    this.name = name;
    this.flyBehavior = flyBehavior;     // HAS-A behavior (composition)
    this.quackBehavior = quackBehavior; // HAS-A behavior
  }

  perform() {
    console.log(`${this.name}:`);
    this.flyBehavior.fly();
    this.quackBehavior.quack();
  }
}

const mallard = new Duck("Mallard", new FlyBehavior(), new QuackBehavior());
const rubberDuck = new Duck("Rubber Duck", new NoFly(), new QuackBehavior());
mallard.perform();
rubberDuck.perform();
// Behaviors can even change at RUNTIME — inheritance can never do this:
rubberDuck.flyBehavior = new FlyBehavior(); // strap a rocket on it
rubberDuck.perform();
```

## Comparison Table

| Relationship | Meaning | Strength | Lifecycle bond | UML (text) | Code smell test |
|---|---|---|---|---|---|
| Dependency | A uses B briefly (parameter, local var) | Weakest | None | `A ┄┄> B` | B appears only inside A's methods |
| Association | A keeps a reference to B; both independent | Weak | None | `A ──> B` | A stores B, but didn't create it and doesn't control it |
| Aggregation | Whole-part; part is shared/detachable | Medium | Part outlives whole | `A ◇──> B` | Parts are injected/added from outside |
| Composition | Whole-part; exclusive ownership | Strong | Part dies with whole | `A ◆──> B` | Whole `new`s its parts in its constructor; never leaks them |
| Inheritance | A **is a** B | Strongest | A *is* B | `A ──▷ B` | "A is a B" reads naturally AND A can substitute for B |

Memory hook for the diamonds: **hollow diamond = loosely held** (aggregation), **filled diamond = firmly owned** (composition). The diamond always sits on the *whole*.

## Common Mistakes

- **Calling everything "has-a"** — aggregation and composition are different design decisions (who creates the part? does it survive the whole? can it be shared?). Interviewers probe exactly this.
- **Using inheritance where composition fits** — "`Car extends Engine`" is wrong; a car *has an* engine. Reserve `extends` for genuine is-a; use fields for has-a.
- **Composition that leaks its parts** — if `House` returns its live `Room` objects to everyone, external code can hold rooms after the house is gone; the exclusive-ownership claim is broken. Keep composed parts private, expose copies or summaries.
- **Bidirectional associations by default** — Doctor knows Patients AND Patient knows Doctors doubles your bookkeeping and creates cycles. Keep references one-way unless the design truly needs both.
- **Combinatorial subclass explosion** — `FlyingSwimmingQuackingDuck` style hierarchies are the tell that behaviors should be composed, not inherited.

## Interview Notes

- Every LLD class diagram you draw will be graded on these arrows. Practice narrating: *"Lot ◆── Floors (composition — floors die with the lot), Ticket ──> Vehicle (association), Lot ┄┄> PaymentProcessor (dependency)."*
- **"Composition over inheritance"** is a top-5 interview question. The full answer: inheritance is compile-time-fixed, single-parent, and fragile to base-class changes; composition is flexible, swappable at runtime, mixes multiple behaviors, and easier to test (inject fakes). Inheritance still wins for genuine, stable is-a with substitution.
- The quick discriminator interviewers love: *"If the whole is destroyed, does the part survive?"* Yes → aggregation; No → composition.
- Strategy pattern (which you'll study soon) is exactly the Duck example above — composition of a behavior object. Mentioning that link earns credit.
- Expect *"how would you test this class?"* — composed parts created internally are hard to mock; if testability is required, shift toward aggregation/dependency injection and say why.

## Quick Recap

- Four relationships, weakest → strongest: **Dependency** (uses) → **Association** (knows) → **Aggregation** (has, shared) → **Composition** (owns, lifecycle-bound).
- UML text arrows: `┄┄>` dependency, `──>` association, `◇──>` aggregation, `◆──>` composition, `──▷` inheritance.
- The lifecycle question decides aggregation vs composition: does the part outlive the whole?
- Prefer composition over inheritance for flexibility: behaviors become pluggable parts, swappable even at runtime.
- In interviews, name the relationship (and its diamond) out loud for every connection in your class diagram.
