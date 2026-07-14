# Design Patterns

Design patterns are reusable solutions to problems that come up again and again in object-oriented design. They are not code you copy-paste — they are named ideas ("use a Factory here", "this needs an Observer") that let you communicate designs quickly and avoid reinventing flawed solutions.

The classic catalog (from the "Gang of Four" book) has **23 patterns** in three categories, and this folder covers all of them with JavaScript examples.

## Prerequisites

Finish [`../OOPS_basic/`](../OOPS_basic/README.md) first — patterns assume you're comfortable with classes, inheritance, polymorphism, abstraction, and composition.

## The three categories

| Category | Question it answers | Folder |
|---|---|---|
| **Creational** (5) | How do I *create* objects flexibly, without hardcoding `new EverythingEverywhere()`? | [`creational/`](creational/README.md) |
| **Structural** (7) | How do I *compose* classes and objects into larger structures? | [`structural/`](structural/README.md) |
| **Behavioral** (11) | How do objects *communicate* and divide responsibilities? | [`behavioral/`](behavioral/README.md) |

## Recommended learning order

Don't read all 23 linearly — learn the high-value ones deeply first, then fill in the rest.

**Tier 1 — must know cold (used in most LLD interview problems):**
1. Singleton (creational)
2. Factory Method (creational)
3. Strategy (behavioral)
4. Observer (behavioral)
5. State (behavioral)
6. Builder (creational)
7. Decorator (structural)

**Tier 2 — very common:**
8. Facade, Adapter, Proxy, Composite (structural)
9. Command, Chain of Responsibility, Template Method, Iterator (behavioral)
10. Abstract Factory (creational)

**Tier 3 — know what they are, read when needed:**
11. Bridge, Flyweight (structural)
12. Mediator, Memento, Visitor, Interpreter (behavioral); Prototype (creational)

## Pattern → LLD problem cheat sheet

| When you're designing… | Reach for |
|---|---|
| Parking Lot | Factory (vehicle/spot creation), Strategy (pricing), Singleton (lot) |
| Vending Machine / Elevator / ATM | **State** |
| Splitwise | Strategy (split types), Observer (balance updates) |
| BookMyShow / ticket booking | Factory, Observer, Singleton |
| Logger framework | Singleton, Chain of Responsibility (log levels), Observer (sinks) |
| Notification system | Factory (channel), Observer (subscribers), Decorator (formatting) |
| Chess / board games | Strategy (piece moves), State (game phases), Memento (undo) |
| Text editor | Command (undo/redo), Memento (snapshots), Flyweight (characters) |
| Food delivery / cab booking | Strategy (matching/pricing), Observer (tracking), State (order lifecycle) |

## How to study each pattern

1. Read **Problem it solves** — if you can't state the pain point, the pattern won't stick.
2. Read the code example, then **close the file and re-implement it from memory** in a scratch `.js` file.
3. Answer: *when would I NOT use this?* Over-applying patterns is a classic interview red flag.
4. Connect it to one real LLD problem from the cheat sheet above.

## What's next

After patterns, move to **machine-coding problems** (Parking Lot → Vending Machine → Splitwise → BookMyShow → Chess), where you combine several patterns in one design under time pressure. A good source of problem statements: [awesome-low-level-design](https://github.com/ashishps1/awesome-low-level-design).
