# Mediator

## Problem it solves

You are building a chat room. The first version is small: when Alice sends a message, her `User` object loops over its list of other users and calls `receive()` on each. Then features arrive: private messages, moderation (kicked users must stop receiving), muted users, join/leave notices, message history. Suddenly every `User` needs a reference to every other `User`, plus knowledge of mute lists, kick status, and delivery rules. With *n* users you have on the order of *n²* potential object-to-object links, and the delivery policy is duplicated inside every user.

This is the many-to-many coupling problem. It shows up identically in UI dialogs (the "Save" button must enable when the form is valid, which depends on three inputs and a checkbox — should each widget know about the others?), and in air traffic: planes must not talk to each other pairwise to negotiate landing order.

The Mediator pattern introduces a hub. Colleagues (users, widgets, planes) never reference each other — each knows only the mediator. All interaction flows through it: Alice tells the *room* "say this", and the room decides who receives it, applying mute/kick/formatting rules in one place. Coupling drops from many-to-many to many-to-one, and interaction policy gets a single home. The trade-off is explicit and worth stating up front: the mediator can grow into a god object — you are centralizing complexity on purpose, so keep the mediator's job description narrow.

## The Pattern

**Intent:** Define an object that encapsulates how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly.

Participants:

- **Mediator** (`ChatRoom`): interface/implementation of the coordination logic; knows all colleagues; routes and applies interaction rules.
- **Colleagues** (`User`): hold a reference to the mediator only; send by asking the mediator; expose a `receive`-style method for the mediator to call.

```
   WITHOUT mediator (n^2 links):        WITH mediator (n links):

    Alice <-------> Bob                  Alice     Bob     Carol
      ^  \        /  ^                      \       |       /
      |   \      /   |                       v      v      v
      v    v    v    v                     +----------------+
    Carol <-----> Dave                     |    ChatRoom    |
                                           |   (Mediator)   |
                                           | routing rules, |
                                           | mute/kick, ... |
                                           +----------------+
```

## Code Example

A chat room mediator. Save as `mediator.js` and run with `node mediator.js`.

```javascript
// ----- Mediator: the chat room. All communication flows through it. -----
class ChatRoom {
  #users = new Map(); // name -> User

  register(user) {
    this.#users.set(user.name, user);
    user.setRoom(this); // give the colleague a back-reference
    this.#systemNotice(`${user.name} joined the room`);
  }

  // Colleagues call these; the mediator decides who actually receives what.
  sendPublic(from, message) {
    for (const user of this.#users.values()) {
      if (user !== from) user.receive(from.name, message);
    }
  }

  sendPrivate(from, toName, message) {
    const recipient = this.#users.get(toName);
    if (!recipient) {
      from.receive('room', `User "${toName}" is not here.`);
      return;
    }
    recipient.receive(`${from.name} (private)`, message);
  }

  kick(name) {
    if (this.#users.delete(name)) {
      this.#systemNotice(`${name} was removed from the room`);
    }
  }

  #systemNotice(text) {
    for (const user of this.#users.values()) {
      user.receive('room', text);
    }
  }
}

// ----- Colleague: knows only the mediator, never other users -----
class User {
  #room = null;

  constructor(name) {
    this.name = name;
  }

  setRoom(room) {
    this.#room = room;
  }

  say(message) {
    this.#room.sendPublic(this, message); // no reference to other Users!
  }

  whisper(toName, message) {
    this.#room.sendPrivate(this, toName, message);
  }

  receive(fromName, message) {
    console.log(`  ${this.name}'s screen | ${fromName}: ${message}`);
  }
}

// ----- Client code -----
const room = new ChatRoom();

const alice = new User('Alice');
const bob = new User('Bob');
const carol = new User('Carol');

room.register(alice);
room.register(bob);
room.register(carol);

console.log('--- public message ---');
alice.say('Hey everyone!');

console.log('--- private message ---');
bob.whisper('Alice', 'Lunch at 1?');

console.log('--- moderation, a mediator-only concern ---');
room.kick('Carol');
alice.say('Just us now.');
```

Notice what moving logic into the mediator bought us: `kick` required changing *zero* lines of `User` — once removed from the room's map, Carol simply stops receiving, because delivery was never the users' job. New policies (mute, rate limiting, profanity filter, message history) all land in `ChatRoom` alone.

## When to use / When NOT to use

**Use when:**

- A set of objects communicate in complex many-to-many ways and the web of references is getting unmanageable.
- Interaction *policy* (who may talk to whom, in what order, under what conditions) deserves one authoritative home — chat rooms, auctions, matchmaking lobbies, air traffic control.
- You want to reuse colleague classes independently — a `User` that knows only "a room" is reusable across room types; one hard-wired to specific other users is not.
- UI forms where multiple widgets enable/disable/validate each other — the dialog acts as mediator.

**Avoid when:**

- Only two objects interact, or interactions are simple one-way notifications — Observer or a direct call is lighter.
- The mediator starts absorbing colleagues' business logic — the **god object** trap; the mediator should coordinate, not do everyone's work.
- You need broadcast to an *open-ended, anonymous* set of receivers — that's Observer/pub-sub; Mediator implies a known cast of colleagues and richer two-way coordination.

## Real-world usages

- Chat servers and Socket.IO rooms — the server/room object routes messages between clients that never hold references to each other.
- Air traffic control — the textbook non-software example; planes coordinate exclusively through the tower.
- Message brokers and event buses (Kafka, RabbitMQ, an in-app EventBus) — architectural-scale mediators between services/components.
- UI frameworks — a form/dialog controller coordinating its widgets; Redux's store + reducers can be viewed as a mediator between decoupled components.

## Interview Notes

- **The pairing everyone asks: Mediator vs Observer.** Observer: one subject broadcasts to many anonymous subscribers; logic lives in the *receivers*. Mediator: many known colleagues communicate through a hub; the *routing/policy logic lives in the middle*. A mediator is often *implemented using* Observer (colleagues emit events the mediator listens to) — saying this earns points.
- **Machine-coding problems that expect Mediator:** Chat application (rooms), Online auction system (bidders never see each other; the auctioneer mediates bids), Airline/ATC simulation, Matchmaking or game lobby, complex form/wizard UIs.
- Be ready for the god-object question: "Doesn't this just move the mess into one class?" Answer: yes, deliberately — the complexity is inherent to the interaction; the pattern gives it *one* testable home instead of *n* duplicated ones; split into multiple mediators if it grows.
- Know the direction of knowledge: colleagues → mediator (they call it), mediator → colleagues (it calls their receive methods). Neither colleagues nor mediator subclassing each other.
- Follow-up they like: how would you scale the chat room across servers? (The mediator becomes a distributed broker — Redis pub/sub etc. — same pattern, bigger hub.)

## Quick Recap

- Replaces many-to-many object links with many-to-one links through a hub.
- Colleagues know only the mediator; the mediator knows everyone and owns interaction rules.
- New interaction policies change the mediator only — colleagues stay untouched.
- Trade-off: centralizes complexity; watch for the god-object smell, split mediators when needed.
- Observer = anonymous broadcast; Mediator = known colleagues + central coordination logic.
