# Interfaces

## What is it?

An **interface** is a pure contract: a named list of methods (and their signatures) that a class promises to provide, with **zero implementation**. It answers "what can this thing do?" without saying a word about how. In Java or TypeScript you write `interface Payable { pay(amount): Receipt }` and any class that `implements Payable` is guaranteed — checked by the compiler — to have that method.

**JavaScript has no `interface` keyword.** Instead, JS runs on **duck typing**: *"if it walks like a duck and quacks like a duck, it's a duck."* Any object that happens to have a `pay(amount)` method can be used wherever a "payable" thing is expected — no declaration, no ceremony. The contract exists, but it's implicit and enforced only at runtime: call a method that isn't there and you get a `TypeError` (or worse, `undefined` flowing silently through your program).

Real-world analogy: **electrical wall sockets**. The socket standard is an interface — it specifies pin shape, voltage, spacing. It says nothing about what's plugged in: lamp, laptop, blender. Any device that *implements the plug standard* works. Manufacturers of devices and builders of houses never coordinate directly; they both just honor the contract. That decoupling is exactly what interfaces buy you in software.

Since interviews and typed codebases (TypeScript, Java) make contracts explicit, JS developers use three practical techniques: (1) rely on duck typing and document the expected methods, (2) write a runtime check that verifies an object has the required methods, and (3) simulate interfaces with **abstract-ish base classes** whose methods throw until implemented — giving you loud, early failures plus `instanceof` checks.

## Why does it matter in LLD?

Interfaces are the backbone of LLD vocabulary. Design discussions are phrased in contracts: *"the parking lot depends on a `PaymentStrategy` interface"*, *"`Notifier` has three implementations."* Even in JavaScript interviews, you're expected to *speak* interface — define the contract explicitly (as a base class or a documented shape) rather than leaving it implied. It shows you design by contract, not by accident.

Interfaces enable the two most-valued properties in design reviews: **decoupling** (high-level code depends on the contract, so implementations swap freely — real DB vs in-memory fake, Stripe vs Razorpay) and **multiple capability composition** — a class can honor *many* contracts at once (a `Smartphone` is `Callable`, `Photographable`, `GPSEnabled`), which single-parent inheritance can't express. "Class inheritance is single, but a class can implement many interfaces" is a stock interview line worth internalizing.

Also strategic: most companies interview LLD in Java or TypeScript. Knowing how a TS `interface` maps onto the JS patterns you already use means you can switch notation mid-interview without missing a beat.

## Code Example

```javascript
// interfaces.js — run with: node interfaces.js

// =====================================================================
// TECHNIQUE 1: Duck typing — the native JavaScript way
// =====================================================================
// The "interface" is implicit: anything with pay(amount) is acceptable.

const creditCard = {
  pay(amount) {
    console.log(`Paid $${amount} by credit card`);
    return { ok: true, method: "card" };
  },
};

const upi = {
  pay(amount) {
    console.log(`Paid $${amount} via UPI`);
    return { ok: true, method: "upi" };
  },
};

function checkout(paymentMethod, amount) {
  // No type declaration — we just trust the shape ("duck typing")
  return paymentMethod.pay(amount);
}

checkout(creditCard, 100);
checkout(upi, 50);

// =====================================================================
// TECHNIQUE 2: Runtime contract checking — trust, but verify
// =====================================================================
function implementsContract(obj, methodNames) {
  return methodNames.every((m) => typeof obj[m] === "function");
}

const PAYMENT_CONTRACT = ["pay", "refund"];

const wallet = {
  pay(amount) {
    console.log(`Paid $${amount} from wallet`);
  },
  // Oops — forgot refund()!
};

console.log(implementsContract(creditCard, ["pay"])); // true
console.log(implementsContract(wallet, PAYMENT_CONTRACT)); // false — caught early!

// =====================================================================
// TECHNIQUE 3: Abstract-ish base class — explicit, self-enforcing
// =====================================================================
class PaymentMethod {
  constructor() {
    if (new.target === PaymentMethod) {
      throw new Error("PaymentMethod is a contract — extend it");
    }
  }

  // Contract methods throw until a subclass provides them:
  pay(amount) {
    throw new Error(`${this.constructor.name} must implement pay(amount)`);
  }

  refund(txnId) {
    throw new Error(`${this.constructor.name} must implement refund(txnId)`);
  }
}

class StripePayment extends PaymentMethod {
  pay(amount) {
    console.log(`[stripe] charged $${amount}`);
    return { txnId: "st_001" };
  }
  refund(txnId) {
    console.log(`[stripe] refunded ${txnId}`);
  }
}

class CashPayment extends PaymentMethod {
  pay(amount) {
    console.log(`[cash] collected $${amount}`);
    return { txnId: "cash_001" };
  }
  refund(txnId) {
    console.log(`[cash] returned money for ${txnId}`);
  }
}

// Caller depends on the CONTRACT, and can even verify it:
function processOrder(method, amount) {
  if (!(method instanceof PaymentMethod)) {
    throw new Error("processOrder needs a PaymentMethod implementation");
  }
  const { txnId } = method.pay(amount);
  console.log(`Order paid, txn=${txnId}`);
}

processOrder(new StripePayment(), 200);
processOrder(new CashPayment(), 75);

// An incomplete implementation fails LOUDLY, not silently:
class BrokenPayment extends PaymentMethod {} // implements nothing
try {
  processOrder(new BrokenPayment(), 10);
} catch (e) {
  console.log("Blocked:", e.message); // BrokenPayment must implement pay(amount)
}
```

