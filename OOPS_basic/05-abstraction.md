# Abstraction

## What is it?

**Abstraction** means exposing *what* something does while hiding *how* it does it. You design a simple, stable surface (the essential operations) and bury the messy details underneath. Where encapsulation hides *data* to protect it, abstraction hides *complexity* to make things usable — the two are cousins, and interviews often ask you to distinguish them.

The textbook analogy is **driving a car**. The interface is tiny: steering wheel, two or three pedals, a gear selector. Underneath: combustion, fuel injection, torque converters, traction control — thousands of parts you never think about. The pedal is an *abstraction* over the engine. Better yet: the same interface works whether the car is petrol, diesel, or electric. You learned "car," not "this specific drivetrain." Good abstractions make wildly different implementations interchangeable.

In code, abstraction shows up at two levels. First, **within a class**: public methods express intent (`sendNotification()`), private `#methods` hold the plumbing (formatting, retries, connection handling). Second, **across classes**: an *abstract base class* defines operations every subtype must provide (`process()`) without saying how, and concrete subclasses fill in the details. JavaScript has no `abstract` keyword, so we simulate it: a base class whose "abstract" methods throw `Error("not implemented")`, and (optionally) a constructor that refuses direct instantiation.

A powerful companion idea is the **Template Method** flavor of abstraction: the base class writes the *skeleton* of an algorithm (validate → execute → record) as a concrete method, and delegates only the varying step to abstract methods. Callers see one simple entry point; subclasses customize exactly one well-defined slot.

## Why does it matter in LLD?

LLD interviews are essentially abstraction-design exercises. When asked to "design a payment system," the winning move is to define a `PaymentProcessor` abstraction with a small contract (`process(amount)`, `refund(txnId)`), then hang `StripeProcessor`, `RazorpayProcessor`, etc. off it. The interviewer's follow-up — *"now add PayPal"* — becomes trivial, and your checkout code never changes. Choosing the right abstraction boundary IS the design skill being tested.

In real codebases, abstraction is what keeps modules decoupled. Your business logic talks to a `Storage` abstraction, not to "PostgreSQL with this connection pool"; swap in an in-memory version for tests without touching business code. Every architecture buzzword — ports and adapters, dependency inversion, repository pattern — is this one idea applied consistently.

Also memorize the comparison question, because it's asked constantly: **encapsulation** hides internal *state* (implementation-level, achieved with private fields), while **abstraction** hides internal *complexity* and exposes essential behavior (design-level, achieved with contracts/abstract classes). Encapsulation is a technique; abstraction is a design decision.

## Code Example

