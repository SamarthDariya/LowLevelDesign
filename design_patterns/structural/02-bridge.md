# Bridge

## Problem it solves

Inheritance handles *one* dimension of variation well. The moment a class hierarchy varies along *two independent dimensions*, subclassing explodes combinatorially.

Concrete scenario: you're building a remote-control system for smart devices. You have device types (TV, Radio, Smart Speaker) and remote types (Basic remote, Advanced remote with mute/memory). With plain inheritance you'd need `BasicTVRemote`, `AdvancedTVRemote`, `BasicRadioRemote`, `AdvancedRadioRemote`, … — every new device or remote type multiplies the class count (`m × n` classes for `m` remotes and `n` devices). Adding a "Kids remote" means writing one subclass *per device*.

The Bridge pattern splits the hierarchy into two: an **abstraction** hierarchy (remotes) and an **implementation** hierarchy (devices), connected by composition — the remote *holds* a device. Each side can now grow independently: `m + n` classes instead of `m × n`. "Prefer composition over inheritance" is exactly this move.

## The Pattern

Participants:

- **Abstraction** — the high-level control layer clients use (e.g. `RemoteControl`). Holds a reference to an Implementor.
- **Refined Abstraction** — extended variants of the abstraction (e.g. `AdvancedRemote`).
- **Implementor** — the interface for the low-level work (e.g. `Device` with `getVolume`, `setVolume`, `enable`, `disable`).
- **Concrete Implementors** — actual devices (e.g. `TV`, `Radio`).

```
        Abstraction                     Implementor
      RemoteControl  ──────has-a──────▶   Device
       ▲                                   ▲     ▲
       │ extends                           │     │
  AdvancedRemote                          TV   Radio

  (remotes grow ↓ independently)   (devices grow ↓ independently)
```

The "bridge" is the composition arrow: abstraction methods delegate to implementor methods.

## Code Example

```javascript
// ---------- Implementor side: devices ----------
class Device {
  // Contract every device must fulfil
  isEnabled() { throw new Error('not implemented'); }
  enable()    { throw new Error('not implemented'); }
  disable()   { throw new Error('not implemented'); }
  getVolume() { throw new Error('not implemented'); }
  setVolume(v){ throw new Error('not implemented'); }
}

class TV extends Device {
  #on = false;
  #volume = 30;

  isEnabled() { return this.#on; }
  enable()    { this.#on = true;  console.log('TV: on'); }
  disable()   { this.#on = false; console.log('TV: off'); }
  getVolume() { return this.#volume; }
  setVolume(v) {
    this.#volume = Math.max(0, Math.min(100, v)); // clamp 0..100
    console.log(`TV: volume = ${this.#volume}`);
  }
}

class Radio extends Device {
  #on = false;
  #volume = 50;

  isEnabled() { return this.#on; }
  enable()    { this.#on = true;  console.log('Radio: on'); }
  disable()   { this.#on = false; console.log('Radio: off'); }
  getVolume() { return this.#volume; }
  setVolume(v) {
    this.#volume = Math.max(0, Math.min(100, v));
    console.log(`Radio: volume = ${this.#volume}`);
  }
}

// ---------- Abstraction side: remotes ----------
class RemoteControl {
  // #device is the "bridge" — remotes talk to ANY Device via its interface
  #device;

  constructor(device) {
    this.#device = device;
  }

  // protected-style accessor for subclasses (JS #fields aren't inherited)
  get device() { return this.#device; }

  togglePower() {
    this.#device.isEnabled() ? this.#device.disable() : this.#device.enable();
  }
  volumeUp()   { this.#device.setVolume(this.#device.getVolume() + 10); }
  volumeDown() { this.#device.setVolume(this.#device.getVolume() - 10); }
}

// A refined abstraction: adds features WITHOUT touching any device class
class AdvancedRemote extends RemoteControl {
  #savedVolume = 0;

  mute() {
    this.#savedVolume = this.device.getVolume();
    this.device.setVolume(0);
  }
  unmute() {
    this.device.setVolume(this.#savedVolume);
  }
}

// ---------- Client ----------
// Any remote works with any device: 2 remotes x 2 devices, 4 classes total
// (inheritance-only design would have needed 4 combo subclasses already).
const basicTvRemote = new RemoteControl(new TV());
basicTvRemote.togglePower(); // TV: on
basicTvRemote.volumeUp();    // TV: volume = 40

const advRadioRemote = new AdvancedRemote(new Radio());
advRadioRemote.togglePower(); // Radio: on
advRadioRemote.mute();        // Radio: volume = 0
advRadioRemote.unmute();      // Radio: volume = 50
```

Run with `node bridge.js`. Add a `SmartSpeaker` device or a `KidsRemote` (volume capped at 40) — each is exactly *one* new class, and every existing combination keeps working.

## When to use / When NOT to use

**Use when:**
- A class varies along two (or more) independent dimensions — shape × renderer, remote × device, notification-type × delivery-channel, report × export-format.
- You see subclass names that concatenate two concepts (`PdfInvoiceReport`, `CsvInvoiceReport`, `PdfSalesReport`…) — a class-explosion smell.
- You want to switch implementations at runtime (hand the abstraction a different implementor object).
- You want to develop/ship the two hierarchies independently (e.g. platform-specific backends).

**Do NOT use when:**
- There is only one dimension of variation — plain polymorphism (Strategy or simple subclassing) is simpler.
- The two "dimensions" never actually vary independently — you'd be paying indirection cost for flexibility you never use.
- You need to add responsibilities dynamically in layers — that's Decorator, not Bridge.

## Real-world usages

- Rendering libraries: charting APIs that draw via an SVG *or* Canvas *or* WebGL backend behind the same drawing abstraction (e.g. Chart.js/D3-style renderer switches).
- Database clients: one query-builder abstraction (Knex) bridged to dialect implementations (Postgres, MySQL, SQLite).
- Logging: a `Logger` abstraction over transport implementations (console, file, HTTP) — Winston's logger/transport split is bridge-shaped.
- UI toolkits: cross-platform frameworks where widget abstractions delegate to per-platform implementations (React Native components → iOS/Android native views).

## Interview Notes

- Classic question: **"Bridge vs. Strategy?"** — structurally similar (both compose an interface). Intent differs: Strategy swaps *one algorithm/behavior*; Bridge decouples *two whole class hierarchies* meant to evolve independently. Bridge is architectural/up-front; Strategy is behavioral/runtime.
- **"Bridge vs. Adapter?"** — Adapter is retrofitted to make *existing* incompatible classes work together; Bridge is designed *up front* to keep abstraction and implementation separate.
- The `m × n → m + n` class-count argument is the expected justification — say it explicitly.
- Machine-coding problems: notification system (Email/SMS/Push × Urgent/Digest), payment (method × gateway), cross-platform media player, shape drawing (Circle/Square × VectorRenderer/RasterRenderer).
- Watch out: JS `#private` fields are not visible to subclasses — expose a getter (as above) or use `_convention` fields when the abstraction hierarchy needs access.

## Quick Recap

- Bridge splits one bloated hierarchy into two independent ones: Abstraction (what clients call) and Implementor (how it's done).
- Connected by composition: the abstraction *has-a* implementor and delegates to it.
- Kills the `m × n` subclass explosion; new variants on either side cost one class.
- Implementor can be swapped at runtime; both sides evolve independently.
- Same shape as Strategy — different intent (two hierarchies vs. one pluggable algorithm).
