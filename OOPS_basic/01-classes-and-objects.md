# Classes and Objects

## What is it?

A **class** is a blueprint. An **object** is a real thing built from that blueprint. The class describes *what data* something holds (properties) and *what it can do* (methods). An object is one concrete instance of that description, with its own copy of the data.

Think of a real-world analogy: an architect's floor plan for a house. The floor plan (class) says "3 bedrooms, 2 bathrooms, kitchen faces east." It is not a house — you can't live in a drawing. But from that one plan, a builder can construct many actual houses (objects). Each house follows the same layout, yet each one is independent: painting house #1 blue doesn't change house #2.

In JavaScript, the `class` keyword (introduced in ES6) gives you this blueprint syntax. Under the hood JS is prototype-based, but for LLD purposes you can treat `class` exactly like classes in Java or C++ — it's the vocabulary interviewers expect. You create objects from a class with the `new` keyword, which runs the class's `constructor` to set up the initial state.

Two more ideas complete the picture: `this` (a reference to "the current object" inside a method) and `static` members (data or functions that belong to the class itself, not to any single object — like a counter of how many houses have been built from the plan).

## Why does it matter in LLD?

Every LLD interview starts here, even if nobody says the word "class." When you're asked to *"design a parking lot"* or *"design a library management system"*, your very first job is to identify the **entities** (ParkingLot, Vehicle, Ticket, Book, Member) and model each one as a class with sensible state and behavior. Getting this step right is 50% of the interview.

In real code, classes are how you organize a system into understandable units. A `User` class gathers everything about a user in one place instead of scattering `userName`, `userEmail`, `userAge` variables across ten files. Reviewers and interviewers judge you on whether your classes have **clear responsibilities** — a class should represent one concept and do it well (this later becomes the "S" in SOLID).

Interviewers also probe the small details: What goes in the constructor? Which methods belong on the object vs. `static` on the class? When do two objects count as "equal"? Clean answers here signal you can write production-quality object-oriented code, not just pseudocode.

## Code Example

```javascript
// book.js — run with: node book.js

class Book {
  // static property: belongs to the CLASS, shared by all objects
  static totalBooksCreated = 0;

  // The constructor runs once, when you write `new Book(...)`.
  // Its job: put the object into a valid starting state.
  constructor(title, author, price) {
    this.title = title;   // `this` = the specific object being created
    this.author = author;
    this.price = price;
    this.isCheckedOut = false;

    Book.totalBooksCreated++; // update the shared class-level counter
  }

  // Instance method: behavior available on every Book object
  checkOut() {
    if (this.isCheckedOut) {
      console.log(`"${this.title}" is already checked out.`);
      return false;
    }
    this.isCheckedOut = true;
    console.log(`You checked out "${this.title}".`);
    return true;
  }

  returnBook() {
    this.isCheckedOut = false;
    console.log(`"${this.title}" was returned.`);
  }

  // A method that USES the object's own data
  describe() {
    return `"${this.title}" by ${this.author} — $${this.price}`;
  }

  // Static method: called on the class, not on an object.
  // Great for factory helpers and utilities related to the class.
  static createFreeSample(title) {
    return new Book(title, "Unknown", 0);
  }
}

// ---- Creating objects (instances) ----
const book1 = new Book("Clean Code", "Robert C. Martin", 30);
const book2 = new Book("The Pragmatic Programmer", "Hunt & Thomas", 35);

console.log(book1.describe()); // "Clean Code" by Robert C. Martin — $30
console.log(book2.describe()); // "The Pragmatic Programmer" by Hunt & Thomas — $35

// Each object has INDEPENDENT state:
book1.checkOut();              // You checked out "Clean Code".
console.log(book1.isCheckedOut); // true
console.log(book2.isCheckedOut); // false  <-- book2 untouched

// Static members are accessed via the class name:
console.log(Book.totalBooksCreated); // 2

const sample = Book.createFreeSample("LLD Primer");
console.log(sample.describe());      // "LLD Primer" by Unknown — $0
console.log(Book.totalBooksCreated); // 3

// Objects are reference types: two variables can point to the SAME object
const alias = book1;
alias.price = 25;
console.log(book1.price); // 25 — alias and book1 are the same object

// But two objects with identical data are still DIFFERENT objects
const copy = new Book("Clean Code", "Robert C. Martin", 25);
console.log(book1 === copy); // false — different objects in memory
```

Key things to notice:

- `new Book(...)` allocates a fresh object and runs `constructor` with `this` bound to it.
- `book1` and `book2` share methods (defined once on the class) but have separate data.
- `static` members (`totalBooksCreated`, `createFreeSample`) live on `Book` itself.
- `===` on objects compares *identity* (same memory reference), not contents.

## Common Mistakes

- **Forgetting `new`** — calling `Book("title")` instead of `new Book("title")`. With `class` syntax JS throws an error, which is helpful; but the habit matters because factory functions without `new` behave differently.
- **Putting heavy logic in the constructor** — constructors should initialize state, not make network calls, read files, or run long loops. Keep them cheap and predictable.
- **Using a class as a grab-bag** — a `Utils` or `Manager` class holding 30 unrelated methods isn't object-oriented design; each class should model one concept.
- **Confusing instance and static members** — trying `book1.totalBooksCreated` (undefined) or `Book.checkOut()` (error). Instance data goes through the object; class data goes through the class.
- **Assuming assignment copies objects** — `const b = book1` copies the *reference*, not the object. Mutating `b` mutates `book1`.

## Interview Notes

- LLD interviews almost always begin with *"What are the core entities/classes?"* Practice extracting nouns from a problem statement (Parking Lot → `ParkingLot`, `Floor`, `Slot`, `Vehicle`, `Ticket`) and verbs into methods (`parkVehicle()`, `generateTicket()`).
- Be ready to justify **what state each class owns**. "Why does `Ticket` store the entry time instead of `ParkingLot`?" — because the ticket is the record of one parking event.
- Interviewers like seeing `static` used deliberately: ID generators, counters, factory methods (`Ticket.issueFor(vehicle)`).
- Know the difference between a class and an object cold — it's a common warm-up question, and a fumbled answer sets a bad tone.
- Mentioning that JS classes are syntactic sugar over prototypes earns a small bonus point, but don't dwell on it — the design conversation is what matters.

## Quick Recap

- A class is a blueprint (data + behavior); an object is a live instance created with `new`.
- The `constructor` initializes each object's state; `this` refers to the current object inside methods.
- Every object has independent instance data; methods are shared via the class.
- `static` properties/methods belong to the class itself — use them for counters, constants, and factory helpers.
- Objects are reference types: `===` compares identity, and assignment copies references, not data.
