# Behavioral Design Patterns

Design patterns come in three families: **creational** (how objects get created), **structural** (how objects are composed), and **behavioral** — this folder — which is about **how objects communicate and distribute responsibility**. Behavioral patterns answer questions like: who should react when this changes? Who decides what happens next? How do I swap this behavior at runtime? How do I undo what just happened?

The recurring trick across all eleven patterns is the same: **turn behavior into objects**. An algorithm becomes a Strategy object, a request becomes a Command object, a state becomes a State object, a reaction becomes an Observer, a snapshot becomes a Memento. Once behavior is an object, you can swap it, queue it, store it, and pass it around — things a hard-coded `if/else` can never do. In JavaScript, where functions are already first-class values, some of these patterns shrink to passing a function; the files call out those idiomatic shortcuts as they appear.

All code examples are plain modern JavaScript (`class`, `#private` fields, generators) and run directly with `node file.js`.

## Recommended reading order

Front-loaded by interview relevance. The first four cover the vast majority of LLD machine-coding needs.

| # | Pattern | Priority |
|---|---------|----------|
| 1 | [Strategy](01-strategy.md) | Essential — appears in almost every machine-coding problem |
| 2 | [Observer](02-observer.md) | Essential — the heart of every event/notification system |
| 3 | [State](04-state.md) | Essential — Vending Machine and Elevator interviews demand it |
| 4 | [Command](03-command.md) | Essential — the undo/redo pattern |
| 5 | [Chain of Responsibility](07-chain-of-responsibility.md) | High — ATM dispenser, loggers, middleware |
| 6 | [Template Method](05-template-method.md) | Medium — quick to learn, common follow-up question |
| 7 | [Iterator](06-iterator.md) | Medium — built into JS; know the protocol + generators |
| 8 | [Mediator](08-mediator.md) | Medium — chat rooms, auctions |
| 9 | [Memento](09-memento.md) | Lower — snapshots/undo; know it vs Command |
| 10 | [Visitor](10-visitor.md) | Lower — rare, but double dispatch is a classic question |
| 11 | [Interpreter](11-interpreter.md) | Lower — rarest; useful for rule/expression evaluators |

## The eleven patterns at a glance

| Pattern | One line | Use when |
|---------|----------|----------|
| **Strategy** | Encapsulate interchangeable algorithms behind one interface and inject the one you want. | A class branches on "which way to do this" (payment method, pricing rule, split logic) and variants keep growing. |
| **Observer** | A subject notifies a dynamic list of subscribers when its state changes. | One change must fan out to many interested parties the source shouldn't know about (events, notifications, tickers). |
| **Command** | Turn a request into an object with `execute()`/`undo()`. | You need undo/redo, queues, macros, logging, or many UI triggers for one action. |
| **State** | One class per state; the object delegates behavior to its current state and transitions between them. | Behavior depends heavily on a status field and `switch(status)` blocks are multiplying (vending machine, order lifecycle). |
| **Template Method** | Base class fixes an algorithm's step order; subclasses fill in specific steps. | Several classes share the same pipeline skeleton and differ only in a few steps. |
| **Iterator** | Traverse a collection sequentially without exposing its internals (`Symbol.iterator`, generators). | You build a custom collection and want `for...of`/spread to work, or need lazy/multiple traversal orders. |
| **Chain of Responsibility** | Pass a request along linked handlers until one handles it. | Multiple handlers *could* serve a request and the right one emerges at runtime (escalation, approvals, middleware). |
| **Mediator** | Colleagues communicate only through a central hub that owns the interaction rules. | Many objects talk to each other in tangled many-to-many ways (chat room, auction, form widgets). |
| **Memento** | Capture an object's state in an opaque snapshot; restore it later without breaking encapsulation. | You need checkpoints/rollback and reversing operations step-by-step is too hard. |
| **Visitor** | Put each operation over a class hierarchy into its own visitor class via double dispatch. | The class hierarchy is stable but operations over it keep multiplying (AST tools, exporters). |
| **Interpreter** | Model a mini-language's grammar as classes; evaluate sentences as object trees. | Users/config express logic as text (rules, filters, formulas) and `eval()` is not an option. |

## Easily confused pairs

**Strategy vs State.** Nearly identical structure — a context delegating to a swappable behavior object — but opposite dynamics. In **Strategy**, the *client* picks one algorithm, strategies don't know each other exist, and the choice usually sticks. In **State**, the *object itself* moves between states, states know their successors and trigger the transitions, and changing is the whole point. Ask: "who changes the behavior object, and how often?" Client, rarely → Strategy. The object, constantly → State.

**Command vs Strategy.** Both wrap behavior in an object, but they answer different questions. **Strategy** is *how* — several interchangeable ways to do *one* job (three ways to calculate shipping); you hold one at a time. **Command** is *what and when* — each command is a *different* action bound to its arguments (insert this text here), and the payoff is treating actions as data: stacking them for undo, queuing, logging, replaying. If you're building a history stack, it's Command; if you're picking a variant, it's Strategy.

**Mediator vs Observer.** Both decouple communicating objects. **Observer** is one-to-many broadcast: a subject emits, anonymous subscribers react, and the reaction logic lives in the *receivers*. **Mediator** is many-to-many coordination through a hub: colleagues are known, communication is two-way, and the routing/policy logic lives in the *middle*. Rule of thumb: "when X changes, others should hear about it" → Observer; "these objects keep talking to each other and the rules are getting complicated" → Mediator. (A mediator is often *implemented* with observer-style events internally — the patterns compose.)

## How to study these for interviews

1. For each pattern, be able to say the **problem** in one sentence before the solution — interviewers grade the *why*.
2. Type out each code example yourself and run it (`node file.js`); then re-implement one from memory.
3. Map patterns to the classic machine-coding problems: Vending Machine/Elevator → State; Splitwise → Strategy + Observer; Chess → Strategy (+ Memento for undo); Text editor → Command + Memento; ATM/Logger → Chain of Responsibility; Chat app → Mediator + Observer.
4. Drill the three confused pairs above — they are the most common follow-up questions.
