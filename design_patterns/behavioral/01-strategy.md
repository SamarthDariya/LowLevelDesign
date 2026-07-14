# Strategy

## Problem it solves

Imagine you are building the checkout flow of an e-commerce app. On day one, customers can only pay by credit card, so you write the payment logic straight into the `ShoppingCart` class. A month later, product asks for PayPal. Then UPI. Then gift cards, then "buy now pay later". Each time, you crack open `ShoppingCart.checkout()` and add another `if/else if` branch. The method grows into a tangle of unrelated logic: card validation next to PayPal API calls next to UPI VPA regexes.

This design has three concrete pains. First, `ShoppingCart` changes every time a payment method is added or tweaked — it has many reasons to change, violating the Single Responsibility Principle. Second, you cannot add a payment method without editing (and risking) existing, working code — violating the Open/Closed Principle. Third, the payment algorithms cannot be tested or reused in isolation; they only exist as branches inside a giant method.

The Strategy pattern solves this by pulling each algorithm out into its own class behind a common interface, and letting the client hand the cart *which* algorithm to use. The cart no longer knows how payments work — it only knows that "some payment strategy" can `pay(amount)`. Choosing behavior becomes plugging in an object rather than branching on a flag.

## The Pattern

**Intent:** Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from the clients that use it.

Participants:

- **Strategy (interface):** the common contract all algorithms implement (`pay(amount)`, `validate()`).
- **Concrete Strategies:** one class per algorithm (`CreditCardPayment`, `PayPalPayment`, `UpiPayment`).
- **Context:** the class that needs the behavior (`ShoppingCart`). It holds a reference to a Strategy and delegates to it. It never inspects which concrete strategy it has.
- **Client:** creates the concrete strategy and injects it into the context (via constructor or setter).

```
+----------------+          +---------------------+
|    Context     |          |  <<Strategy>>       |
|  ShoppingCart  |--------->|  + pay(amount)      |
|  - strategy    | delegates|  + validate()       |
|  + checkout()  |          +----------^----------+
+----------------+                     |
                        +--------------+---------------+
                        |              |               |
              +---------+----+  +------+-------+  +----+---------+
              | CreditCard   |  | PayPal       |  | Upi          |
              | Payment      |  | Payment      |  | Payment      |
              +--------------+  +--------------+  +--------------+
```

The key relationship is **composition + delegation**: the context *has a* strategy and forwards the work, instead of *implementing* the work itself or *inheriting* it.

## Code Example

Payment methods for a shopping cart. Save as `strategy.js` and run with `node strategy.js`.

```javascript
// ----- Strategy interface (informal in JS: any object with pay()) -----
// We use an abstract base class to make the contract explicit.
class PaymentStrategy {
  pay(amount) {
    throw new Error('pay() must be implemented');
  }
  validate() {
    throw new Error('validate() must be implemented');
  }
}

// ----- Concrete strategies: one class per algorithm -----
class CreditCardPayment extends PaymentStrategy {
  #cardNumber;
  #cvv;

  constructor(cardNumber, cvv) {
    super();
    this.#cardNumber = cardNumber;
    this.#cvv = cvv;
  }

  validate() {
    return this.#cardNumber.length === 16 && this.#cvv.length === 3;
  }

  pay(amount) {
    const masked = `****${this.#cardNumber.slice(-4)}`;
    console.log(`Paid $${amount} with credit card ${masked}`);
  }
}

class PayPalPayment extends PaymentStrategy {
  #email;

  constructor(email) {
    super();
    this.#email = email;
  }

  validate() {
    return this.#email.includes('@');
  }

  pay(amount) {
    console.log(`Paid $${amount} via PayPal account ${this.#email}`);
  }
}

class UpiPayment extends PaymentStrategy {
  #vpa; // virtual payment address, e.g. name@bank

  constructor(vpa) {
    super();
    this.#vpa = vpa;
  }

  validate() {
    return /^[\w.]+@[\w]+$/.test(this.#vpa);
  }

  pay(amount) {
    console.log(`Paid $${amount} via UPI (${this.#vpa})`);
  }
}

// ----- Context: uses a strategy, never knows which one -----
class ShoppingCart {
  #items = [];
  #paymentStrategy = null;

