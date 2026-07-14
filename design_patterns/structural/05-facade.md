# Facade

## Problem it solves

Real systems are built from many collaborating subsystems, each with its own API, initialization order, and quirks. If client code talks to all of them directly, every caller must know the full choreography — and repeats it.

Concrete scenario: placing an order in an e-commerce app touches an `InventoryService` (reserve stock), `PaymentService` (charge the card), `ShippingService` (create a shipment), and `NotificationService` (email the customer) — *in that order*, with rollback if payment fails. If the checkout page, the mobile API, and the admin "manual order" screen each wire these four services together themselves, the sequence logic is duplicated three times, and any change (add a fraud check) means hunting down every call site.

The Facade pattern introduces one class — `OrderFacade.placeOrder()` — that encapsulates the whole workflow behind a single, intention-revealing method. Clients depend on one simple interface; the messy orchestration lives in exactly one place. Importantly, the facade doesn't *hide* the subsystems from power users — advanced code can still reach past it when needed.

## The Pattern

Participants:

- **Facade** — a class exposing a simple, task-oriented interface (`placeOrder`, `watchMovie`); internally calls subsystem objects in the right order.
- **Subsystem classes** — the real workers (`InventoryService`, `PaymentService`, …). They don't know the facade exists.
- **Client** — calls the facade instead of juggling subsystems.

```
Client ──▶ OrderFacade.placeOrder()
              │
              ├──▶ InventoryService.reserve()
              ├──▶ PaymentService.charge()
              ├──▶ ShippingService.createShipment()
              └──▶ NotificationService.sendEmail()

(Client may still call a subsystem directly for advanced needs — the
 facade is a convenience layer, not a wall.)
```

## Code Example

```javascript
// ---------- Subsystems: each does one job, knows nothing of the others ----------
class InventoryService {
  #stock = new Map([['book-101', 5], ['pen-202', 0]]);

  reserve(sku, qty) {
    const available = this.#stock.get(sku) ?? 0;
    if (available < qty) throw new Error(`Out of stock: ${sku}`);
    this.#stock.set(sku, available - qty);
    console.log(`[Inventory] Reserved ${qty} x ${sku}`);
  }
  release(sku, qty) { // used for rollback
    this.#stock.set(sku, (this.#stock.get(sku) ?? 0) + qty);
    console.log(`[Inventory] Released ${qty} x ${sku}`);
  }
}

class PaymentService {
  charge(card, amount) {
    if (!card.startsWith('4')) throw new Error('Card declined');
    console.log(`[Payment] Charged $${amount} to card ${card.slice(-4)}`);
    return `txn_${Date.now()}`;
  }
}

class ShippingService {
  createShipment(sku, qty, address) {
    const id = `ship_${Math.floor(Math.random() * 10000)}`;
    console.log(`[Shipping] ${qty} x ${sku} -> ${address} (${id})`);
    return id;
  }
}

class NotificationService {
  sendEmail(to, subject) {
    console.log(`[Notify] Email to ${to}: "${subject}"`);
  }
}

// ---------- Facade: one simple method, all orchestration inside ----------
class OrderFacade {
  #inventory = new InventoryService();
  #payment = new PaymentService();
  #shipping = new ShippingService();
  #notify = new NotificationService();

  placeOrder({ sku, qty, card, amount, email, address }) {
    console.log(`--- Placing order: ${qty} x ${sku} ---`);
    this.#inventory.reserve(sku, qty);
    let txnId;
    try {
      txnId = this.#payment.charge(card, amount);
    } catch (err) {
      // Orchestration knowledge (rollback) lives HERE, not in every client.
      this.#inventory.release(sku, qty);
      console.log(`Order failed: ${err.message}`);
      return { success: false, reason: err.message };
    }
    const shipmentId = this.#shipping.createShipment(sku, qty, address);
    this.#notify.sendEmail(email, `Order confirmed (${txnId})`);
    return { success: true, txnId, shipmentId };
  }
}

// ---------- Client: one line instead of a four-service dance ----------
const orders = new OrderFacade();

const ok = orders.placeOrder({
  sku: 'book-101', qty: 2, card: '4242424242424242',
  amount: 39.98, email: 'sam@example.com', address: 'Bengaluru',
});
console.log('Result:', ok);

const declined = orders.placeOrder({
  sku: 'book-101', qty: 1, card: '5555444433331111', // non-Visa: declined
  amount: 19.99, email: 'sam@example.com', address: 'Bengaluru',
});
console.log('Result:', declined); // stock was rolled back
```

Run with `node facade.js`. Notice the failure path: the facade knows to release reserved stock when payment declines — logic no client should have to remember.

## When to use / When NOT to use

**Use when:**
- Common tasks require calling several subsystems in a specific order — centralize the choreography.
- You want to layer your system: high-level API for 90% of callers, subsystems still reachable for the 10% with special needs.
- You're decoupling clients from a complex/volatile library so its churn doesn't ripple through your codebase.
- Onboarding/testing: a facade gives one obvious seam to mock instead of five services.

**Do NOT use when:**
- The subsystem is already simple — a facade over one class is pointless ceremony.
- The facade starts accumulating business logic of its own and knowing everything — that's the **God Object** anti-pattern; keep it a thin orchestrator, or split into several task-focused facades.
- Clients genuinely need fine-grained control over every step — forcing them through a coarse method makes the API worse.

## Real-world usages

- `fetch()` / `axios` are facades over connection handling, request serialization, redirects, and response parsing.
- `jQuery`'s `$` was historically a facade over inconsistent DOM/XHR/event browser APIs.
- ORMs: `User.create({...})` in Sequelize/Prisma hides connection pooling, SQL generation, parameter binding, and result mapping.
- Build tools: the `vite`/`webpack` CLI is a facade over bundling, transpiling, dev-server, and HMR subsystems.

## Interview Notes

- Most-asked: **"Facade vs. Adapter?"** — Adapter makes an interface *match an existing contract* (usually 1 class → 1 class); Facade *invents a new simpler interface* over many classes. Adapter enables compatibility; Facade enables convenience.
- **"Facade vs. Mediator?"** — Facade is one-way (clients → subsystems; subsystems unaware of facade); Mediator centralizes *peer-to-peer* communication and colleagues know the mediator.
- Say the phrase **"principle of least knowledge / Law of Demeter"** — facade is its poster child (clients talk to one friend, not friends-of-friends).
- Machine-coding problems: order checkout flow, home-theater startup (`watchMovie()`), travel booking (flights + hotel + cab), compiler front door (`compile()` over lexer/parser/codegen).
- Common trap: don't let the interviewer see you stuff validation/pricing/business rules into the facade — orchestrate, delegate, stay thin.

## Quick Recap

- Facade = one simple, task-oriented entry point over a set of subsystems.
- It orchestrates order, error handling, and rollback in one place; clients shrink to one call.
- Subsystems stay independent and directly accessible — the facade is convenience, not a barrier.
- Reduces coupling: clients depend on the facade, not on N subsystem APIs.
- Keep it thin; a fat facade drifts into a God Object.
