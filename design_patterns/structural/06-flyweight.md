# Flyweight

## Problem it solves

Sometimes you need a *huge* number of similar objects, and the naive approach — one full object per logical item — blows up memory.

Concrete scenario: a text editor. A 1-million-character document could hold one object per character, each storing the glyph (`'a'`), font family, font size, and style — plus its position. But notice: across a million characters there are maybe a few hundred *distinct* (glyph, font, size, style) combinations. Storing `"Times New Roman", 12, bold` a million times is pure waste. The same problem hits games (a forest of 100,000 trees sharing ~5 tree models/textures) and map apps (millions of markers sharing a handful of icons).

The Flyweight pattern splits object state into two parts. **Intrinsic state** — the part shared by many objects (glyph + font + style; tree mesh + texture) — is stored once in an immutable shared object, handed out by a factory that caches instances. **Extrinsic state** — the part unique to each use (position, this tree's x/y coordinates) — is kept outside the flyweight and *passed in* at call time. A million characters become a million tiny `{flyweightRef, position}` records pointing at a few hundred shared flyweights.

## The Pattern

Participants:

- **Flyweight** — immutable object holding intrinsic (shared) state; its methods accept extrinsic state as parameters (e.g. `CharacterStyle.render(char, position)`).
- **Flyweight Factory** — creates and caches flyweights; returns an existing instance when asked for the same intrinsic state again.
- **Context / Client** — stores extrinsic state (position etc.) plus a reference to a flyweight.

```
Client/context objects            FlyweightFactory
 {ch:'H', pos:0, style ─┐          cache: { "Arial|12|bold" : ●,
 {ch:'i', pos:1, style ─┼───▶               "Arial|12|normal": ● }
 {ch:'!', pos:2, style ─┘                     ▲
                                    getStyle() returns SHARED instances
   many light contexts                 few heavy flyweights
   (extrinsic state)                   (intrinsic state, immutable)
```

The flyweight must be **immutable** — it's shared, so mutating it would silently change thousands of contexts at once.

## Code Example

```javascript
// ---------- Flyweight: shared, immutable intrinsic state ----------
class CharacterStyle {
  #font; #size; #bold;

  constructor(font, size, bold) {
    this.#font = font;
    this.#size = size;
    this.#bold = bold;
    Object.freeze(this); // shared objects must never mutate
  }

  // Extrinsic state (the actual char and its position) is passed IN —
  // it is NOT stored on the shared object.
  render(char, position) {
    return `'${char}' @${position} [${this.#font} ${this.#size}px` +
           `${this.#bold ? ' bold' : ''}]`;
  }
}

// ---------- Flyweight Factory: caches by intrinsic-state key ----------
class StyleFactory {
  static #cache = new Map();

  static getStyle(font, size, bold) {
    const key = `${font}|${size}|${bold}`;
    if (!this.#cache.has(key)) {
      this.#cache.set(key, new CharacterStyle(font, size, bold));
      console.log(`(factory) created new style: ${key}`);
    }
    return this.#cache.get(key); // same key -> the SAME object
  }

  static get count() { return this.#cache.size; }
}

// ---------- Context: light per-character record ----------
class Character {
  #char; #position; #style; // style is a shared flyweight reference

  constructor(char, position, style) {
    this.#char = char;
    this.#position = position;
    this.#style = style;
  }
  render() { return this.#style.render(this.#char, this.#position); }
}

// ---------- Client: a document with many characters, few styles ----------
class Document {
  #chars = [];

  insert(char, font, size, bold) {
    const style = StyleFactory.getStyle(font, size, bold);
    this.#chars.push(new Character(char, this.#chars.length, style));
  }
  render() { this.#chars.forEach((c) => console.log(c.render())); }
  get length() { return this.#chars.length; }
}

const doc = new Document();
// "Hello" in Arial 12 normal, "LLD" in Arial 12 bold, "!" back to normal
for (const ch of 'Hello ') doc.insert(ch, 'Arial', 12, false);
for (const ch of 'LLD')    doc.insert(ch, 'Arial', 12, true);
doc.insert('!', 'Arial', 12, false);

doc.render();
console.log(`${doc.length} characters, but only ` +
            `${StyleFactory.count} style objects in memory`);
// 10 characters, but only 2 style objects in memory

// Proof of sharing: identical intrinsic state -> identical reference
const a = StyleFactory.getStyle('Arial', 12, false);
const b = StyleFactory.getStyle('Arial', 12, false);
console.log('Same instance reused?', a === b); // true
```

Run with `node flyweight.js`. Scale the loop to a million characters and the style count stays tiny — that's the entire point.

## When to use / When NOT to use

**Use when:**
- You create very large numbers of objects and it *measurably* hurts memory (profile first).
- Object state splits cleanly into shared/immutable (intrinsic) and per-use (extrinsic) parts.
- Extrinsic state is cheap to compute or store outside (positions in an array, coordinates in the caller).
- Typical domains: text/glyph rendering, game entities (trees, bullets, particles), map markers, syntax-highlighting tokens.

**Do NOT use when:**
- Object counts are modest — the factory, cache, and state-splitting complexity buy you nothing.
- The "shared" state actually needs to vary per object or mutate — sharing mutable state is a bug farm.
- CPU is the bottleneck, not RAM — flyweight trades a little lookup/parameter-passing cost for memory; it doesn't speed logic up.
- Threading/concurrency concerns aside (JS is single-threaded per realm), beware caches that grow forever — you may need eviction.

## Real-world usages

- **String interning**: JS engines (V8) dedupe identical string literals internally; `Symbol.for('key')` is an explicit interning registry.
- Small-integer and object caching in engines/runtimes (V8 caches small integers — same idea: share immutable values).
- Game engines and graphics: sprite sheets / instanced rendering in WebGL and Three.js (`InstancedMesh`) share one geometry+material across thousands of instances.
- React element type sharing and virtual-DOM diffing lean on referentially shared immutable structures; likewise immutable-data libs (Immutable.js) share unchanged subtrees.

## Interview Notes

- The must-know vocabulary: **intrinsic vs. extrinsic state** — interviewers listen for these exact words and for "flyweights must be immutable".
- **"Flyweight vs. Singleton?"** — Singleton = exactly one instance of a class; Flyweight = one instance *per distinct intrinsic state*, many instances total, managed by a factory cache.
- **"Flyweight vs. object pool?"** — a pool *lends out* mutable objects for exclusive temporary use and takes them back; flyweights are *shared simultaneously* and immutable.
- Machine-coding problems: text editor (classic), chess/board games (share piece definitions across boards), map/marker rendering, particle systems, browser-like DOM with repeated styles.
- Be ready to estimate savings: `N objects × S bytes` vs. `K flyweights × S + N × (pointer + extrinsic)` — do the arithmetic out loud.

## Quick Recap

- Flyweight shares the heavy, repeated part of object state (intrinsic) and externalizes the unique part (extrinsic, passed as parameters).
- A factory caches flyweights by intrinsic-state key; same key returns the same instance.
- Shared flyweights must be immutable (`Object.freeze` helps enforce this in JS).
- It's a memory optimization — apply only after profiling shows object volume is the problem.
- Distinct from Singleton (one per class) and pools (exclusive checkout of mutables).