  addItem(name, price) {
    this.#items.push({ name, price });
    return this;
  }

  // The strategy is swappable at runtime — this is the whole point.
  setPaymentStrategy(strategy) {
    this.#paymentStrategy = strategy;
  }

  checkout() {
    if (!this.#paymentStrategy) {
      throw new Error('No payment method selected');
    }
    if (!this.#paymentStrategy.validate()) {
      throw new Error('Payment details are invalid');
    }
    const total = this.#items.reduce((sum, item) => sum + item.price, 0);
    this.#paymentStrategy.pay(total); // delegate — no if/else on payment type
  }
}

// ----- Client code -----
const cart = new ShoppingCart()
  .addItem('Mechanical keyboard', 120)
  .addItem('Mouse', 45);

cart.setPaymentStrategy(new CreditCardPayment('1234567890123456', '123'));
cart.checkout(); // Paid $165 with credit card ****3456

// Same cart, different algorithm — zero changes to ShoppingCart:
cart.setPaymentStrategy(new PayPalPayment('sam@example.com'));
cart.checkout(); // Paid $165 via PayPal account sam@example.com

cart.setPaymentStrategy(new UpiPayment('sam@okbank'));
cart.checkout(); // Paid $165 via UPI (sam@okbank)
```

JS note: because functions are first-class, a "lightweight strategy" is often just a function you pass in (like a sort comparator). Use classes when a strategy has its own state or several related methods; use plain functions when it is a single operation.

## When to use / When NOT to use

**Use when:**

- You have multiple interchangeable ways to do the same thing (payment, routing, compression, pricing, discount rules).
- A class is full of conditionals (`if/else` or `switch`) that select between variants of one behavior.
- You want to choose or swap an algorithm at runtime (user setting, feature flag, A/B test).
- You want each algorithm unit-testable in isolation.

**Avoid when:**

- There are only two simple variants that will realistically never grow — a plain conditional is clearer and shorter.
- The variants differ in *data*, not *behavior* — a configuration object may be enough.
- Clients would have to understand the differences between strategies deeply just to pick one; sometimes a Factory choosing the strategy for them is the missing half of the design.

## Real-world usages

- `Array.prototype.sort(comparator)` — the comparator function is a strategy injected into the sort algorithm.
- Passport.js authentication — literally named "strategies" (`LocalStrategy`, `JwtStrategy`, `GoogleStrategy`) plugged into one auth framework.
- Express/multer storage engines and webpack minimizers — swappable behavior objects behind a fixed contract.
- Compression middleware choosing gzip vs brotli, or a maps app choosing driving/walking/transit route calculation.

## Interview Notes

- **Most-asked distinction:** Strategy vs State. Both swap behavior objects at runtime; in Strategy the *client* picks the algorithm and strategies don't know about each other, while in State the *object itself* transitions between states and states often trigger the next transition.
- **Strategy vs Factory:** they compose — a Factory decides *which* strategy object to create from an input (e.g. `"UPI"` string), Strategy defines *how* it behaves. Interviewers love this combo in machine coding.
- **Machine-coding problems that expect Strategy:** Splitwise (equal/exact/percentage split strategies), Chess (per-piece movement strategies), Parking Lot (fee/slot-allocation strategies), Ride-sharing (pricing and matching strategies), Snake & Ladder (dice strategies).
- Be ready to say which SOLID principles it serves: Open/Closed (add algorithms without touching the context) and Single Responsibility (each algorithm lives alone).
- In JavaScript, mention that plain functions can serve as strategies — showing you know the idiomatic version scores points.

## Quick Recap

- Pull each interchangeable algorithm into its own class (or function) behind one contract.
- The context *delegates* to the strategy and never branches on its type.
- Strategies are chosen by the client and swappable at runtime.
- Kills `if/else` ladders; new variants = new class, no edits to existing code.
- Remember: client picks → Strategy; object transitions itself → State.
