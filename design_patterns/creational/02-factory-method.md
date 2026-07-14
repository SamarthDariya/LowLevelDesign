# Factory Method

## Problem it solves

Imagine a notification system. Version 1 only sends email, so `new EmailNotification()` is sprinkled through the codebase. Then the product team adds SMS, then push notifications, then WhatsApp. Every place that creates a notification now grows an `if/else` or `switch` on the channel type. The creation logic is duplicated, and adding a channel means hunting down and editing every one of those switches — a textbook violation of the **Open/Closed Principle** (open for extension, closed for modification).

There's a second, subtler problem: the code that *uses* a notification (validate the recipient, send, record the result, retry on failure) is identical for every channel, but because it's entangled with `new EmailNotification()` it can't be shared. You want to write the sending workflow **once**, against an abstract "notification", and let something else decide *which concrete notification* gets created.

Factory Method fixes this by moving the `new` into a dedicated overridable method. The base class owns the stable workflow; subclasses own the single volatile decision — *which class to instantiate*. Adding WhatsApp becomes: write one new product class, one new creator subclass, touch nothing else.

## The Pattern

Define an interface for creating an object, but let **subclasses decide which class to instantiate**. The superclass code calls the factory method polymorphically and works with the result only through the product's common interface.

**Participants:**

| Role | In our example | Responsibility |
|---|---|---|
| Product | `Notification` | Common interface all created objects share (`send()`) |
| Concrete Products | `EmailNotification`, `SMSNotification`, `PushNotification` | The actual objects being created |
| Creator | `NotificationService` | Declares the factory method `createNotification()`; contains the shared business logic (`notify()`) that uses it |
| Concrete Creators | `EmailNotificationService`, ... | Override the factory method to return one specific product |

```
   Creator (abstract)                        Product (abstract)
+--------------------------+             +------------------+
|   NotificationService    |             |   Notification   |
+--------------------------+   uses      +------------------+
| + notify(to, msg)        | ----------> | + send(to, msg)  |
| + createNotification() * |             +------------------+
+--------------------------+                      ^
        ^         ^                               |
        |         |                     +---------+---------+
+-------+--+  +---+------+             |                   |
| EmailSvc |  |  SMSSvc  |     +-------+--------+  +-------+-------+
+----------+  +----------+     | EmailNotif...  |  |  SMSNotif...  |
| create() ---creates--------> +----------------+  +---------------+
+----------+                                ^
                    creates ----------------+
* = the factory method (overridden by each subclass)
```

## Code Example

```javascript
// ---------- Product interface (by convention — JS has no `interface`) ----------
class Notification {
  // Every concrete product must implement send()
  send(to, message) {
    throw new Error("send() must be implemented by a subclass");
  }
}

// ---------- Concrete Products ----------
class EmailNotification extends Notification {
  send(to, message) {
    console.log(`EMAIL to <${to}>: ${message}`);
    return { channel: "email", delivered: true };
  }
}

class SMSNotification extends Notification {
  send(to, message) {
    // SMS has channel-specific rules (160-char limit)
    const body = message.slice(0, 160);
    console.log(`SMS to ${to}: ${body}`);
    return { channel: "sms", delivered: true };
  }
}

class PushNotification extends Notification {
  send(to, message) {
    console.log(`PUSH to device ${to}: ${message}`);
    return { channel: "push", delivered: true };
  }
}

// ---------- Creator ----------
class NotificationService {
  // THE factory method — subclasses decide which product to build.
  createNotification() {
    throw new Error("createNotification() must be implemented by a subclass");
  }

  // Business logic lives here and works with ANY product via the
  // Notification interface. It never mentions a concrete class.
  notify(to, message) {
    if (!to) throw new Error("Recipient is required");
    const notification = this.createNotification(); // <- polymorphic step
    console.log("Dispatching via", this.constructor.name);
    return notification.send(to, message);
  }
}

// ---------- Concrete Creators ----------
class EmailNotificationService extends NotificationService {
  createNotification() {
    return new EmailNotification();
  }
}

class SMSNotificationService extends NotificationService {
  createNotification() {
    return new SMSNotification();
  }
}

class PushNotificationService extends NotificationService {
  createNotification() {
    return new PushNotification();
  }
}

// ---------- Client code ----------
// The client picks a creator once (e.g. from config) and then only ever
// talks to the abstract NotificationService API.
function getService(channel) {
  const services = {
    email: new EmailNotificationService(),
    sms:   new SMSNotificationService(),
    push:  new PushNotificationService(),
  };
  const service = services[channel];
  if (!service) throw new Error(`Unknown channel: ${channel}`);
  return service;
}

const service = getService("sms");
service.notify("+91-9999-000-111", "Your OTP is 482913");

getService("email").notify("dev@example.com", "Build #42 passed");
getService("push").notify("device-abc", "You have a new follower");
```

