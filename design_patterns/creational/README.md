# Creational Design Patterns (in JavaScript)

Creational patterns answer one deceptively simple question: **how should objects get made?**

A naked `new` hard-codes a decision — *this exact class, built this exact way, right here* — into every call site. That's fine until requirements move: a second product type appears, construction gets complicated, an object must be unique, or building from scratch becomes too expensive. Creational patterns decouple your code from the concrete classes it instantiates and from the mechanics of assembling them, so those decisions live in **one place** and can change without rippling through the codebase. Each pattern relaxes a different constraint of `new`:

| Constraint of plain `new` | Pattern that relaxes it |
|---|---|
| Anyone can create any number of instances | **Singleton** — exactly one instance, one access point |
| Caller must name the concrete class | **Factory Method** — subclasses decide which class |
| Related objects can be mixed inconsistently | **Abstract Factory** — whole families created together |
| All construction data crammed into one call | **Builder** — step-wise assembly, validated at the end |
| Every object built from scratch | **Prototype** — new objects by cloning a configured one |

## Recommended reading order

1. [01-singleton.md](01-singleton.md) — the simplest; also introduces JS-specific idioms (module caching).
2. [02-factory-method.md](02-factory-method.md) — the core "decouple creation" idea everything else builds on.
3. [03-abstract-factory.md](03-abstract-factory.md) — Factory Method's plural: families of products.
4. [04-builder.md](04-builder.md) — a different axis: *how* to assemble, not *which* to create.
5. [05-prototype.md](05-prototype.md) — creation by copying; includes the JS prototype-chain distinction.

## The five patterns at a glance

| Pattern | One-liner | Use when |
|---|---|---|
| **Singleton** | Guarantee a class has exactly one instance and a global access point to it. | One shared coordinator/resource: logger, config, cache, connection pool. |
| **Factory Method** | Let subclasses decide which concrete class a workflow instantiates. | The set of product types will grow (channels, vehicles, payment methods) and shared logic shouldn't name them. |
| **Abstract Factory** | One factory object creates an entire family of related products. | Multiple related objects must stay mutually consistent (theme widgets, DB driver components, platform kits). |
| **Builder** | Assemble a complex object step-by-step, then validate and emit it immutable. | Many optional parameters, cross-field validation, or telescoping constructors. |
| **Prototype** | Create new objects by cloning a pre-configured instance. | Construction is expensive and instances differ only slightly; or only the object can copy its own (private) state. |

## Comparison: the ones people mix up

### Factory Method vs Abstract Factory vs Builder vs Prototype

| | Factory Method | Abstract Factory | Builder | Prototype |
|---|---|---|---|---|
| **Core question** | *Which* class to instantiate? | *Which family* of classes? | *How* to assemble one object? | Copy or construct? |
| **Creates** | One product per call | A set of related products | One complex product | A duplicate of an existing object |
| **Variation via** | Subclassing one method | Swapping the factory object | Chained steps + `build()` | Choosing a prototype + overrides |
| **Result count/type** | One of N types | N products, one family | Always the same type, differently configured | Same type as the source |
| **Typical trigger** | `switch (type) { new ... }` spreading | `if (theme === "dark")` spreading + mixed-family bugs | Telescoping constructors, half-built objects | Expensive init repeated; uncopyable private state |
| **Canonical LLD problem** | Parking Lot vehicles, notifications | Themed UI kits, regional pizza stores | Splitwise `Expense`, HTTP request, burger order | Game-object spawning, document templates |

### Quick contrasts worth memorizing

- **Factory Method vs Abstract Factory** — one product vs a *family* of products. An abstract factory is usually a bundle of factory methods with a consistency guarantee (a dark factory *cannot* emit a light widget). Cost asymmetry: Abstract Factory makes new *families* cheap but new *product types* expensive.
- **Factory vs Builder** — Factory is one call answering "which type?"; Builder is many calls answering "with what parts?". Factory returns different types; Builder returns the same type in different configurations. They compose: a factory can hand you a builder.
- **Builder vs telescoping constructor / options object** — in JS an options object (`{ url, timeout = 3000 }`) covers simple cases; Builder earns its keep when you need step-wise assembly, one validation choke point, and an immutable product.
- **Prototype vs Factory** — Factory builds from a blueprint (class); Prototype copies a live, pre-configured instance — the object *is* its own factory. Prototype shines when setup cost dominates or private state makes external reconstruction impossible.

### Singleton and the others

Singleton is orthogonal to the rest: it constrains *how many* instances exist, not *how* or *which* they are. It combines freely — concrete factories are very often singletons (you only need one `DarkThemeFactory`), and a Builder's Director or a Prototype registry is typically a singleton too.

## How this maps to JavaScript specifically

- **Singleton** is often free: Node's module cache means `export default new Logger()` is a singleton. Thread-safety ceremony (double-checked locking) is a Java concern, not a JS one.
- **Factories** don't require classes: an object map of closures (`{ email: () => new EmailNotification() }`) is idiomatic JS and interviews accept it — but know the classical UML roles.
- **Builder** competes with options objects and default parameters; know when each wins.
- **Prototype (pattern)** is not JS **prototypal inheritance** — copying state vs delegating behavior. Expect this exact trap question.
- Modern JS gives you real encapsulation for these patterns: `#privateFields`, `static` members, and `Object.freeze` for immutable products and tamper-proof singletons. All examples in these files run with plain `node file.js`.

## Interview cheat-sheet

- Logger, Config, ConnectionPool → **Singleton**
- Parking Lot (vehicles/spots), Notification system, Payment gateway → **Factory Method**
- Cross-platform/themed UI, regional franchise (NY vs Chicago pizza ingredients) → **Abstract Factory**
- Splitwise Expense, HTTP request, Pizza/Burger order with many toppings → **Builder**
- Game entity spawning, "duplicate this document/shape", board-state simulation → **Prototype**