```javascript
// notifications.js — run with: node notifications.js

// ---- Abstract base class (simulated — JS has no `abstract` keyword) ----
class NotificationChannel {
  constructor(name) {
    // Block direct instantiation of the abstract class:
    if (new.target === NotificationChannel) {
      throw new Error("NotificationChannel is abstract — extend it instead");
    }
    this.name = name;
  }

  // "Abstract methods": subclasses MUST override, or get a loud error.
  deliver(recipient, body) {
    throw new Error(`${this.constructor.name} must implement deliver()`);
  }

  maxLength() {
    throw new Error(`${this.constructor.name} must implement maxLength()`);
  }

  // ---- TEMPLATE METHOD: the shared algorithm, written ONCE ----
  // Callers use only this. The varying step (deliver) is delegated.
  send(recipient, message) {
    const body = this.#truncate(message);        // hidden detail
    console.log(`[${this.name}] preparing message for ${recipient}...`);
    this.deliver(recipient, body);               // dispatches to the subclass
    this.#audit(recipient, body);                // hidden detail
  }

  // Private helpers: complexity the outside world never sees.
  #truncate(message) {
    const limit = this.maxLength();
    return message.length > limit ? message.slice(0, limit - 3) + "..." : message;
  }

  #audit(recipient, body) {
    console.log(`[audit] ${this.name} → ${recipient} (${body.length} chars)`);
  }
}

// ---- Concrete implementations: each hides ITS OWN messy details ----
class EmailChannel extends NotificationChannel {
  constructor() {
    super("email");
  }
  maxLength() {
    return 10000;
  }
  deliver(recipient, body) {
    // Imagine SMTP handshakes, MIME encoding, retry logic here...
    console.log(`  ✉️  Emailing ${recipient}: "${body}"`);
  }
}

class SmsChannel extends NotificationChannel {
  constructor() {
    super("sms");
  }
  maxLength() {
    return 40; // SMS is short!
  }
  deliver(recipient, body) {
    // Imagine telecom gateway APIs, delivery receipts here...
    console.log(`  📱 Texting ${recipient}: "${body}"`);
  }
}

// ---- Caller code: depends ONLY on the abstraction ----
function notifyAll(channels, recipient, message) {
  for (const ch of channels) {
    ch.send(recipient, message); // what, not how
  }
}

const channels = [new EmailChannel(), new SmsChannel()];
notifyAll(channels, "dariya@example.com",
  "Your order #4211 has shipped and will arrive Tuesday between 9am and 5pm.");
// Email sends the full text; SMS auto-truncates — caller neither knows nor cares.

// ---- The abstraction defends itself ----
try {
  new NotificationChannel("raw"); // can't instantiate the abstract class
} catch (e) {
  console.log("Blocked:", e.message);
}

class PushChannel extends NotificationChannel {
  constructor() {
    super("push");
  } // forgot to implement deliver() and maxLength()!
}
try {
  new PushChannel().send("device-42", "hello");
} catch (e) {
  console.log("Blocked:", e.message); // PushChannel must implement maxLength()
}
```

What this demonstrates:

- `new.target` check = "abstract class" (cannot instantiate directly).
- Throwing stubs = "abstract methods" (subclasses must implement, errors are loud and early).
- `send()` is a **template method**: shared skeleton in the base, varying step in children.
- `notifyAll` sees only the abstraction — implementations are swappable.

## Common Mistakes

- **Confusing abstraction with encapsulation** — private fields protect *state* (encapsulation); abstract contracts hide *complexity and variation* (abstraction). Interviewers ask this distinction directly.
- **Leaky abstractions** — a method like `sendViaSmtpPort587()` in the public API leaks the implementation into the contract. Name operations by *intent* (`send`), not mechanism.
- **Abstracting too early / too much** — creating `AbstractNotificationChannelFactoryProvider` for a system with one channel is over-engineering. Introduce the abstraction when a second implementation appears (or is clearly coming).
- **Silent unimplemented methods** — a subclass missing an override in JS just returns `undefined` at runtime. Always make base-class stubs `throw` so mistakes surface immediately.
- **Fat contracts** — an abstract class demanding 12 methods forces every subclass to implement things it doesn't need. Keep contracts minimal (this becomes the Interface Segregation Principle in SOLID).

## Interview Notes

- Top-3 frequency question: *"Difference between abstraction and encapsulation?"* Have a two-sentence answer ready (hide complexity/behavior vs hide data/state; design level vs implementation level).
- In design rounds, name your abstractions out loud: *"I'll define an abstract `Piece` with an abstract `getValidMoves()` — the board only ever talks to that."* Stating the contract first structures the whole interview.
- Expect *"JS has no abstract classes — what do you do?"* Answer: `new.target` guard + throwing method stubs; or TypeScript's real `abstract` keyword in typed codebases.
- Template Method comes up as a follow-up: "where does shared logic live?" — in a concrete base-class method that calls abstract steps.
- Tie it to testing when you can: an abstraction over storage/payments lets you inject a fake implementation in tests — interviewers reward this practical angle.

## Quick Recap

- Abstraction = expose *what*, hide *how*; users interact with a simple, intent-named surface.
- Simulate abstract classes in JS: `new.target` check blocks direct instantiation; abstract methods throw until overridden.
- Template Method: base class owns the algorithm skeleton; subclasses fill in the varying steps.
- Encapsulation hides state; abstraction hides complexity — know the distinction cold.
- Depend on abstractions in caller code so implementations stay swappable (this becomes SOLID's Dependency Inversion).
