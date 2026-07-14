# Enums

## What is it?

An **enum** (enumeration) is a type with a small, fixed set of named values. Days of the week, order statuses, card suits, user roles — situations where a value must be *one of these and nothing else*. Instead of scattering raw strings (`"pending"`, `"PENDING"`, `"pendng"` — spot the bug) or magic numbers (`status === 2`?) through your code, you define the allowed values once, give them readable names, and reference them everywhere: `OrderStatus.PENDING`.

Real-world analogy: **traffic lights**. A traffic light has exactly three states — red, yellow, green. Not "reddish," not "4," not whatever string a driver feels like. Everyone (drivers, traffic laws, the light's hardware) shares this fixed vocabulary, which is why the system works. An enum is you writing that fixed vocabulary into code.

**JavaScript has no `enum` keyword.** The standard substitute is a **frozen object**: `const OrderStatus = Object.freeze({ PENDING: "PENDING", ... })`. `Object.freeze` makes the object immutable — you can't add, remove, or change entries — so the "fixed set" promise actually holds. A stricter variant uses **`Symbol`** values, which are guaranteed unique: a symbol enum value can't collide with or be faked by any ordinary string, so `status === OrderStatus.PENDING` can only be true if the value genuinely came from the enum. The trade-off: symbols don't survive `JSON.stringify`, so string-valued enums are more practical for anything stored or sent over the network.

For richer needs there's the **class-based enum** pattern: each value is a pre-built, frozen instance of a class, so values can carry data and methods (like Java enums). And TypeScript offers a real `enum` keyword — shown at the end for comparison.

## Why does it matter in LLD?

Almost every LLD problem contains at least one enum, and interviewers expect you to spot them and name them in your first pass: `VehicleType {CAR, BIKE, TRUCK}` in a parking lot, `PieceColor {WHITE, BLACK}` in chess, `OrderStatus {PLACED, PAID, SHIPPED, DELIVERED, CANCELLED}` in e-commerce, `Direction {UP, DOWN, IDLE}` in an elevator. Declaring these as enums (rather than loose strings) immediately makes your model precise: the set of legal values is explicit, finite, and typo-proof.

Enums are also the natural companion of **state machines**, a favorite LLD interview follow-up: *"which status transitions are legal?"* With an enum for states plus a transition map, "you can't ship a cancelled order" becomes enforced structure instead of scattered `if`s.

In production JavaScript, string enums prevent an entire bug class: mistyped string literals that fail silently. `if (status === "shpped")` is never true and no tool warns you; `if (status === OrderStatus.SHPPED)` is `undefined` and instantly discoverable (and a typo in the enum *name* itself would crash loudly). Centralizing the values also gives you one place to attach metadata — display labels, sort order, allowed transitions.

## Code Example

```javascript
// enums.js — run with: node enums.js

// =====================================================================
// PATTERN 1: Object.freeze — the everyday JS enum
// =====================================================================
const OrderStatus = Object.freeze({
  PLACED: "PLACED",
  PAID: "PAID",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
});

// Frozen = immutable. These attempts silently fail (or throw in strict mode):
OrderStatus.PLACED = "HACKED";
OrderStatus.NEW_STATUS = "NEW";
console.log(OrderStatus.PLACED);      // "PLACED" — unchanged
console.log(OrderStatus.NEW_STATUS);  // undefined — not added

// Enums + a transition map = a tiny state machine (classic LLD move):
const ALLOWED_TRANSITIONS = Object.freeze({
  [OrderStatus.PLACED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
});

class Order {
  #status = OrderStatus.PLACED;

  get status() {
    return this.#status;
  }

  moveTo(nextStatus) {
    const allowed = ALLOWED_TRANSITIONS[this.#status];
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Illegal transition: ${this.#status} → ${nextStatus}`);
    }
    console.log(`Order: ${this.#status} → ${nextStatus}`);
    this.#status = nextStatus;
  }
}

const order = new Order();
order.moveTo(OrderStatus.PAID);     // Order: PLACED → PAID
order.moveTo(OrderStatus.SHIPPED);  // Order: PAID → SHIPPED
try {
  order.moveTo(OrderStatus.CANCELLED); // can't cancel after shipping!
} catch (e) {
  console.log("Blocked:", e.message);
}

// Enumerate all values (handy for validation and dropdowns):
console.log(Object.values(OrderStatus)); // ["PLACED","PAID",...]
const isValidStatus = (s) => Object.values(OrderStatus).includes(s);
console.log(isValidStatus("PAID"));   // true
console.log(isValidStatus("paid"));   // false — case matters, which is the point

