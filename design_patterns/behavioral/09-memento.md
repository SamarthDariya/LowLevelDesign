# Memento

## Problem it solves

Your text editor needs undo. The obvious idea: before each change, copy the editor's state somewhere, and on undo, copy it back. But the editor's state — content, cursor position, selection — is (rightly) private. Who stores the copies? If the history manager reaches into the editor and reads its private fields, encapsulation is destroyed: the editor can never change its internal representation without breaking the history manager. If instead the editor itself stores its whole history, it takes on a second job (state management *and* history bookkeeping), and you can't reuse the history logic for other objects.

The Memento pattern threads this needle with three roles. The **originator** (editor) knows its own internals, so *it* creates the snapshot — an opaque **memento** object — and *it* restores from one. The **caretaker** (history manager) stores mementos in a stack but treats them as sealed envelopes: it can hold them, order them, discard them, but never look inside. State stays encapsulated, history logic stays separate, and undo becomes: pop an envelope, hand it back to the originator.

Contrast this with Command-based undo: a command reverses an operation *incrementally* (`insert` undone by `remove`), while a memento *restores a full snapshot*. Snapshots are simpler and always correct (no tricky inverse logic), at the cost of memory. Real editors often combine them: commands for cheap reversible ops, mementos for messy ones — a command may store a memento taken before it executed.

## The Pattern

**Intent:** Without violating encapsulation, capture and externalize an object's internal state so that the object can be restored to this state later.

Participants:

- **Originator** (`TextEditor`): the object with valuable internal state; implements `save()` → memento and `restore(memento)`.
- **Memento** (`EditorSnapshot`): immutable snapshot; full state readable (ideally) only by the originator; may expose harmless metadata (timestamp, label) to the caretaker.
- **Caretaker** (`History`): stacks mementos, decides *when* to save/restore, never inspects contents.

```
+------------------+   save() creates    +--------------------+
|   Originator     |-------------------->|      Memento       |
|   TextEditor     |                     |  EditorSnapshot    |
|  - #content      |<--------------------|  (immutable state, |
|  - #cursor       |  restore(memento)   |   opaque envelope) |
|  + save()        |                     +---------^----------+
|  + restore(m)    |                               | stores, never opens
+------------------+                     +---------+----------+
                                         |     Caretaker      |
                                         |      History       |
                                         |  push(m) / pop()   |
                                         +--------------------+
```

## Code Example

Editor snapshots with undo. Save as `memento.js` and run with `node memento.js`.

```javascript
// ----- Memento: an immutable snapshot of the editor's state -----
// It exposes nothing but what the Originator needs to restore itself.
class EditorSnapshot {
  #content;
  #cursorPosition;
  #takenAt;

  constructor(content, cursorPosition) {
    this.#content = content;
    this.#cursorPosition = cursorPosition;
    this.#takenAt = new Date();
  }

  // Only the originator reads these to restore itself.
  get content()        { return this.#content; }
  get cursorPosition() { return this.#cursorPosition; }

  // Safe metadata for the caretaker to display in a history list.
  get label() {
    const preview = this.#content.slice(0, 20);
    return `[${this.#takenAt.toISOString()}] "${preview}..."`;
  }
}

// ----- Originator: the object whose state we snapshot -----
class TextEditor {
  #content = '';
  #cursorPosition = 0;

  type(text) {
    this.#content =
      this.#content.slice(0, this.#cursorPosition) +
      text +
      this.#content.slice(this.#cursorPosition);
    this.#cursorPosition += text.length;
  }

  moveCursor(position) {
    this.#cursorPosition = Math.max(0, Math.min(position, this.#content.length));
  }

  // Create a memento capturing the CURRENT internal state.
  save() {
    return new EditorSnapshot(this.#content, this.#cursorPosition);
  }

  // Restore internal state from a memento.
  restore(snapshot) {
    this.#content = snapshot.content;
    this.#cursorPosition = snapshot.cursorPosition;
  }

  get status() {
    return `"${this.#content}" (cursor at ${this.#cursorPosition})`;
  }
}

// ----- Caretaker: stores mementos, never looks inside them -----
class History {
  #snapshots = [];

