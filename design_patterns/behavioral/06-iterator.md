# Iterator

## Problem it solves

You build a `Playlist` class backed by a linked list (fast insertion between songs). A teammate builds a `SongLibrary` backed by a hash map of albums. Now every piece of code that wants to loop over songs must know the internals: linked-list consumers walk `node.next`, library consumers do nested loops over map values. Change the underlying structure — say, playlist moves to an array — and every consumer breaks. The collection's storage details have leaked everywhere.

There is a second, subtler problem: a collection may have *several* meaningful traversal orders. A playlist can be played in order, shuffled, or filtered by artist. Bolting `forEachInOrder`, `forEachShuffled`, `forEachByArtist` methods onto the collection bloats its interface, and none of them compose with language features like `for...of` or spread.

The Iterator pattern extracts traversal into its own object with a tiny uniform interface — essentially "give me the next element, and tell me when you're done." Consumers depend only on that interface, so any collection that produces iterators is traversable the same way, regardless of storage. Multiple simultaneous traversals just mean multiple iterator objects, each tracking its own position. JavaScript bakes this pattern into the language: the *iteration protocol* (`Symbol.iterator`, `next()` returning `{ value, done }`) is exactly the GoF Iterator, and generators make writing iterators almost effortless.

## The Pattern

**Intent:** Provide a way to access the elements of an aggregate object sequentially without exposing its underlying representation.

Participants:

- **Iterable (Aggregate)** (`Playlist`): the collection; exposes a factory method that returns an iterator — in JS, `[Symbol.iterator]()`.
- **Iterator:** holds a cursor into the collection; in JS, any object with `next()` returning `{ value, done }`. Generators produce these for you.
- **Client:** consumes elements through the iterator only — `for...of`, spread `...`, destructuring, `Array.from` all use it under the hood.

```
+---------------------+   creates    +----------------------+
|  <<Iterable>>       |------------->|  <<Iterator>>        |
|  Playlist           |              |  + next()            |
|  + [Symbol.iterator]|              |    -> {value, done}  |
|  + byArtist(a)      |              |  (each has its own   |
|  + shuffled()       |              |   cursor/position)   |
+---------------------+              +----------^-----------+
                                                |
                                     for...of / [...x] / Array.from
                                                |
                                          +-----+------+
                                          |   Client   |
                                          +------------+
```

## Code Example

A playlist backed by a linked list, with three traversal orders. Save as `iterator.js` and run with `node iterator.js`.

```javascript
// ----- A custom collection: a playlist backed by a linked list -----
class SongNode {
  constructor(title, artist) {
    this.title = title;
    this.artist = artist;
    this.next = null;
  }
}

class Playlist {
  #head = null;
  #tail = null;
  #size = 0;

  add(title, artist) {
    const node = new SongNode(title, artist);
    if (!this.#head) {
      this.#head = node;
    } else {
      this.#tail.next = node;
    }
    this.#tail = node;
    this.#size += 1;
    return this; // allow chaining
  }

  get size() {
    return this.#size;
  }

  // Default iteration order: insertion order.
  // A generator function is the idiomatic JS way to build an iterator:
  // each `yield` produces one { value, done } step for the consumer.
  *[Symbol.iterator]() {
    let current = this.#head;
    while (current !== null) {
      yield current;         // hand out one song at a time
      current = current.next;
    }
  }

  // Alternative traversal #1: only songs by a given artist.
  *byArtist(artist) {
    for (const song of this) {          // reuses the default iterator
      if (song.artist === artist) yield song;
    }
  }

  // Alternative traversal #2: shuffled order (Fisher-Yates on a copy).
  // Note: the copy means the traversal never mutates the collection.
  *shuffled() {
    const songs = [...this];            // spread also uses Symbol.iterator
    for (let i = songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [songs[i], songs[j]] = [songs[j], songs[i]];
    }
    yield* songs; // delegate to the array's own iterator
  }
}

// ----- Client code: consumers never touch SongNode.next -----
const playlist = new Playlist()
  .add('Bohemian Rhapsody', 'Queen')
  .add('Stairway to Heaven', 'Led Zeppelin')
  .add('Under Pressure', 'Queen')
  .add('Kashmir', 'Led Zeppelin');

console.log('--- Insertion order (for...of) ---');
for (const song of playlist) {
  console.log(`${song.title} — ${song.artist}`);
}

console.log('--- Only Queen ---');
for (const song of playlist.byArtist('Queen')) {
  console.log(song.title);
}

console.log('--- Shuffled ---');
console.log([...playlist.shuffled()].map((s) => s.title).join(' | '));

// Because Playlist is iterable, all iterable-consuming syntax works:
const [first, second] = playlist;               // destructuring
console.log('First two:', first.title, '/', second.title);
console.log('Titles:', Array.from(playlist, (s) => s.title));

// You can also drive the iterator manually — this is what for...of does:
const it = playlist[Symbol.iterator]();
console.log(it.next().value.title); // Bohemian Rhapsody
console.log(it.next().value.title); // Stairway to Heaven
```

