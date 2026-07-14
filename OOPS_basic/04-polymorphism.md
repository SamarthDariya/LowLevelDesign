# Polymorphism

## What is it?

**Polymorphism** ("many forms") means the *same message* produces *different behavior* depending on who receives it. You call `shape.area()` — and whether that runs the circle formula or the rectangle formula is decided by the actual object at runtime, not by the code doing the calling. The caller stays generic; the objects supply the specifics.

Real-world analogy: the word **"open"**. Tell a person "open" while pointing at a door, a book, a laptop, or a bank account — the *instruction* is identical, but the *action performed* differs completely based on the thing receiving it. You didn't need four different verbs ("swing-door", "unfold-book", ...), because each thing knows how to "open" itself. That's polymorphism: one interface, many implementations.

The main kind in OOP is **runtime (subtype) polymorphism** via method overriding: a base class defines a method, subclasses override it, and code written against the base class automatically dispatches to the right override. The other classic kind, **compile-time polymorphism (method overloading** — same method name, different parameter lists) **doesn't exist in JavaScript**: a class can have only one method per name. JS approximates it with default parameters, rest parameters (`...args`), or checking argument types inside one method.

The magic ingredient is **dynamic dispatch**: at runtime, JS looks up the method on the actual object (walking the prototype chain), so `animal.speak()` finds `Dog.prototype.speak` if `animal` happens to be a Dog. The variable's "declared type" doesn't matter — in JS it doesn't even exist — only the real object does.

## Why does it matter in LLD?

Polymorphism is the single biggest lever for **eliminating `if/else` and `switch` chains**, which is one of the most common LLD interview themes. Compare: a `calculateFee(vehicle)` function with `if (type === 'car') ... else if (type === 'truck') ...` versus each vehicle class owning its own `parkingFeePerHour()`. The first must be *edited* every time a vehicle type is added (and there are usually five such switches scattered around); the second just needs a *new class*. That's the Open/Closed Principle in action, and interviewers explicitly look for it.

It's also what makes designs extensible along their natural axis of change. Payment systems (`PaymentMethod.pay()`), notification systems (`Channel.send()`), pricing strategies (`PricingStrategy.calculate()`) — in each case, high-level code loops over or delegates to abstract "shapes of behavior," and new variants plug in without touching existing code. Most classic design patterns (Strategy, State, Template Method, Command) are just polymorphism arranged in specific ways — mastering it here makes the patterns feel obvious later.

In interviews, you demonstrate polymorphism by writing one piece of *caller* code that works over a heterogeneous collection (`for (const shape of shapes) total += shape.area()`), then showing that adding a new subclass requires zero changes to that caller.

## Code Example

```javascript
// shapes.js — run with: node shapes.js

class Shape {
  constructor(name) {
    this.name = name;
  }

  // Base version — subclasses are expected to override this.
  area() {
    throw new Error(`${this.name} must implement area()`);
  }

  // Template-style method: uses this.area(), which dispatches
  // to the SUBCLASS's version at runtime. Written once, works for all.
  describe() {
    return `${this.name} with area ${this.area().toFixed(2)}`;
  }
}

class Circle extends Shape {
  constructor(radius) {
    super("Circle");
    this.radius = radius;
  }

  area() {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle extends Shape {
  constructor(width, height) {
    super("Rectangle");
    this.width = width;
    this.height = height;
  }

  area() {
    return this.width * this.height;
  }
}

class Triangle extends Shape {
  constructor(base, height) {
    super("Triangle");
    this.base = base;
    this.height = height;
  }

  area() {
    return 0.5 * this.base * this.height;
  }
}

// ---- THE POLYMORPHIC CALLER ----
// This function knows NOTHING about circles or rectangles.
// It works for every Shape subclass that exists — or ever will.
function printReport(shapes) {
  let total = 0;
  for (const shape of shapes) {
    console.log(" -", shape.describe()); // same call, different behavior
    total += shape.area();               // dynamic dispatch decides which area()
  }
  console.log(`Total area: ${total.toFixed(2)}`);
}

const shapes = [new Circle(3), new Rectangle(4, 5), new Triangle(6, 2)];
printReport(shapes);
// - Circle with area 28.27
// - Rectangle with area 20.00
// - Triangle with area 6.00
// Total area: 54.27

// ---- Extension WITHOUT modification ----
// New requirement: squares. We add a class; printReport is untouched.
class Square extends Shape {
  constructor(side) {
    super("Square");
    this.side = side;
  }
  area() {
    return this.side ** 2;
  }
}

printReport([...shapes, new Square(4)]); // just works

// ---- "Overloading" the JavaScript way ----
// JS has no method overloading; one method adapts to its arguments.
class Logger {
  log(message, level = "INFO") {          // default param
    if (typeof message === "object") {    // type check inside
      message = JSON.stringify(message);
    }
    console.log(`[${level}] ${message}`);
  }
}

const logger = new Logger();
logger.log("Server started");             // [INFO] Server started
logger.log("Disk almost full", "WARN");   // [WARN] Disk almost full
logger.log({ userId: 42 });               // [INFO] {"userId":42}
```

The two things to internalize:

1. `printReport` is written **against the abstraction** (`Shape`) and never inspects concrete types — no `instanceof`, no `switch (shape.name)`.
2. Adding `Square` required **zero edits** to existing code. That is the whole point.

## Common Mistakes

- **Type-checking instead of dispatching** — `if (shape instanceof Circle) {...} else if (...)` inside caller code defeats polymorphism. If you're switching on type, the behavior belongs *inside* the classes.
- **Expecting Java-style overloading** — defining `area()` twice in a JS class silently keeps only the last one. Use default/rest params or one method that inspects its arguments.
- **Inconsistent method signatures across subclasses** — if `Circle.area()` takes no args but `Rectangle.area(unit)` requires one, generic callers break. Overrides must honor the parent's contract (same signature, same meaning, same return shape).
- **Losing `this` when passing methods around** — `const fn = shape.area; fn()` throws because `this` is unbound. Use `shape.area()` directly, or bind: `shape.area.bind(shape)`, or wrap: `() => shape.area()`.
- **Forgetting a subclass override** — if `Triangle` forgets `area()`, the base class throwing a clear error (as above) is far better than silently returning `undefined`.

## Interview Notes

- The most common polymorphism test in LLD interviews is implicit: the interviewer adds a requirement ("now support a new vehicle/payment/notification type") and watches whether you edit a `switch` or add a class. Design so it's the latter.
- Be ready to define both kinds: runtime (overriding — JS has it) and compile-time (overloading — JS doesn't; explain default/rest params as the substitute).
- "Program to an interface, not an implementation" — quote it and demonstrate it: caller code should reference the base type/contract only.
- Strategy pattern questions ("design a pricing/discount engine") are polymorphism questions in disguise — each strategy class overrides one method, and the context calls it blindly.
- A strong senior signal: pointing out that replacing conditionals with polymorphism is only worth it when variants share a stable contract — for 2 fixed cases, a simple `if` is fine. Nuance beats dogma.

## Quick Recap

- Polymorphism = same method call, different behavior, decided by the actual object at runtime (dynamic dispatch).
- It powers extensible design: callers depend on the base contract; new subclasses plug in with zero caller changes (Open/Closed Principle).
- Replace type-`switch`es with method overrides — behavior lives inside the classes that vary.
- JS has runtime polymorphism (overriding) but no method overloading; use default/rest parameters instead.
- Keep override signatures and contracts consistent so any subclass can substitute for the parent.
