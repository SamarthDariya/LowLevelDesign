# Command

## Problem it solves

You are building a text editor. The user can type, delete, cut, paste — via keyboard shortcuts, menu items, toolbar buttons, or a macro. And of course, everything must support undo and redo. If each button directly calls `document.insert(...)`, three problems appear immediately. First, the same operation is wired up in four different UI places, each needing the same parameters and logic. Second, there is no way to *undo* a method call — once `insert` runs, the information about "what just happened" is gone. Third, features like macros ("record these 10 actions and replay them"), command queues, or transactional operations are impossible, because actions exist only as transient method calls.

The core insight of the Command pattern: **turn a request into an object.** Instead of calling `document.insert("hi", 5)` directly, you create `new InsertCommand(document, "hi", 5)` and hand it to an invoker that calls `command.execute()`. Now the action is a first-class value — it can be stored in a history stack, undone (each command knows how to reverse itself), redone, queued, logged, serialized, or replayed.

This is why every serious editor, drawing app, and IDE is built on commands: undo/redo is essentially free once every mutation goes through a command object with `execute()` and `undo()`.

## The Pattern

**Intent:** Encapsulate a request as an object, letting you parameterize clients with different requests, queue or log requests, and support undoable operations.

Participants:

- **Command (interface):** declares `execute()` and usually `undo()`.
- **Concrete Commands:** bind a receiver to an action and its parameters (`InsertCommand`, `DeleteCommand`). They store whatever state is needed to undo.
- **Receiver:** the object that does the actual work (`TextDocument`). Commands delegate to it.
- **Invoker:** triggers commands and owns the history (`Editor` with undo/redo stacks). Knows nothing about receivers.
- **Client:** creates commands and hands them to the invoker.

```
+-----------+   runCommand(c)  +--------------------+
|  Client   |----------------->|      Invoker       |
| (buttons, |                  |  Editor            |
|  keymaps) |                  |  - undoStack []    |
+-----------+                  |  - redoStack []    |
      | creates               +---------+----------+
      v                                 | c.execute() / c.undo()
+--------------------+                  v
|  <<Command>>       |        +-------------------+
|  + execute()       |        |     Receiver      |
|  + undo()          |        |  TextDocument     |
+---------^----------+        |  insert()/remove()|
          |                   +-------------------+
   +------+-------+                    ^
   |              |                    | delegates to
+--+---------+ +--+---------+          |
| Insert     | | Delete     |----------+
| Command    | | Command    |
+------------+ +------------+
```

## Code Example

A text editor with undo/redo. Save as `command.js` and run with `node command.js`.

```javascript
// ----- Receiver: the object that does the real work -----
class TextDocument {
  #content = '';

  insert(text, position) {
    this.#content =
      this.#content.slice(0, position) + text + this.#content.slice(position);
  }

  // Removes `length` chars at `position` and returns what was removed
  remove(position, length) {
    const removed = this.#content.slice(position, position + length);
    this.#content =
      this.#content.slice(0, position) + this.#content.slice(position + length);
    return removed;
  }

  get content() {
    return this.#content;
  }
}

// ----- Command interface (abstract base) -----
class Command {
  execute() { throw new Error('execute() must be implemented'); }
  undo()    { throw new Error('undo() must be implemented'); }
}

// ----- Concrete command: insert text -----
class InsertCommand extends Command {
  #doc; #text; #position;

  constructor(doc, text, position) {
    super();
    this.#doc = doc;
    this.#text = text;
    this.#position = position;
  }

  execute() { this.#doc.insert(this.#text, this.#position); }
  undo()    { this.#doc.remove(this.#position, this.#text.length); }
}

// ----- Concrete command: delete text -----
class DeleteCommand extends Command {
  #doc; #position; #length;
  #removedText = ''; // state saved during execute, needed for undo

  constructor(doc, position, length) {
    super();
    this.#doc = doc;
    this.#position = position;
    this.#length = length;
  }

  execute() { this.#removedText = this.#doc.remove(this.#position, this.#length); }
  undo()    { this.#doc.insert(this.#removedText, this.#position); }
}

// ----- Invoker: runs commands and keeps history -----
class Editor {
  #undoStack = [];
  #redoStack = [];

  runCommand(command) {
    command.execute();
    this.#undoStack.push(command);
    this.#redoStack = []; // a new action invalidates the redo history
  }

  undo() {
    const command = this.#undoStack.pop();
    if (!command) return console.log('(nothing to undo)');
    command.undo();
    this.#redoStack.push(command);
  }

  redo() {
    const command = this.#redoStack.pop();
    if (!command) return console.log('(nothing to redo)');
    command.execute();
    this.#undoStack.push(command);
  }
}

// ----- Client code -----
const doc = new TextDocument();
const editor = new Editor();

editor.runCommand(new InsertCommand(doc, 'Hello world', 0));
console.log(doc.content);                     // Hello world

editor.runCommand(new InsertCommand(doc, ', beautiful', 5));
console.log(doc.content);                     // Hello, beautiful world

editor.runCommand(new DeleteCommand(doc, 5, 11));
console.log(doc.content);                     // Hello world

editor.undo();                                // undoes the delete
console.log(doc.content);                     // Hello, beautiful world

editor.undo();                                // undoes the second insert
console.log(doc.content);                     // Hello world

editor.redo();                                // re-applies the second insert
console.log(doc.content);                     // Hello, beautiful world
```

