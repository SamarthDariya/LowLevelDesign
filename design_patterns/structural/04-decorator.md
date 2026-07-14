# Decorator

## Problem it solves

You need to add responsibilities to *individual objects*, in *any combination*, possibly *at runtime* — and subclassing can't keep up. Inheritance bakes features in at class-definition time and one class per combination explodes fast.

Concrete scenario: a coffee shop app. Base drinks (Espresso, House Blend) can each take add-ons: milk, mocha, whipped cream, extra shot — in any combination and any quantity ("double mocha with whip"). Subclassing gives you `EspressoWithMilk`, `EspressoWithMilkAndMocha`, `HouseBlendWithDoubleMochaWhip`… dozens of classes, and a price change to milk touches many of them. Worse, inheritance can't express *"two* mochas".

The Decorator pattern wraps the object instead: each add-on is a small class that implements the *same interface* as the drink, holds a reference to a drink, and adds its own cost/description on top of the wrapped one. Wrappers nest — `new Whip(new Mocha(new Mocha(new Espresso())))` — so combinations are built by composition at runtime, not by class explosion at design time.

## The Pattern

Participants:

- **Component** — the common interface (e.g. `Beverage`: `cost()`, `description()`).
- **Concrete Component** — the plain object being decorated (e.g. `Espresso`).
- **Decorator** — abstract wrapper: implements Component *and* holds a Component; delegates by default.
- **Concrete Decorators** — add behavior before/after delegating (e.g. `Mocha`, `Whip`).

```
            Component  (cost, description)
             ▲       ▲
             │       │
   ConcreteComponent Decorator ◇──── wraps: Component
      (Espresso)      ▲     delegates, then adds its bit
                      │
              Mocha  Milk  Whip

  new Whip(new Mocha(new Espresso()))
  cost():  Whip(0.7) + Mocha(0.9) + Espresso(2.5) = 4.1
```

Two crucial properties: the decorator is **type-compatible** with what it wraps (clients can't tell decorated from plain), and decorators are **stackable** (each wraps the result of the previous).

## Code Example

```javascript
// ---------- Component ----------
class Beverage {
  cost()        { throw new Error('not implemented'); }
  description() { throw new Error('not implemented'); }
}

// ---------- Concrete Components ----------
class Espresso extends Beverage {
  cost()        { return 2.5; }
  description() { return 'Espresso'; }
}

class HouseBlend extends Beverage {
  cost()        { return 1.8; }
  description() { return 'House Blend'; }
}

// ---------- Base Decorator ----------
// It IS a Beverage (same interface) and it HAS a Beverage (the wrappee).
class AddOn extends Beverage {
  #wrapped;
  constructor(beverage) {
    super();
    this.#wrapped = beverage;
  }
  get wrapped() { return this.#wrapped; }

  // Default behavior: pure pass-through. Subclasses add their delta.
  cost()        { return this.#wrapped.cost(); }
  description() { return this.#wrapped.description(); }
}

// ---------- Concrete Decorators ----------
class Mocha extends AddOn {
  cost()        { return super.cost() + 0.9; }
  description() { return super.description() + ', mocha'; }
}

class Milk extends AddOn {
  cost()        { return super.cost() + 0.4; }
  description() { return super.description() + ', milk'; }
}

class Whip extends AddOn {
  cost()        { return super.cost() + 0.7; }
  description() { return super.description() + ', whip'; }
}

// ---------- Client ----------
// Combinations are assembled at runtime by nesting constructors.
let order = new Espresso();
order = new Mocha(order);   // add mocha
order = new Mocha(order);   // add a SECOND mocha — impossible via subclassing
order = new Whip(order);

console.log(order.description()); // Espresso, mocha, mocha, whip
console.log(order.cost().toFixed(2)); // 5.00

// The client treats decorated and plain beverages identically:
function printReceipt(beverage) {
  console.log(`${beverage.description()} => $${beverage.cost().toFixed(2)}`);
}
printReceipt(new HouseBlend());
printReceipt(new Milk(new HouseBlend()));

// ---------- Second mini-example: notifier with channels ----------
class Notifier {
  send(msg) { console.log(`[App log] ${msg}`); }
}
class NotifierDecorator extends Notifier {
  #inner;
  constructor(inner) { super(); this.#inner = inner; }
  send(msg) { this.#inner.send(msg); } // delegate first
}
class EmailNotifier extends NotifierDecorator {
  send(msg) { super.send(msg); console.log(`[Email] ${msg}`); }
}
class SlackNotifier extends NotifierDecorator {
  send(msg) { super.send(msg); console.log(`[Slack] ${msg}`); }
}

// Stack channels per user preference at runtime:
const notifier = new SlackNotifier(new EmailNotifier(new Notifier()));
notifier.send('Deploy finished'); // logs to app log + email + slack
```

Run with `node decorator.js`. Note how each decorator calls `super.cost()` / `super.send()` — which reaches the base `AddOn` pass-through, which delegates to the wrapped object — then layers its own contribution.

## When to use / When NOT to use

**Use when:**
- Features must combine freely (add-ons, middlewares, formatting layers) and subclass-per-combination would explode.
- You want to add/remove responsibilities **at runtime**, per object — not per class.
- You can't modify the original class (sealed/third-party) but must extend behavior while keeping its interface.
- Cross-cutting wrappers: logging, caching, retry, compression, encryption around a core operation.

**Do NOT use when:**
- There's exactly one optional feature — a boolean flag or one subclass is simpler.
- Order-sensitive stacks would confuse users (encrypt-then-compress vs. compress-then-encrypt) and you can't control assembly.
- You need to *remove* a specific wrapper from the middle of a stack — decorators don't support that well.
- Identity matters: `decorated !== original`, so `instanceof ConcreteComponent` checks and equality comparisons break.

## Real-world usages

- **Express/Koa middleware**: each middleware wraps the next handler, adding auth/logging/compression — decorator-meets-chain-of-responsibility.
- **JS/TS decorators** (`@decorator` syntax, TC39 proposal / TypeScript): wrap classes and methods with logging, memoization, validation.
- Node streams: `zlib.createGzip()` piped around a file stream decorates it with compression; `crypto` streams add encryption.
- Higher-order functions/components: `React.memo(Component)`, Redux's `connect()`, `lodash.memoize(fn)` — all wrap a thing and return a same-shaped enhanced thing.

## Interview Notes

- Top question: **"Decorator vs. Inheritance?"** — inheritance is static, class-level, single-combination; decorator is dynamic, object-level, freely composable. Cite the class-explosion argument.
- **"Decorator vs. Proxy?"** — same wrapping shape; intent differs. Decorator *adds behavior* and is stacked openly by the client; Proxy *controls access* (lazy, caching, guarding) and usually hides the wrapping.
- **"Decorator vs. Adapter?"** — Decorator keeps the interface, Adapter changes it.
- Machine-coding problems: **pizza/coffee cost calculator** (the classic), notification service with channels, text formatting pipeline, car customization pricing.
- Java parallel worth naming: `BufferedReader(new InputStreamReader(...))` — interviewers love hearing you know the I/O stream stack is decorators.

## Quick Recap

- Decorator wraps an object with a same-interface layer that adds behavior, then delegates.
- Wrappers stack: combinations are assembled at runtime by nesting, avoiding subclass explosion.
- Client code cannot tell decorated from plain — that transparency is the contract.
- Perfect for add-ons and cross-cutting concerns (logging, caching, retry, compression).
- Same structure as Proxy — distinguish by intent: enhance (Decorator) vs. control access (Proxy).