Output:

```
Dispatching via SMSNotificationService
SMS to +91-9999-000-111: Your OTP is 482913
Dispatching via EmailNotificationService
EMAIL to <dev@example.com>: Build #42 passed
Dispatching via PushNotificationService
PUSH to device device-abc: You have a new follower
```

**Simple Factory vs Factory Method** — a distinction interviewers love. The `getService()` helper above is a *Simple Factory*: one function with a lookup/switch that returns a product. It centralizes creation but you still edit it for each new type. The *Factory Method pattern* is the `createNotification()` override: creation varies by **subclassing**, so new channels are added without modifying existing code. In practice you often use both together, exactly as above.

## When to use / When NOT to use

**Use when:**
- A class must work with objects whose concrete type it can't (or shouldn't) know in advance.
- You expect the set of product types to **grow** — new payment methods, new notification channels, new vehicle types.
- You have shared workflow logic in a base class and only the "which object to create" step varies.
- You want creation logic (defaults, wiring, validation) in one named place instead of scattered `new` calls.

**Do NOT use when:**
- There's only one product type and no realistic growth — a plain `new` is honest and simpler.
- The variation is in *data*, not *behavior* — a parameterized constructor or a config object suffices.
- You'd be creating a subclass-per-product just for ceremony; in JS a simple factory function or an object map (`{ email: () => new EmailNotification() }`) is often the idiomatic middle ground.

## Real-world usages

- **`document.createElement("div")`** — the DOM hands you the right concrete element class (`HTMLDivElement`, `HTMLInputElement`, ...) from one factory method.
- **`Array.from()`, `Promise.resolve()`, `Buffer.from()`** — static factory methods that pick/construct the right instance for the input.
- **Express's `express()`** and **`http.createServer()`** in Node — factory functions that hide which concrete objects get wired together.
- **ORMs like Sequelize/TypeORM** — `sequelize.define(...)`/repository factories return model classes without the client naming the concrete implementation.

## Interview Notes

- Top question: *"Difference between Simple Factory, Factory Method, and Abstract Factory?"* — Simple Factory: one function + switch (not a GoF pattern). Factory Method: one product, subclasses choose the concrete class. Abstract Factory: **families** of related products.
- *"How does Factory Method support the Open/Closed Principle?"* — new product = new subclass; existing creator/workflow code is untouched.
- Machine-coding problems that use it: **Parking Lot** (create `Car`/`Bike`/`Truck` and their spot types), **Notification System**, **Payment Gateway** (UPI/Card/Wallet processors), **Vending Machine** (product creation), **Logger** (creating console/file/remote appenders).
- Be ready to sketch the four roles (Product, Concrete Product, Creator, Concrete Creator) and point at the *one* method that is "the factory method".
- JS-specific follow-up: *"Do you need classes for this in JavaScript?"* — no; higher-order functions and object maps achieve the same decoupling, but classes map cleanly to interview UML.

## Quick Recap

- Factory Method = **defer instantiation to subclasses**; the base class codes the workflow against an abstract product.
- Solves scattered `new` + `switch` statements; adding a type means adding classes, not editing existing ones (Open/Closed).
- Four roles: Product, Concrete Product, Creator (owns the factory method), Concrete Creator (overrides it).
- Don't confuse with Simple Factory (a switch in a function) or Abstract Factory (families of products).
- Canonical LLD pairing: Parking Lot vehicles, payment processors, notification channels.