Note how `DeleteCommand` saves the removed text during `execute()` — commands often need to capture "before" state to be reversible. When state is too complex to reverse step-by-step, combine Command with **Memento** (snapshot before executing).

## When to use / When NOT to use

**Use when:**

- You need undo/redo — this is *the* signature use case.
- You want to queue, schedule, log, or retry operations (job queues, transaction logs, event sourcing).
- Multiple UI triggers (button, shortcut, menu, macro) should invoke the same action without duplicating it.
- You want to decouple "the thing that triggers work" from "the thing that does work".

**Avoid when:**

- Operations are simple, immediate, and never need history/queueing — a direct method call or callback is less ceremony.
- In JS, if a command has no undo and no state, a plain function (closure) *is* the command — don't build a class hierarchy for `() => light.on()`.
- Memory matters and commands capture large before-states — consider Memento snapshots with limits, or diffs.

## Real-world usages

- Redux / event-sourced systems — actions are serializable command-like objects; dispatch is the invoker; time-travel debugging is the undo stack.
- GUI frameworks and editors — every menu item/toolbar button in apps like VS Code is bound to a named command (`editor.action.commentLine`) rather than a function call.
- Job/task queues (BullMQ, Sidekiq-style) — a job is a serialized command executed later, possibly on another machine, with retries.
- Database transactions and migrations — each migration has `up()`/`down()`, literally `execute()`/`undo()`.

## Interview Notes

- **The go-to question:** "Design a text editor with undo/redo" or "Design a remote control" — both are Command. Know the two-stack undo/redo mechanism cold, including why a new command clears the redo stack.
- **Command vs Strategy:** both wrap behavior in objects. Strategy = different *ways* of doing the same thing (interchangeable algorithms, chosen per context). Command = different *things to do* (each a distinct action), often stored/queued/undone. Strategy is about *how*, Command about *what and when*.
- **Machine-coding problems that expect Command:** Text editor, Remote control / Smart-home hub, Task scheduler / job queue, Restaurant ordering (order = command to kitchen), Transaction systems.
- Mention **MacroCommand** (a command containing a list of commands, executed together, undone in reverse) — a common follow-up.
- Know the four roles by name — interviewers often ask "who is the receiver here?" (answer: the domain object doing the work, not the command).

## Quick Recap

- Turn a request into an object with `execute()` (and usually `undo()`).
- Four roles: Client creates commands → Invoker triggers/stores them → Command delegates → Receiver does the work.
- Undo/redo = two stacks of executed commands; new action clears redo.
- Commands can be queued, logged, serialized, replayed — actions become data.
- Strategy = interchangeable *how*; Command = encapsulated *what*, with history.
