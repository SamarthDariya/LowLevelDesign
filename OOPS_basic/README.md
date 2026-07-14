# OOP Basics for Low-Level Design (in JavaScript)

Complete reading material for learning object-oriented programming from scratch, aimed at Low-Level Design (LLD) interviews and real-world code. All examples are plain modern JavaScript — every code block runs with `node file.js`, no setup needed. Topic list inspired by [awesome-low-level-design](https://github.com/ashishps1/awesome-low-level-design); all content and code written in JS (with short TypeScript comparisons where interviews expect them).

## Recommended Reading Order

Read the files in numeric order — each topic builds on the previous one.

| # | File | One-line description |
|---|---|---|
| 1 | [01-classes-and-objects.md](./01-classes-and-objects.md) | Blueprints vs instances: `class`, `constructor`, `this`, `static`, and object identity. |
| 2 | [02-encapsulation.md](./02-encapsulation.md) | Protecting state with `#private` fields, getters/setters, and validated methods that enforce invariants. |
| 3 | [03-inheritance.md](./03-inheritance.md) | Reusing and specializing behavior with `extends`, `super`, and overriding — and when NOT to inherit. |
| 4 | [04-polymorphism.md](./04-polymorphism.md) | One method call, many behaviors: dynamic dispatch, replacing `switch`es with overrides, JS's answer to overloading. |
| 5 | [05-abstraction.md](./05-abstraction.md) | Exposing *what* while hiding *how*: simulated abstract classes, template methods, abstraction vs encapsulation. |
| 6 | [06-interfaces.md](./06-interfaces.md) | Contracts without a keyword: duck typing, runtime shape checks, throwing base classes, and the TypeScript `interface` comparison. |
| 7 | [07-enums.md](./07-enums.md) | Fixed sets of named values: `Object.freeze` enums, Symbol enums, class-based enums, state-machine transitions, TS `enum`. |
| 8 | [08-class-relationships.md](./08-class-relationships.md) | Dependency, Association, Aggregation, Composition — UML arrows, a comparison table, and "composition over inheritance." |

Also in this folder: `classOverview.js` — earlier hands-on class notes/experiments.

## How to Study

1. Read a file top to bottom (each takes ~15-20 minutes).
2. Copy the `## Code Example` block into a `.js` file and run it with `node` — then break it: remove a `super()` call, mutate a frozen enum, skip an override, and watch what happens.
3. Re-explain the concept out loud using the file's real-world analogy — if you can teach it, you know it.
4. Before interviews, skim only the `## Interview Notes` and `## Quick Recap` sections of all eight files (~10 minutes total).

## What's Next After OOP?

This folder is stage 1 of the standard LLD preparation path:

1. **SOLID principles** — five design rules built directly on these OOP concepts (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion). You've already brushed against Liskov (inheritance), Open/Closed (polymorphism), and Interface Segregation (interfaces).
2. **Design patterns** — named, reusable arrangements of classes: start with Strategy, Factory, Singleton, Observer, Builder, Decorator. Most are "an interface + composition," so files 06 and 08 make them feel familiar.
3. **Machine coding problems** — timed, end-to-end practice designing and coding real systems: Parking Lot, Elevator, Snake & Ladder, Splitwise, Tic-Tac-Toe, Vending Machine, Library Management. This is what LLD interview rounds actually look like.

A good source for all three stages (problem lists and solutions) is the [awesome-low-level-design](https://github.com/ashishps1/awesome-low-level-design) repository.
