# Inheritance

## What is it?

**Inheritance** lets one class (the *child* / *subclass*) reuse and extend another class (the *parent* / *superclass*). The child automatically gets the parent's properties and methods, can add its own, and can **override** parent behavior with a specialized version. In JavaScript this is the `extends` keyword, and `super` is how the child talks to its parent (call the parent constructor with `super(...)`, or a parent method with `super.methodName()`).

The mental model is the **"is-a" relationship**. A `Dog` *is an* `Animal`. A `SavingsAccount` *is a* `BankAccount`. A `Car` *is a* `Vehicle`. Everything true of the general category is inherited by the specific one: every animal eats and sleeps, so a dog eats and sleeps too — you don't rewrite that. What a dog adds is its own specialization: `bark()`.

A real-world analogy: a job hierarchy of document templates. Your company has a base "Employment Contract" template with all the standard clauses. The "Engineering Contract" starts from that base and adds an IP-assignment section; the "Sales Contract" starts from the same base and adds a commission section. Nobody re-types the standard clauses — they inherit them, then extend or override the parts that differ.

The critical discipline: inheritance is for *genuine* is-a relationships where the child can stand in anywhere the parent is expected (this rule is the Liskov Substitution Principle, which you'll meet in SOLID). Inheriting just to reuse a few methods — "a `Stack` extends `Array` because arrays have push/pop" — creates fragile designs. For reuse without is-a, prefer composition (covered in file 08).

## Why does it matter in LLD?

Almost every LLD problem has a natural hierarchy, and interviewers expect you to spot it. Parking lot: `Vehicle` → `Car`, `Bike`, `Truck`. Chess: `Piece` → `King`, `Queen`, `Pawn`. Payment system: `PaymentMethod` → `CreditCard`, `UPI`, `Wallet`. Modeling the shared behavior once in a base class and specializing in subclasses is the expected shape of the solution.

Inheritance is also the mechanism that powers **polymorphism** (next file): code written against `Vehicle` automatically works with every current and future subclass. That's how LLD designs stay open to extension — adding an `ElectricCar` shouldn't require touching the `ParkingLot` class.

Equally important in interviews is knowing when *not* to inherit. A favorite interviewer trap is a hierarchy that looks right but breaks substitution (the classic: `Square extends Rectangle`). Being able to say *"I'd use composition here because X *has-a* Y, not *is-a* Y"* demonstrates judgment, not just syntax knowledge.

## Code Example

```javascript
// vehicles.js — run with: node vehicles.js

// ---- Parent (base) class: shared state + behavior ----
class Vehicle {
  #speed = 0; // private state is inherited-in-effect: children use the public API

  constructor(brand, licensePlate) {
    this.brand = brand;
    this.licensePlate = licensePlate;
  }

  get speed() {
    return this.#speed;
  }

  accelerate(by) {
    this.#speed += by;
    console.log(`${this.describe()} accelerates to ${this.#speed} km/h`);
  }

  brake() {
    this.#speed = 0;
    console.log(`${this.describe()} stops.`);
  }

  // Children will often override this:
  describe() {
    return `${this.brand} vehicle [${this.licensePlate}]`;
  }

  parkingFeePerHour() {
    return 20; // sensible default
  }
}

// ---- Child class #1: extends + overrides ----
class Car extends Vehicle {
  constructor(brand, licensePlate, seats) {
    // MUST call super(...) before using `this` in a child constructor
    super(brand, licensePlate);
    this.seats = seats; // Car-specific state
  }

  // Override: replace the parent's version entirely
  describe() {
    return `${this.brand} car (${this.seats} seats) [${this.licensePlate}]`;
  }

  parkingFeePerHour() {
    return 30;
  }

  // New behavior only cars have
  openTrunk() {
    console.log(`${this.describe()} trunk opened.`);
  }
}