### The TypeScript comparison (what interviews often use)

TypeScript adds a real `interface` keyword — the contract is checked **at compile time**, before the code ever runs:

```typescript
// TypeScript — for comparison only (won't run under plain node)
interface PaymentMethod {
  pay(amount: number): { txnId: string };
  refund(txnId: string): void;
}

class StripePayment implements PaymentMethod {
  pay(amount: number) {
    return { txnId: "st_001" };
  }
  refund(txnId: string) {}
  // Omitting refund() would be a COMPILE ERROR — caught before runtime.
}

// A class can implement MULTIPLE interfaces (inheritance is single!):
interface Refundable { refund(txnId: string): void }
interface Auditable { auditLog(): string[] }
class BankTransfer implements Refundable, Auditable { /* ... */ }
```

Mapping between the worlds: TS `interface` + `implements` ≈ JS abstract-ish base class with throwing stubs; TS compile-time errors ≈ JS runtime throws; TS multiple interfaces ≈ JS duck typing / mixins.

## Common Mistakes

- **Leaving contracts implicit and undocumented** — pure duck typing works until a teammate passes an object missing one method and gets `TypeError: x.refund is not a function` in production. Make the contract visible (base class, JSDoc, or a runtime check).
- **Confusing interface with abstract class** — an interface is 100% contract (no state, no implementation); an abstract class can carry shared state and concrete helper methods. Use an abstract class when implementations share code; an interface when they share only a promise.
- **Fat interfaces** — one giant contract (`Machine` with `print()`, `scan()`, `fax()`) forces implementers to stub methods they don't support. Split into small, focused contracts (Interface Segregation).
- **Checking types instead of capabilities** — `if (obj instanceof StripePayment)` in caller code couples you to one implementation. Check the contract (`instanceof PaymentMethod`) or the capability (`typeof obj.pay === "function"`), never the concrete class.
- **Assuming names guarantee behavior** — an object having a `pay()` method doesn't mean it pays correctly. A contract includes *semantics* (what it must do, what it returns, what errors it throws), not just method names.

## Interview Notes

- Expect the direct question: *"JavaScript has no interfaces — how do you handle that?"* Answer with the three techniques: duck typing, runtime contract checks, and abstract-ish base classes with throwing methods; mention TypeScript for compile-time enforcement.
- Know **interface vs abstract class** as a crisp table-stakes answer: contract-only vs contract+shared code; multiple vs single; no state vs state allowed.
- LLD solutions are *presented* through interfaces: start your design with "the contracts are `X`, `Y`, `Z`," then list implementations. This framing alone signals structured thinking.
- "Program to an interface, not an implementation" — the most quoted design principle in interviews; be ready to show caller code that never references a concrete class.
- Strategy, Observer, Repository, Adapter — the patterns you'll learn next are all "an interface + swappable implementations." Flag that connection if patterns come up.

## Quick Recap

- An interface is a pure contract: method names + signatures + expected semantics, no implementation.
- JS has no `interface` keyword — use duck typing, runtime shape checks, or abstract-ish base classes that throw on unimplemented methods.
- TypeScript's `interface`/`implements` gives compile-time enforcement and allows implementing multiple contracts.
- Callers should depend on contracts, never concrete classes — that's what makes implementations swappable and testable.
- Keep contracts small and focused; a class can honor many small contracts at once.
