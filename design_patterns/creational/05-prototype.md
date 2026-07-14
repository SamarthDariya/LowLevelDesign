# Prototype

## Problem it solves

Sometimes the cheapest way to make an object is to **copy an existing one**. Imagine a game that spawns hundreds of enemies. Configuring an `Enemy` from scratch is expensive: stats loaded from data files, AI parameters computed, assets resolved. Doing that full setup for every single orc that walks on screen is wasteful when every orc starts out 95% identical — only position and maybe health differ.

There's a second problem: copying objects *correctly* is harder than it looks, and the class itself is the only one positioned to do it right. Code outside the class can't see private fields (`#aiState`), so `{ ...enemy }` silently drops them — and it also loses the prototype chain, so the copy has no methods. `structuredClone` deep-copies data but likewise strips methods and class identity. And a naive shallow copy shares nested objects: give one orc a `position` object and its "copy" the *same* `position`, and moving one teleports the other. Every caller shouldn't have to know which fields need deep copies.

The Prototype pattern makes objects responsible for cloning themselves: each cloneable class exposes a `clone()` method that knows exactly what to copy, how deep, and including private state. Combine it with a **registry** of pre-configured prototype instances, and "spawn an orc" becomes: look up the orc prototype, clone it, tweak the copy — no per-spawn setup cost, no `new` scattered around, no knowledge of concrete classes at the spawn site.

## The Pattern

Specify the kinds of objects to create using a **prototypical instance**, and create new objects by **copying** that prototype.

**Participants:**

| Role | In our example | Responsibility |
|---|---|---|
| Prototype (interface) | `GameObject` with `clone()` | Declares the cloning contract |
| Concrete Prototype | `Enemy` | Implements `clone()` correctly (deep copies, private fields) |
| Registry (optional) | `EnemyRegistry` | Catalog of named, pre-configured prototypes |
| Client | demo code | Calls `registry.spawn(key, overrides)` — never `new Enemy(...)` |

```
        GameObject (prototype interface)
        +----------------+
        |  + clone()     |
        +----------------+
               ^
               |
        +------+-------+          clone()          +--------------+
        |    Enemy     | ------------------------> |  Enemy copy  |
        | #aiState     |   (deep-copies nested     | own position |
        | position ... |    state + private fields)| own loot     |
        +--------------+                           +--------------+
               ^
               | stores pre-configured instances
        +------+------------------+
        |     EnemyRegistry       |
        |  "orc"    -> Enemy(...) |   client: registry.spawn("orc", {x:10})
        |  "dragon" -> Enemy(...) |           = lookup + clone + tweak
        +-------------------------+
```

## Code Example

```javascript
// ---------- Prototype "interface" ----------
// Convention: anything cloneable exposes clone().
class GameObject {
  clone() {
    throw new Error("clone() must be implemented by a subclass");
  }
}

// ---------- Concrete Prototype ----------
class Enemy extends GameObject {
  // Private field to show that clone() works even with encapsulated state
  #aiState;

  constructor({ type, health, speed, position, loot, aiState = "idle" }) {
    super();
    this.type = type;
    this.health = health;
    this.speed = speed;
    this.position = { ...position };   // { x, y }
    this.loot = [...loot];             // array of item names
    this.#aiState = aiState;
  }

  // clone() has access to private fields — an external copy function
  // (e.g. structuredClone or {...obj}) would NOT copy #aiState,
  // and structuredClone drops methods/prototype entirely.
  clone(overrides = {}) {
    return new Enemy({
      type: this.type,
      health: this.health,
      speed: this.speed,
      position: { ...this.position },  // deep-copy nested objects!
      loot: [...this.loot],
      aiState: this.#aiState,
      ...overrides,                    // tweak the copy in one call
    });
  }

  describe() {
    return `${this.type} [hp:${this.health} spd:${this.speed}] ` +
      `at (${this.position.x},${this.position.y}) ` +
      `loot:[${this.loot.join(", ")}] ai:${this.#aiState}`;
  }
}

// ---------- Prototype Registry ----------
// A catalog of pre-configured prototypes. Spawning = look up + clone.
class EnemyRegistry {
  #prototypes = new Map();

  register(key, prototype) {
    this.#prototypes.set(key, prototype);
    return this;
  }

  spawn(key, overrides = {}) {
    const prototype = this.#prototypes.get(key);
    if (!prototype) throw new Error(`No prototype registered for "${key}"`);
    return prototype.clone(overrides);
  }
}

// ---------- Demo ----------
// Building the prototype is "expensive" (imagine loading stats/assets
// from disk or a server). We pay that cost ONCE.
const registry = new EnemyRegistry()
  .register("orc", new Enemy({
    type: "Orc", health: 100, speed: 5,
    position: { x: 0, y: 0 }, loot: ["axe", "coin"],
  }))
  .register("dragon", new Enemy({
    type: "Dragon", health: 1000, speed: 12,
    position: { x: 0, y: 0 }, loot: ["gold", "scale"], aiState: "patrolling",
  }));

