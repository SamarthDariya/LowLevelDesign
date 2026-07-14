# State

## Problem it solves

Think about a vending machine. What happens when you press "select item" depends entirely on the machine's current situation: if it's idle, it should ask for a coin; if a coin is in, it should dispense; if it's mid-dispense, it should ignore you; if it's sold out, it should say so. The same *action* has completely different *behavior* per state.

The naive implementation gives the machine a `status` string and every method becomes a `switch (this.status)` with a case per state. With 4 states and 4 actions you already have up to 16 branches, scattered across 4 methods. The logic of one state (say, "has coin") is smeared across every method instead of living in one place. Adding a fifth state means finding and editing every switch. Forgetting one case produces bugs like accepting coins while sold out. Transition rules ("after dispensing, go to idle unless stock hit zero") hide inside branch bodies where nobody can see the state machine as a whole.

The State pattern flips the table: instead of one class branching on a state variable, you create **one class per state**, each implementing all the actions the way *that state* handles them. The context (the machine) keeps a reference to its current state object and delegates every action to it. Transitions become explicit: a state handles an action, then tells the context which state comes next. The `switch` statements vanish, and each state's full behavior is readable in a single class.

## The Pattern

**Intent:** Allow an object to alter its behavior when its internal state changes. The object appears to change its class.

Participants:

- **Context** (`VendingMachine`): holds the current state object, delegates all behavior to it, exposes `setState` so states can transition it.
- **State (interface)** (`VendingMachineState`): one method per action (`insertCoin`, `selectItem`, `dispense`, `refund`), often with default "not allowed" implementations.
- **Concrete States** (`IdleState`, `HasCoinState`, `DispensingState`, `SoldOutState`): implement per-state behavior and trigger transitions.

```
        +--------------------+      delegates       +------------------------+
 client |     Context        |--------------------->|  <<State>>             |
 ------>|  VendingMachine    |                      |  + insertCoin()        |
        |  - state           |<---setState(next)----|  + selectItem() ...    |
        +--------------------+   states drive       +-----------^------------+
                                 transitions                    |
                     +---------------+---------------+----------+----+
                     |               |               |               |
               +-----+----+   +-----+------+  +-----+------+  +-----+-----+
               | Idle     |   | HasCoin    |  | Dispensing |  | SoldOut   |
               | State    |   | State      |  | State      |  | State     |
               +----------+   +------------+  +------------+  +-----------+

  State diagram:  Idle --coin--> HasCoin --select--> Dispensing --done--> Idle
                                    |                     |
                                  refund               stock==0
                                    v                     v
                                  Idle                 SoldOut
```

## Code Example

A vending machine. Save as `state.js` and run with `node state.js`.