Key observations: generators (`function*`, `*method()`) are *lazy* — a `yield` runs only when the consumer asks for the next value, so `byArtist` never builds an intermediate array; and each call to a generator method returns a *fresh* iterator, so two loops over the same playlist don't interfere.

## When to use / When NOT to use

**Use when:**

- You build a custom collection (tree, graph, linked list, paginated API wrapper) and want clients to use `for...of`, spread, and destructuring naturally.
- One collection needs multiple traversal orders (in-order/pre-order for trees, filtered views, reversed).
- You want lazy or infinite sequences (ID generators, streams of pages) — generators shine here.
- You want to hide storage so you can change it later without breaking consumers.

**Avoid when:**

- The data is just an array — arrays are already iterable; don't wrap them in ceremony.
- Consumers need random access by index or bulk operations — an iterator's strictly-sequential contract fights you.
- You need to mutate the collection while iterating — most iterators (including JS built-ins like `Map`'s during certain mutations) have undefined or surprising behavior; collect first, then mutate.

## Real-world usages

- The JS language itself — `for...of`, `...spread`, destructuring, `yield*`, `Array.from`, `Promise.all(iterable)` all consume the iteration protocol; `Array`, `Map`, `Set`, `String` all implement it.
- Node.js streams and async iteration — `for await (const chunk of readableStream)` is the async iterator protocol; database cursors (e.g. MongoDB cursors) expose the same idea for result sets too big for memory.
- Paginated API clients — SDKs (AWS, Octokit, Stripe) expose auto-paginating async iterators so you loop over items while pages are fetched lazily behind the scenes.
- The Iterator Helpers proposal / lodash chains — `map`/`filter`/`take` directly on iterators for lazy pipelines.

## Interview Notes

- **Know the protocol precisely:** an *iterable* has `[Symbol.iterator]()`; an *iterator* has `next()` returning `{ value, done }`. A generator object is both (it's an iterable iterator). Interviewers ask you to implement `Symbol.iterator` by hand without a generator — practice the closure version once.
- **Classic question:** "Make this custom class work with `for...of`" or "implement `range(start, end, step)`" — both are one small generator.
- **Async variant:** `Symbol.asyncIterator` + `for await...of` — mention it for anything involving streams or paginated fetches.
- **Machine-coding usage:** any collection-heavy design — e.g. exposing songs in a Music Player, products in Inventory, or tree traversal in a File System design — where showing a `Symbol.iterator` on your collection class signals JS fluency.
- **Internal vs external iteration:** `forEach(cb)` is internal (collection drives), iterators are external (client drives — can pause, zip two together, break early cheaply). Know why external is more flexible.

## Quick Recap

- Iterator = sequential access to a collection without exposing its storage.
- In JS the pattern is built-in: iterable (`Symbol.iterator`) → iterator (`next()` → `{value, done}`).
- Generators (`function*` + `yield`) are the shortest way to write correct, lazy iterators.
- Multiple traversals = multiple generator methods, each returning a fresh, independent iterator.
- Bonus dimensions: async iterators for streams/pagination; external iteration beats `forEach` for control.