// Spawning is now cheap — clone and tweak:
const orc1 = registry.spawn("orc", { position: { x: 10, y: 4 } });
const orc2 = registry.spawn("orc", { position: { x: 25, y: 9 }, health: 60 });
const boss = registry.spawn("dragon", { health: 2500 });

console.log(orc1.describe());
console.log(orc2.describe());
console.log(boss.describe());

// Deep vs shallow copy: mutating one clone's nested state must not
// leak into another clone (this is THE classic prototype bug).
orc1.loot.push("shield");
console.log("orc1 loot:", orc1.loot); // [ 'axe', 'coin', 'shield' ]
console.log("orc2 loot:", orc2.loot); // [ 'axe', 'coin' ]  <- unaffected

// Clones are real Enemy instances (unlike structuredClone output):
console.log("orc1 instanceof Enemy:", orc1 instanceof Enemy); // true
console.log("structuredClone keeps methods?",
  typeof structuredClone({ ...orc1 }).describe); // "undefined"
```

Output:

```
Orc [hp:100 spd:5] at (10,4) loot:[axe, coin] ai:idle
Orc [hp:60 spd:5] at (25,9) loot:[axe, coin] ai:idle
Dragon [hp:2500 spd:12] at (0,0) loot:[gold, scale] ai:patrolling
orc1 loot: [ 'axe', 'coin', 'shield' ]
orc2 loot: [ 'axe', 'coin' ]
orc1 instanceof Enemy: true
structuredClone keeps methods? undefined
```

**Don't confuse this with JavaScript's prototype chain.** JS "prototypal inheritance" (`Object.create`, `__proto__`) shares behavior via **delegation** — a lookup walks up the chain to a live shared object. The GoF Prototype *pattern* is about **copying state** into an independent new object. Related spirit (objects from objects, no classes required), different mechanics. An interviewer asking about "prototype in JS" may mean either — clarify which.

## When to use / When NOT to use

**Use when:**
- Object initialization is **expensive** (I/O, computation, network) and instances differ only slightly — pay setup once, clone many times.
- You need copies of objects whose state includes **private/internal fields** that outside code can't reconstruct.
- You want to avoid a parallel hierarchy of factories: any object that can `clone()` itself *is* its own factory.
- Snapshotting/undo: keep a clone of an object's state to restore later (pairs with Memento).

**Do NOT use when:**
- Objects are cheap to construct — `new` with parameters is clearer than clone-and-mutate.
- Objects hold **non-copyable resources** (open sockets, file handles, DB connections) — what would a "copy" of a live connection even mean?
- The object graph has circular references or deeply shared structure — hand-written `clone()` gets error-prone; you may need a serialization strategy instead.
- A plain data object with no methods is all you have — `structuredClone(obj)` already solves that without any pattern.

## Real-world usages

- **`structuredClone()` / the HTML structured-clone algorithm** — the platform's built-in deep-copy for plain data (used by `postMessage`, IndexedDB).
- **JS itself**: `Object.create(proto)` and the entire prototype chain are a delegation-flavored cousin of this pattern baked into the language.
- **Game engines** — Unity's `Instantiate(prefab)` is literally "clone this pre-configured prototype"; the prefab is a registry entry.
- **Document/template systems** — "duplicate slide", "copy style", or cloning a default document template into a new user document (Google Docs-style "make a copy").

## Interview Notes

- Top question: *"Shallow vs deep copy — and which does your `clone()` do?"* Be ready to show the bug a shallow copy causes (shared `position`/`loot`) and where you chose deep copies deliberately.
- *"How is the GoF Prototype pattern different from JavaScript's prototypal inheritance?"* — copying state vs delegating behavior. This is the JS-specific trap question; nail it.
- *"Why put `clone()` on the class instead of using `structuredClone`?"* — private fields, methods/class identity (`instanceof`), and per-field control over copy depth.
- Machine-coding problems that use it: **game entity spawning**, **document/template editors** ("duplicate this shape" in a canvas editor), **object caches** that hand out safe copies, **chess/board games** (clone the board to simulate a move without mutating the real one).
- Mention the **registry** variant unprompted — "prototype manager" turns the pattern from a party trick into an architecture piece.

## Quick Recap

- Prototype = create objects by **cloning a pre-configured instance** instead of building from scratch.
- The object clones **itself** — only it can copy private fields and knows which nested state needs a deep copy.
- Registry variant: named prototypes + `spawn(key, overrides)` = cheap, `new`-free object creation.
- In JS, know the trio: `{...obj}` (shallow, loses methods/privates), `structuredClone` (deep data, still loses methods/privates), hand-written `clone()` (full control — the pattern).
- GoF Prototype (copy state) is not JS prototypal inheritance (delegate behavior) — say this before the interviewer asks.