// =====================================================================
// PATTERN 2: Symbol-based enum — values that can't be faked
// =====================================================================
const Direction = Object.freeze({
  UP: Symbol("UP"),
  DOWN: Symbol("DOWN"),
  IDLE: Symbol("IDLE"),
});

function moveElevator(direction) {
  switch (direction) {
    case Direction.UP:   console.log("Elevator going up"); break;
    case Direction.DOWN: console.log("Elevator going down"); break;
    case Direction.IDLE: console.log("Elevator idle"); break;
    default: throw new Error("Unknown direction"); // impossible to fake a Symbol
  }
}

moveElevator(Direction.UP);
// A string can never impersonate a Symbol value:
console.log("UP" === Direction.UP);                // false
console.log(Symbol("UP") === Direction.UP);        // false! every Symbol is unique
try {
  moveElevator("UP"); // outsiders can't sneak look-alike values in
} catch (e) {
  console.log("Blocked:", e.message);
}
// Trade-off: JSON.stringify drops Symbols — prefer string enums for stored data.
console.log(JSON.stringify({ dir: Direction.UP })); // {}

// =====================================================================
// PATTERN 3: Class-based enum — values with data and behavior
// =====================================================================
class VehicleType {
  static CAR = new VehicleType("CAR", 30, 1);
  static BIKE = new VehicleType("BIKE", 10, 0.5);
  static TRUCK = new VehicleType("TRUCK", 50, 2);

  constructor(name, feePerHour, slotSize) {
    this.name = name;
    this.feePerHour = feePerHour;
    this.slotSize = slotSize;
    Object.freeze(this); // each value is immutable
  }

  static values() {
    return [VehicleType.CAR, VehicleType.BIKE, VehicleType.TRUCK];
  }
}
Object.freeze(VehicleType);

for (const t of VehicleType.values()) {
  console.log(`${t.name}: $${t.feePerHour}/hr, uses ${t.slotSize} slot(s)`);
}
```

### The TypeScript comparison

```typescript
// TypeScript — for comparison only (won't run under plain node)
enum OrderStatus {
  PLACED = "PLACED",
  PAID = "PAID",
  SHIPPED = "SHIPPED",
}

let s: OrderStatus = OrderStatus.PAID;
// s = "REFUNDED";        // COMPILE ERROR — not a member of the enum
// s = "PAID";            // also an error for enums: must use OrderStatus.PAID

// Modern TS teams often prefer a union of literals instead:
type Status = "PLACED" | "PAID" | "SHIPPED"; // lighter-weight, same safety
```

TS enforces membership at compile time; the JS patterns above enforce it by construction (`freeze`) and at runtime (validation, Symbol identity).

## Common Mistakes

- **Forgetting `Object.freeze`** — a plain object "enum" can be mutated by any code (`Status.PAID = "OOPS"`), silently breaking every comparison in the app.
- **Using magic strings/numbers inline** — `if (order.status === "paid")` invites typos and case bugs. Always compare against the enum member.
- **Numeric values with no meaning** — `{ CAR: 0, BIKE: 1 }` makes logs and DB rows unreadable (`type: 1`?), and `0` is falsy, causing `if (type)` bugs. Prefer string values.
- **Serializing Symbol enums** — `JSON.stringify` drops Symbols entirely; use string-valued enums for anything persisted or sent over the wire.
- **Two enums where one belongs (or vice versa)** — mixing `PaymentStatus` values into `OrderStatus`, or splitting one concept across files. Each enum should model exactly one axis of variation.

## Interview Notes

- In LLD interviews, enumerate your enums early: *"VehicleType, SlotSize, and TicketStatus are my enums."* It's a fast, cheap signal of a precise domain model.
- Expect *"JS has no enums — what do you do?"* — answer: `Object.freeze` object (default), Symbols when uniqueness/unfakeability matters, class-based when values need data/behavior, TS `enum` or literal unions in typed code.
- Status enums almost always trigger the follow-up *"which transitions are valid?"* — bring the transition-map/state-machine pattern shown above.
- Know the Symbol trade-off (identity safety vs no JSON serialization) — it's a common depth probe.
- If TypeScript comes up, mentioning that many teams now prefer `type Status = "A" | "B"` literal unions over `enum` shows current, real-world awareness.

## Quick Recap

- An enum is a fixed set of named values — precise vocabulary for statuses, types, and categories.
- JS default: `Object.freeze({ NAME: "NAME", ... })` — immutable, readable, JSON-friendly.
- Symbol enums give unforgeable identity but don't serialize; class-based enums attach data and methods to each value.
- Enums + a frozen transition map = a lightweight state machine, a staple of LLD answers.
- TypeScript has real `enum`s (and literal-union types) with compile-time membership checking.
