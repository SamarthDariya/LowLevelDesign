# Structural Design Patterns

Creational patterns answer *"how do I make objects?"* Behavioral patterns answer *"how do objects talk?"* **Structural patterns answer "how do I compose objects and classes into larger structures — flexibly, without gluing everything together with inheritance?"**

The recurring trick across all seven is the same: put an object *between* the client and the real work — a translator, a wrapper, a stand-in, a front door, a shared reference — so the two sides can vary independently. If you internalize one idea from this folder, make it: **composition over inheritance**.

## Recommended reading order

Read them in file order — it goes from "easiest to grasp" to "most nuanced to distinguish":

1. [Adapter](./01-adapter.md)
2. [Facade](./05-facade.md) — read right after Adapter; they're the most-confused pair
3. [Decorator](./04-decorator.md)
4. [Proxy](./07-proxy.md) — read right after Decorator; identical shape, different intent
5. [Composite](./03-composite.md)
6. [Bridge](./02-bridge.md)
7. [Flyweight](./06-flyweight.md)

(Files are numbered in the conventional GoF order; the list above is the suggested *learning* order.)

## The seven patterns at a glance

| # | Pattern | One-liner | Use when |
|---|---------|-----------|----------|
| 01 | **Adapter** | Translates one interface into the interface clients expect. | Integrating a legacy/third-party class whose interface doesn't match your code, and you can't change either side. |
| 02 | **Bridge** | Splits a hierarchy into abstraction + implementation, connected by composition. | A class varies along two independent dimensions (remote × device, shape × renderer) and subclasses are multiplying (`m × n` smell). |
| 03 | **Composite** | Tree where leaves and containers share one interface; containers recurse over children. | Part–whole hierarchies (file system, org chart, UI tree) that clients should treat uniformly. |
| 04 | **Decorator** | Same-interface wrapper that adds behavior, stackable in any combination. | Features must combine freely at runtime (coffee add-ons, middleware, logging/caching layers) and subclass-per-combination would explode. |
| 05 | **Facade** | One simple, task-oriented entry point over several subsystems. | A common workflow requires orchestrating many services in order (checkout, home theater) and clients shouldn't know the choreography. |
| 06 | **Flyweight** | Shares the heavy repeated (intrinsic) state of many objects via a caching factory. | Huge object counts (text glyphs, game trees, map markers) are measurably eating memory and state splits into shared vs. per-use. |
| 07 | **Proxy** | Same-interface stand-in that controls access: lazy, protected, cached, remote. | You must gatekeep or defer access to an expensive/sensitive object without changing client code. |

## Easily confused pairs

Four of these patterns are all "an object standing in front of another object" — interviews love asking you to tell them apart. Distinguish by **intent** and by **what happens to the interface**:

| Pattern | Interface | Intent | Who's wrapped |
|---------|-----------|--------|---------------|
| **Adapter** | **Changes** it | Compatibility — make an *existing* class fit an *expected* contract | One incompatible class |
| **Facade** | **New, simpler** one | Convenience — one front door over a *whole subsystem* | Many classes |
| **Decorator** | **Same** interface | Enhancement — *add behavior*, stack freely, client composes deliberately | One same-type component |
| **Proxy** | **Same** interface | Control — *manage access/lifecycle* (lazy, auth, cache); often invisible to client | One same-type subject |

Quick tests when unsure:

- Does the wrapper's interface **differ** from the wrappee's? → Adapter (retrofitted, 1:1) or Facade (designed, 1:many).
- Interface is the **same**? → Decorator or Proxy. Did the client build the wrapping stack on purpose to add features? → Decorator. Does the wrapper decide *whether/when* the real call happens (permissions, lazy creation, cache hit)? → Proxy.
- Bonus pair — **Bridge vs. Adapter**: same "delegate through an interface" mechanics, but Bridge is designed *up front* so two hierarchies can evolve independently; Adapter is bolted on *after the fact* to fix a mismatch.
- Bonus pair — **Composite vs. Decorator**: both rely on recursive composition, but Composite aggregates *many* children into a tree; Decorator wraps exactly *one* component to layer behavior.

## How to study these for LLD interviews

- For each pattern, be able to (1) name the pain it removes, (2) draw the structure, (3) code it from scratch in ~10 minutes, (4) name one real library that embodies it.
- Every code example in this folder is complete and runnable: copy any ```javascript block into a file and run `node file.js`.
- When practicing machine coding, notice which pattern the problem is *secretly* about: file system → Composite, notification channels → Decorator/Bridge, vendor SDKs → Adapter, checkout flow → Facade, rate limiter / lazy loader → Proxy, board-game pieces → Flyweight.
