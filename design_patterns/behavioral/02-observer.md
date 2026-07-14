# Observer

## Problem it solves

You are building a stock trading dashboard. When a stock's price changes, several things must happen: the on-screen ticker updates, a price-alert service checks thresholds, an audit log records the change, and maybe a portfolio recalculates its value. The naive approach is to make the `Stock` class call each of these directly: `display.refresh()`, `alertService.check()`, `logger.record()`, ...

Now `Stock` — a piece of core domain data — is hard-coupled to every UI widget and side service in the app. Adding a new consumer means editing `Stock`. Removing one means editing `Stock`. Testing `Stock` means constructing a display, an alert service, and a logger. The dependency arrows point the wrong way: low-level infrastructure should depend on domain objects, not the reverse.

The Observer pattern inverts this. The stock keeps an anonymous list of "things that want to know" and, when its state changes, walks the list calling a single agreed method (`update`). It neither knows nor cares whether an observer is a UI widget, a logger, or a test double. Consumers subscribe and unsubscribe themselves at runtime. This one-to-many, publish/subscribe relationship is arguably the most used pattern in all of software — it is the beating heart of every event system.

## The Pattern

**Intent:** Define a one-to-many dependency between objects so that when one object (the subject) changes state, all its dependents (observers) are notified automatically.

Participants:

- **Subject (Observable/Publisher):** holds state plus a collection of observers; offers `subscribe`/`unsubscribe`; calls `notify` on state change.
- **Observer (Subscriber/Listener) interface:** the single callback contract, usually `update(...)`.
- **Concrete Observers:** each implements `update` with its own reaction.
- Notification style: **push** (subject sends the changed data in `update(data)`) vs **pull** (subject sends only itself; observers query what they need).

```
+---------------------+            +--------------------+
|      Subject        |  notifies  |  <<Observer>>      |
|  Stock              |----------->|  + update(...)     |
|  - observers: Set   |  1     *   +---------^----------+
|  + subscribe(o)     |                      |
|  + unsubscribe(o)   |      +---------------+----------------+
|  + setPrice(p) ─┐   |      |               |                |
+-----------------│---+ +----+-----+  +------+-----+  +-------+----+
                  └──── | Price    |  | Price      |  | Trade      |
                 notify | Display  |  | Alert      |  | Logger     |
                        +----------+  +------------+  +------------+
```

## Code Example

A stock ticker with three kinds of subscribers. Save as `observer.js` and run with `node observer.js`.

```javascript
// ----- Subject (a.k.a. Observable / Publisher) -----
class Stock {
  #symbol;
  #price;
  #observers = new Set(); // Set prevents double-subscription

  constructor(symbol, initialPrice) {
    this.#symbol = symbol;
    this.#price = initialPrice;
  }

  get symbol() { return this.#symbol; }
  get price()  { return this.#price; }

  subscribe(observer) {
    this.#observers.add(observer);
    return () => this.unsubscribe(observer); // return an "unsubscribe" handle
  }

  unsubscribe(observer) {
    this.#observers.delete(observer);
  }

  // Changing the price triggers a notification to every observer.
  setPrice(newPrice) {
    const oldPrice = this.#price;
    this.#price = newPrice;
    this.#notify(oldPrice, newPrice);
  }

  #notify(oldPrice, newPrice) {
    for (const observer of this.#observers) {
      observer.update(this, oldPrice, newPrice); // push the change to observers
    }
  }
}

// ----- Concrete observers: each reacts in its own way -----
class PriceDisplay {
  update(stock, oldPrice, newPrice) {
    const arrow = newPrice >= oldPrice ? '▲' : '▼';
    console.log(`[Display] ${stock.symbol}: $${newPrice} ${arrow}`);
  }
}

class PriceAlert {
  #threshold;

  constructor(threshold) {
    this.#threshold = threshold;
  }

  update(stock, _oldPrice, newPrice) {
    if (newPrice > this.#threshold) {
      console.log(`[Alert] ${stock.symbol} crossed $${this.#threshold}!`);
    }
  }
}

class TradeLogger {
  #log = [];

  update(stock, oldPrice, newPrice) {
    this.#log.push({ symbol: stock.symbol, oldPrice, newPrice });
    console.log(`[Logger] recorded change #${this.#log.length}`);
  }
}

// ----- Client code -----
const apple = new Stock('AAPL', 210);

const display = new PriceDisplay();
apple.subscribe(display);
apple.subscribe(new PriceAlert(220));
const unsubscribeLogger = apple.subscribe(new TradeLogger());

apple.setPrice(215); // display + logger react; alert stays quiet
console.log('---');
apple.setPrice(225); // all three react; alert fires
console.log('---');

unsubscribeLogger();     // logger stops caring
apple.unsubscribe(display);
apple.setPrice(230);     // only the alert reacts now
```

JS note: in idiomatic Node you would often use the built-in `EventEmitter` (`stock.on('price-change', handler)`) — same pattern, with event names instead of an `update` method and plain functions as observers.

## When to use / When NOT to use

**Use when:**

- A change in one object must trigger reactions in an unknown or changing set of other objects.
- You want the publisher decoupled from its consumers (it should compile/test without them).
- Consumers come and go at runtime (UI widgets mounting/unmounting, plugins, WebSocket clients).
- You are modeling genuinely event-shaped domains: notifications, market data, sensors, domain events.

**Avoid when:**

- There is exactly one, permanent, known receiver — a direct method call is simpler and easier to trace.
- Update order matters and observers depend on each other — Observer makes ordering implicit and fragile (consider Mediator or an explicit pipeline).
- Notification chains can cascade (observer updates subject, which notifies observers...) — risk of infinite loops and "spooky action at a distance" during debugging.
- You forget cleanup: dangling subscriptions are the classic memory-leak source (the "lapsed listener" problem).

## Real-world usages

- Node.js `EventEmitter` — `on`/`emit` is Observer verbatim; streams, HTTP servers, and process signals are all built on it.
- DOM events — `element.addEventListener('click', fn)` subscribes an observer to a subject.
- RxJS `Observable`/`Subscriber`, and framework reactivity systems (Vue's reactive dependencies, MobX) — Observer with extra machinery.
- Redux `store.subscribe(listener)`, and message systems like Kafka topics or webhooks — publish/subscribe at architecture scale.

## Interview Notes

- **Classic question:** push vs pull notification — push sends data with the event (simple, may over-send), pull sends just a reference and lets observers query (flexible, chattier). Know both.
- **Observer vs Mediator:** Observer is one-to-many broadcast from a subject; Mediator centralizes many-to-many communication between peers. Observer decouples subject from receivers; Mediator decouples colleagues from each other.
- **Observer vs Pub/Sub:** in textbook Observer, subject and observers reference each other directly; in Pub/Sub a broker/event-bus sits between them, so publisher and subscriber don't know each other at all.
- **Machine-coding problems that expect Observer:** Stock trading system, Notification service, Splitwise (notify users on expense add), Elevator (floor displays observing car position), Logging framework, Cricket-scoreboard/live-score systems.
- Mention pitfalls to stand out: memory leaks from un-removed listeners, error handling (one throwing observer shouldn't kill the loop), and unspecified notification order.

## Quick Recap

- One subject, many observers; subject broadcasts `update` on state change.
- Subject depends only on the observer *interface* — never on concrete consumers.
- Subscribe/unsubscribe at runtime; always clean up listeners to avoid leaks.
- Node's `EventEmitter` and DOM events are this pattern; recognize it instantly.
- Know push vs pull, and Observer vs Mediator vs Pub/Sub distinctions.