  push(snapshot) {
    this.#snapshots.push(snapshot);
  }

  pop() {
    return this.#snapshots.pop();
  }

  get isEmpty() {
    return this.#snapshots.length === 0;
  }
}

// ----- Client code -----
const editor = new TextEditor();
const history = new History();

editor.type('Hello');
history.push(editor.save());          // snapshot 1: "Hello"

editor.type(' world');
history.push(editor.save());          // snapshot 2: "Hello world"

editor.moveCursor(5);
editor.type(',');                     // "Hello, world"
console.log('Now:      ', editor.status);

editor.restore(history.pop());        // back to snapshot 2
console.log('Undo once:', editor.status);

editor.restore(history.pop());        // back to snapshot 1
console.log('Undo twice:', editor.status);
```

JS notes: JavaScript can't give the originator *exclusive* access to memento internals the way Java's nested private classes can — conventions (private fields + minimal getters, or `Object.freeze` on plain snapshot objects) get you close enough. Strings and numbers are immutable, so this snapshot is naturally safe; if state contains objects/arrays, deep-copy them when creating the memento (`structuredClone` is the modern tool), or the "snapshot" will mutate along with the live state.

## When to use / When NOT to use

**Use when:**

- You need undo/rollback/checkpoints and reversing operations step-by-step is complex or impossible (rich formatting, physics state, transactions).
- You must snapshot state *without* exposing the object's internals to the code that stores the snapshots.
- You want "restore points": save-game slots, form drafts, transaction savepoints, wizard back-navigation.

**Avoid when:**

- State is large and changes are frequent — full snapshots eat memory fast; consider incremental Command-undo, diffs, or a capped history (e.g. keep only the last N snapshots).
- The state is trivially public and simple — `const backup = { ...obj }` needs no pattern vocabulary.
- State references shared external resources (open sockets, DB handles) that can't meaningfully be "restored" — snapshotting a handle doesn't snapshot the world behind it.

## Real-world usages

- Editor/IDE undo history and browser form restoration — snapshots of document/form state.
- Game save files and emulator save-states — a save slot is a memento; the caretaker is the save-slot UI, which never interprets the blob.
- Database transactions and savepoints — `SAVEPOINT` / `ROLLBACK TO` is create-memento / restore.
- Redux DevTools time travel — every dispatched action's resulting state is kept (cheap because state is immutable), letting you jump to any past state; git commits are mementos at filesystem scale.

## Interview Notes

- **The question you must nail: Memento vs Command for undo.** Command reverses operations (cheap, needs an inverse for every op); Memento restores snapshots (simple, correct by construction, memory-hungry). Real systems mix them; say when you'd pick which.
- **Machine-coding usage:** Text editor with undo, Snake & Ladder / Chess with "undo move" (snapshot board state), drawing apps, and any problem where the interviewer adds "...and support rollback" late in the interview — reach for Memento.
- Know the three roles crisply and *who may open the envelope*: only the originator. Interviewers probe whether your caretaker peeks into state (it must not).
- Memory management follow-up: cap the history (ring buffer), snapshot every N operations, or store diffs between snapshots.
- Immutability follow-up: why must the memento be immutable/deep-copied? Because a memento sharing references with live state silently stops being a snapshot.

## Quick Recap

- Snapshot pattern: originator creates/restores mementos; caretaker stores them unopened.
- Preserves encapsulation — history code never touches the object's internals.
- Undo = stack of mementos; restore = pop and hand back to the originator.
- Deep-copy mutable state into the memento, and keep mementos immutable.
- vs Command-undo: snapshots restore state wholesale; commands reverse operations incrementally — combine both in real editors.