```javascript
// ----- State interface: every state must handle every event -----
class VendingMachineState {
  constructor(machine) {
    this.machine = machine;
  }
  insertCoin()  { console.log('Cannot insert coin right now.'); }
  selectItem()  { console.log('Cannot select item right now.'); }
  dispense()    { console.log('Nothing to dispense.'); }
  refund()      { console.log('No coin to refund.'); }
}

// ----- Concrete states -----
class IdleState extends VendingMachineState {
  insertCoin() {
    console.log('Coin accepted.');
    this.machine.setState(this.machine.hasCoinState);
  }
  selectItem() {
    console.log('Insert a coin first.');
  }
}

class HasCoinState extends VendingMachineState {
  insertCoin() {
    console.log('Coin already inserted. Returning extra coin.');
  }
  selectItem() {
    if (this.machine.stock === 0) {
      console.log('Sold out! Refunding coin.');
      this.machine.setState(this.machine.soldOutState);
      return;
    }
    console.log('Item selected. Dispensing...');
    this.machine.setState(this.machine.dispensingState);
    this.machine.dispense(); // machine drives the next step
  }
  refund() {
    console.log('Coin refunded.');
    this.machine.setState(this.machine.idleState);
  }
}

class DispensingState extends VendingMachineState {
  insertCoin() { console.log('Please wait, dispensing in progress.'); }
  dispense() {
    this.machine.stock -= 1;
    console.log(`Item dispensed. Stock left: ${this.machine.stock}`);
    const next = this.machine.stock === 0
      ? this.machine.soldOutState
      : this.machine.idleState;
    this.machine.setState(next);
  }
}

class SoldOutState extends VendingMachineState {
  insertCoin() { console.log('Machine is sold out. Coin rejected.'); }
  selectItem() { console.log('Machine is sold out.'); }
}

// ----- Context: holds current state and delegates everything to it -----
class VendingMachine {
  #state;

  constructor(stock) {
    this.stock = stock;
    // Pre-create one instance of each state (they are stateless per-request)
    this.idleState = new IdleState(this);
    this.hasCoinState = new HasCoinState(this);
    this.dispensingState = new DispensingState(this);
    this.soldOutState = new SoldOutState(this);
    this.#state = stock > 0 ? this.idleState : this.soldOutState;
  }

  setState(state) {
    this.#state = state;
    console.log(`  [machine] -> ${state.constructor.name}`);
  }

  // Delegate every action to the current state object.
  insertCoin() { this.#state.insertCoin(); }
  selectItem() { this.#state.selectItem(); }
  dispense()   { this.#state.dispense(); }
  refund()     { this.#state.refund(); }
}

// ----- Client code -----
const machine = new VendingMachine(2);

machine.selectItem();   // Insert a coin first.
machine.insertCoin();   // Coin accepted. -> HasCoinState
machine.selectItem();   // Dispensing... Stock left: 1 -> IdleState

machine.insertCoin();
machine.refund();       // Coin refunded. -> IdleState

machine.insertCoin();
machine.selectItem();   // Stock left: 0 -> SoldOutState

machine.insertCoin();   // Machine is sold out. Coin rejected.
```

Design choices worth noticing: the base class provides safe "can't do that now" defaults, so each state only overrides what it actually supports; shared data (stock) lives on the context, not in states; and state instances are created once and reused because they hold no per-transaction data.

## When to use / When NOT to use

**Use when:**

- An object's behavior genuinely depends on its state, and it has 3+ states or 3+ actions (the switch-matrix is getting big).
- The same methods have large conditionals on a status field, repeated across methods.
- Transition rules are important business logic that should be explicit and testable (order lifecycle, document workflow, connection handling).
- New states are likely to be added (Open/Closed: new state = new class).

**Avoid when:**

- There are only 2 states with trivial differences — a boolean and an `if` are honest and simpler.
- The state rarely changes or the per-state behavior barely differs — you'd be adding a class per near-identical variant.
- The transitions are the whole story and behavior is trivial — a simple transition table (or a library like XState) may express it better than classes.

## Real-world usages

- TCP connections and protocol implementations — a socket behaves differently when `CLOSED`, `LISTENING`, `ESTABLISHED`; the TCP state machine is the canonical example.
- Order/subscription lifecycles in commerce systems — `Created → Paid → Shipped → Delivered / Cancelled`, where allowed actions differ per status.
- JS `Promise` — pending/fulfilled/rejected, with behavior of `.then` depending on the current state.
- UI and game development — media players (playing/paused/buffering), game character states (idle/running/jumping); XState formalizes this in the JS ecosystem.

## Interview Notes

- **The classic machine-coding pairs:** Vending Machine and Elevator practically *require* State — interviewers watch whether you reach for it or write switch ladders. Also: Traffic light, ATM, Order management, Media player, Document approval workflow.
- **State vs Strategy (asked constantly):** identical class diagrams, different intent. Strategy: client chooses the algorithm, strategies are independent and unaware of each other, rarely changes after selection. State: transitions are driven by the object/states themselves, states know about each other (they name their successors), and changing state is the norm.
- **Who triggers transitions?** Either the states (most common — keeps rules near behavior, as here) or the context. Be ready to defend your choice.
- Discuss handling invalid actions per state: silently ignore, log, or throw — say which and why (vending machines shouldn't crash; payment systems should refuse loudly).
- Mention scalability: states-as-classes vs a declarative transition table; for dozens of states, tables/statecharts scale better.

## Quick Recap

- One class per state; the context delegates every action to its current state object.
- States decide and trigger transitions — the state machine becomes explicit and readable.
- Replaces repeated `switch(status)` blocks scattered across methods.
- Default "not allowed" behavior in the base state keeps concrete states small.
- Vending Machine and Elevator interviews = State pattern; and know State vs Strategy.
