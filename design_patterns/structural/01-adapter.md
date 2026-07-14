# Adapter

## Problem it solves

You have existing code that expects one interface, and a class (often third-party or legacy) that offers the *same capability* through a *different interface*. You cannot change either side easily: the client code is spread across your app, and the legacy/third-party code is not yours to edit (or is too risky to touch).

Concrete scenario: your e-commerce checkout was built against a modern payment interface — `pay(amountInRupees, currency)` returning a promise-like result object. The company then signs a deal with an old payment provider whose SDK exposes `makePayment(amountInPaise, callbackStyleResult)` with different units, different method names, and a different result shape. Rewriting checkout for every provider quirk would scatter provider-specific code everywhere. Rewriting the provider SDK is impossible.

The Adapter pattern puts a translation layer between the two: a class that *implements the interface your code expects* and *internally delegates to the incompatible class*, converting method names, argument formats, units, and return shapes. Your checkout code stays clean and provider-agnostic.

## The Pattern

Participants:

- **Target** — the interface the client expects (e.g. `PaymentProcessor` with `pay()`).
- **Adaptee** — the existing/legacy class with an incompatible interface (e.g. `LegacyPaymentGateway`).
- **Adapter** — implements Target, holds a reference to Adaptee, and translates calls.
- **Client** — code written against Target; never sees the Adaptee.

```
Client ──▶ Target (interface)
              ▲
              │ implements
          Adapter ──────────▶ Adaptee
          pay(amount) {        makePayment(paise)
            // translate:
            adaptee.makePayment(amount * 100)
          }
```

Two flavors exist in class-based languages: *object adapter* (composition — adapter wraps an adaptee instance; shown above) and *class adapter* (multiple inheritance). JavaScript has no multiple inheritance, so you almost always use the object adapter.

## Code Example

```javascript
// ---------- Target interface ----------
// JS has no `interface` keyword; we document the contract with a base class
// that throws if not implemented (a common LLD convention).
class PaymentProcessor {
  // Contract: pay(amountInRupees, currency) -> { success, transactionId }
  pay(amount, currency) {
    throw new Error('pay() must be implemented');
  }
}

// ---------- A modern implementation (already matches Target) ----------
class RazorPayProcessor extends PaymentProcessor {
  pay(amount, currency) {
    console.log(`[RazorPay] Charging ${amount} ${currency}`);
    return { success: true, transactionId: `rzp_${Date.now()}` };
  }
}

// ---------- Adaptee: legacy SDK we CANNOT modify ----------
// Different method name, expects paise (not rupees), no currency support,
// and returns a totally different result shape.
class LegacyPaymentGateway {
  makePayment(amountInPaise) {
    console.log(`[LegacyGateway] makePayment(${amountInPaise} paise)`);
    return { status: 'OK', ref_no: Math.floor(Math.random() * 100000) };
  }
}

// ---------- Adapter ----------
class LegacyPaymentAdapter extends PaymentProcessor {
  #gateway; // composition: wrap the adaptee

  constructor(gateway) {
    super();
    this.#gateway = gateway;
  }

  pay(amount, currency) {
    if (currency !== 'INR') {
      // The legacy gateway only supports INR — the adapter can also
      // guard/translate constraints, not just method names.
      throw new Error('Legacy gateway supports INR only');
    }
    // Translate units: rupees -> paise
    const legacyResult = this.#gateway.makePayment(Math.round(amount * 100));
    // Translate result shape: legacy -> Target contract
    return {
      success: legacyResult.status === 'OK',
      transactionId: `legacy_${legacyResult.ref_no}`,
    };
  }
}

// ---------- Client code: knows ONLY the Target interface ----------
function checkout(processor, amount) {
  const result = processor.pay(amount, 'INR');
  console.log(
    result.success
      ? `Payment done. Txn: ${result.transactionId}`
      : 'Payment failed'
  );
}

// Both work interchangeably — the client cannot tell the difference.
checkout(new RazorPayProcessor(), 499);
checkout(new LegacyPaymentAdapter(new LegacyPaymentGateway()), 499);
```

Run with `node adapter.js`. Output shows both processors handling the same `checkout` call, with the adapter silently converting rupees to paise and reshaping the result.

## When to use / When NOT to use

**Use when:**
- You must integrate a class whose interface doesn't match what your code expects, and you can't (or shouldn't) modify either side.
- You are wrapping third-party SDKs / legacy modules so the rest of the codebase depends only on your own interface.
- You want to swap vendors (payment, SMS, storage) behind one stable contract.

**Do NOT use when:**
- You own both sides — just refactor one interface to match the other; an adapter adds indirection for no gain.
- The "adaptation" is a single trivial rename used in one place — a small wrapper function is enough.
- The interfaces differ in *behavior*, not just shape (e.g. sync vs. streaming semantics) — an adapter can't paper over fundamentally different capabilities.

## Real-world usages

- Node's `util.promisify` adapts callback-style `(err, data)` APIs to the Promise interface modern code expects.
- Database/ORM drivers: Sequelize and Knex "dialects" adapt one query API to Postgres/MySQL/SQLite wire protocols.
- `fetch` polyfills/wrappers (e.g. `axios` adapters) adapt `XMLHttpRequest` or Node's `http` module to a single HTTP client interface.
- Redux/state libraries adapting browser `localStorage` vs. `AsyncStorage` behind one persistence interface.

## Interview Notes

- Classic question: **"Adapter vs. Facade?"** — Adapter changes an interface to match an *existing expected contract* (usually wraps one class); Facade invents a *new simpler interface* over a whole subsystem.
- **"Adapter vs. Decorator?"** — Adapter *changes* the interface, Decorator *keeps* the interface and adds behavior.
- Machine-coding problems where it shows up: payment gateway integration, notification service with multiple vendors (SMS/email providers with different SDKs), file-storage abstraction (S3 vs. local disk), ride-fare or map providers.
- Be ready to mention *object adapter vs. class adapter* and why JS uses composition.
- Good senior-level point: adapters are where you isolate *anti-corruption layers* in domain-driven design — third-party models never leak into your domain.

## Quick Recap

- Adapter = translator: makes an incompatible interface conform to the one clients expect.
- Client depends only on the Target interface; the Adaptee is hidden inside the Adapter.
- Prefer composition (object adapter) in JavaScript.
- Translates method names, argument units/shapes, and return values — it must not add new behavior (that's Decorator's job).
- Reach for it at integration boundaries: SDKs, legacy code, vendor swaps.
