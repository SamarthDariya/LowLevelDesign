# Singleton

## Problem it solves

Some objects genuinely must exist **exactly once** in a running application: a logger, an application-wide configuration object, a database connection pool, a cache. If two parts of your codebase each create their own copy, you get subtle bugs — two connection pools both holding sockets, two config objects that drift out of sync, two loggers writing to the same file and interleaving lines.

Concrete scenario: you build a `Logger` that buffers log lines and periodically flushes them to disk. Module A does `new Logger()`, module B does `new Logger()`. Now there are two buffers and two flush timers fighting over one file. Log lines get lost or duplicated, and the "total logs written" counter in each instance is wrong because each only sees half the traffic. What you actually wanted was one shared instance with one buffer.

The naive fix — creating the object in `main()` and passing it into every function — works but is noisy, and it doesn't *prevent* someone from calling `new Logger()` anyway. Singleton solves both halves of the problem: it **guarantees a single instance** and it **provides one global access point** to it.

## The Pattern

Singleton makes the class itself responsible for its only instance:

1. Make the constructor inaccessible (or make it throw) so clients can't do `new` freely.
2. Keep the single instance in a **private static field** on the class.
3. Expose a **static access method** (conventionally `getInstance()`) that lazily creates the instance on first call and returns the same one forever after.

**Participants:**

| Role | Responsibility |
|---|---|
| `Singleton` class | Owns its one instance, guards construction, exposes `getInstance()` |
| Client | Never uses `new`; always calls `Singleton.getInstance()` |

```
+---------------------------+
|         Logger            |
+---------------------------+
| - static #instance        |   <- private static, holds THE object
| - #logs                   |
+---------------------------+
| - constructor()  (guarded)|
| + static getInstance() ---+---> returns the same #instance every time
| + info(msg) / error(msg)  |
+---------------------------+
        ^            ^
        |            |
   Client A     Client B      (both receive the identical object)
```

## Code Example

```javascript
// logger.js — a classic Singleton implemented with a class
class Logger {
  // Private static field holds the one-and-only instance
  static #instance = null;

  // Private instance state
  #logs = [];

  constructor() {
    // Guard: block `new Logger()` once an instance exists
    if (Logger.#instance) {
      throw new Error("Logger is a singleton — use Logger.getInstance()");
    }
    Logger.#instance = this;
  }

  // Global access point — lazily creates the instance on first use
  static getInstance() {
    if (!Logger.#instance) {
      Logger.#instance = new Logger();
      // Freeze the instance so nobody can patch/replace its methods.
      // Note: private fields (#logs) are still writable — freezing only
      // locks the object's own public properties.
      Object.freeze(Logger.#instance);
    }
    return Logger.#instance;
  }

  log(level, message) {
    const entry = `[${new Date().toISOString()}] [${level}] ${message}`;
    this.#logs.push(entry);
    console.log(entry);
  }

  info(message)  { this.log("INFO", message); }
  error(message) { this.log("ERROR", message); }

  get count() {
    return this.#logs.length;
  }
}

// ---- Demo ----
const loggerA = Logger.getInstance();
const loggerB = Logger.getInstance();

loggerA.info("App started");
loggerB.error("Something failed");

// Both variables point to the SAME object, sharing the same state
console.log("Same instance?", loggerA === loggerB); // true
console.log("Total logs:", loggerA.count);          // 2 (both writes landed in one place)

// Direct construction is blocked
try {
  new Logger();
} catch (e) {
  console.log("Blocked:", e.message);
}
```

### The JavaScript-native idiom: module caching

In real JS projects you rarely need the class ceremony above. Node (and every ES-module runtime) **caches a module after its first evaluation** — every `import` of the same file receives the same exports. So exporting a ready-made instance *is* a singleton:

```javascript
// logger.mjs
class Logger {
  #logs = [];
  info(message) {
    this.#logs.push(message);
    console.log(`[INFO] ${message}`);
  }
  get count() { return this.#logs.length; }
}
export default new Logger(); // evaluated once, cached by the module system
```

```javascript
// app.mjs — run with: node app.mjs
import logger from "./logger.mjs";
import logger2 from "./logger.mjs"; // same cached module, same object

logger.info("hello");
console.log("same?", logger === logger2, "count:", logger2.count);
// same? true count: 1
```

**A note on thread safety:** in Java interviews, Singleton discussion is dominated by thread safety (`synchronized`, double-checked locking, volatile). That is a **Java concern, not a JavaScript one** — JS executes your code on a single thread per event loop, so two "threads" can never race inside `getInstance()`. Worker threads in Node don't share objects at all (each worker loads its own module graph), so the question simply doesn't arise the same way. Mention this in an interview; it shows you understand *why* the Java ritual exists.

## When to use / When NOT to use

**Use when:**
- Exactly one instance must coordinate shared state or a shared resource: logger, config, cache, connection pool, metrics collector.
- Creating the object is expensive and you want lazy, one-time initialization.
- You need one well-known access point instead of threading the object through every function signature.

**Do NOT use when:**
- You just want a namespace for functions — a plain module with named exports is simpler.
- The object holds per-request or per-user state (web servers!) — a singleton would leak state across requests.
- You care about easy unit testing and the singleton hides a dependency — hidden global state makes tests order-dependent. Prefer dependency injection and, at most, wire a single instance at the composition root.
- "There will only ever be one" is an assumption, not a requirement (databases, tenants, and environments have a habit of multiplying).

## Real-world usages

- **Node module cache itself** — `require`/`import` caching is why `import db from "./db.js"` gives every file the same pool.
- **Mongoose** — the default `mongoose` export is a singleton connection manager; `mongoose.connect()` configures one shared instance.
- **Redux / Vuex / Pinia stores** — a single store instance is created once and shared by the whole app.
- **`console`, `process` in Node** — built-in one-per-runtime objects that behave exactly like singletons.

## Interview Notes

- Classic question: *"How do you implement Singleton in JavaScript, and how is it different from Java?"* — show the class version, then the module-caching idiom, and explicitly say double-checked locking is unnecessary because JS is single-threaded per event loop.
- *"Why is Singleton considered an anti-pattern by some?"* — global mutable state, hidden dependencies, hard-to-isolate tests. Know both sides.
- Machine-coding problems that use it: **Logger** (the canonical one), **Parking Lot** (the `ParkingLot` itself is usually a singleton), **Vending Machine**, **ATM** — anywhere the "system" object must be unique.
- Follow-up trap: *"How would you unit test code that uses your singleton?"* — answer: expose a reset hook for tests, or invert the dependency and inject the instance.
- Know how `Object.freeze` helps (prevents method patching) and its limit (private fields stay mutable, and freezing doesn't stop someone from ignoring the class entirely).

## Quick Recap

- Guarantees **one instance + one global access point**; the class guards its own construction.
- JS implementation: `static #instance` + `static getInstance()` + a throwing constructor; `Object.freeze` for tamper resistance.
- The idiomatic JS shortcut: **export an instance from a module** — module caching does the singleton work for you.
- Thread-safe lazy init (double-checked locking) is a **Java** interview topic; JS's single-threaded event loop makes it moot.
- Use sparingly: great for loggers/config/pools, dangerous for anything holding per-request state or hiding dependencies.