// ---- Child class #2: override that EXTENDS parent behavior via super ----
class Truck extends Vehicle {
  constructor(brand, licensePlate, maxLoadTons) {
    super(brand, licensePlate);
    this.maxLoadTons = maxLoadTons;
  }

  describe() {
    // Reuse the parent's text, then add to it
    return super.describe() + ` <heavy: ${this.maxLoadTons}t>`;
  }

  parkingFeePerHour() {
    return 50;
  }
}

// ---- Multi-level inheritance: ElectricCar is-a Car is-a Vehicle ----
class ElectricCar extends Car {
  constructor(brand, licensePlate, seats, rangeKm) {
    super(brand, licensePlate, seats);
    this.rangeKm = rangeKm;
  }

  describe() {
    return `⚡ ${super.describe()} range=${this.rangeKm}km`;
  }
}

// ---- Using the hierarchy ----
const car = new Car("Toyota", "KA-01-1234", 5);
const truck = new Truck("Volvo", "KA-02-9999", 12);
const tesla = new ElectricCar("Tesla", "KA-03-0007", 5, 500);

car.accelerate(60);   // inherited method, overridden describe()
truck.accelerate(40);
tesla.accelerate(80);

car.openTrunk();      // Car-only behavior

// Every subclass answers the same question its own way:
for (const v of [car, truck, tesla]) {
  console.log(`${v.describe()} → fee: $${v.parkingFeePerHour()}/hr`);
}

// instanceof checks the whole chain:
console.log(tesla instanceof ElectricCar); // true
console.log(tesla instanceof Car);         // true
console.log(tesla instanceof Vehicle);     // true
console.log(truck instanceof Car);         // false
```

Key mechanics to remember:

- `extends` sets up the parent→child link; children inherit all public methods.
- A child constructor **must** call `super(...)` before touching `this`.
- Overriding = redefining a method in the child. `super.method()` lets you *extend* instead of *replace*.
- `instanceof` is true for the object's class and every ancestor.

## Common Mistakes

- **Forgetting `super(...)` in the child constructor** — JS throws `ReferenceError: must call super constructor before accessing 'this'`. If the child has no constructor at all, JS auto-forwards arguments, which is fine.
- **Inheriting for code reuse without is-a** — "`Order extends Database` so it can save itself" couples everything to everything. If the sentence "X is a Y" sounds wrong, don't extend.
- **Deep inheritance towers** — 4-5 levels (`A→B→C→D→E`) become impossible to reason about. Keep hierarchies shallow (1-2 levels); reach for composition when it grows.
- **Overriding a method but breaking its contract** — if the parent's `withdraw()` never throws for valid amounts, a child that suddenly throws violates substitution and breaks callers.
- **Expecting multiple inheritance** — JS classes extend exactly ONE parent. If you need behavior from several sources, use mixins or composition, not a fantasy `extends A, B`.

## Interview Notes

- Expect *"walk me through your class hierarchy"* in nearly every LLD problem — practice naming the base class, what's shared, and what each child specializes.
- The `Square extends Rectangle` problem is the classic LSP trap: a Square that forces width=height breaks code that sets them independently. Know it and be able to explain why composition or a common `Shape` parent fixes it.
- Be ready for *"when would you NOT use inheritance?"* — answer with is-a vs has-a, fragile base class problem, and "composition over inheritance" (file 08).
- Interviewers may ask you to add a new subclass live (e.g., "now support motorcycles"). A good hierarchy makes this a pure addition — no existing code changes. Design for that.
- Mention that constructors chain: child `super(...)` → parent constructor → back to child. Bugs in initialization order are a common follow-up question.

## Quick Recap

- Inheritance = child class reuses/extends a parent via `extends`; models an **is-a** relationship.
- `super(...)` calls the parent constructor (mandatory before `this`); `super.method()` reuses parent logic inside an override.
- Overriding lets each subclass answer the same message its own way — the foundation of polymorphism.
- `instanceof` is true across the entire ancestor chain.
- Use inheritance only for true is-a; keep hierarchies shallow; otherwise prefer composition.
