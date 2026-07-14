# Visitor

## Problem it solves

You model a file system: `FileNode` and `DirectoryNode` classes forming a tree. Then requirements arrive in waves: compute total size; pretty-print the tree; find large files; export to JSON; scan for viruses; count files per extension. Where does all this code go?

Option one: add a method per operation to every node class. `FileNode` and `DirectoryNode` each grow `getSize()`, `print()`, `findLarge()`, `toJson()`, `scan()`... The node classes — which should just *be* a tree — bloat with unrelated concerns (formatting! security!), and every new operation forces edits to every node class. If the class hierarchy is stable but operations multiply, you're paying the worst possible cost per operation.

The Visitor pattern inverts the layout: group code *by operation* instead of *by class*. Each operation becomes one visitor class with a method per node type (`visitFile`, `visitDirectory`). Nodes get a single tiny method, `accept(visitor)`, which calls the visitor method matching their own concrete type. This trick — called **double dispatch** — means the executed code depends on *two* runtime types (node type × visitor type) without any `instanceof` checks: the node picks the method, the visitor supplies the implementation. New operation = one new visitor class, zero changes to the node hierarchy. The trade-off is symmetrical: adding a new *node type* now touches every visitor — which is why Visitor fits stable hierarchies with growing operations.

## The Pattern

**Intent:** Represent an operation to be performed on the elements of an object structure. Visitor lets you define a new operation without changing the classes of the elements on which it operates.

Participants:

- **Element interface** (`FileSystemNode`): declares `accept(visitor)`.
- **Concrete Elements** (`FileNode`, `DirectoryNode`): each implements `accept` as exactly one line — `visitor.visitX(this)` — announcing its concrete type.
- **Visitor interface:** one `visitX` method per concrete element type.
- **Concrete Visitors** (`SizeCalculatorVisitor`, `TreePrinterVisitor`, ...): one class per operation; may hold traversal state (depth, accumulated results).

```
+--------------------+  accept(v)   +---------------------------+
| <<Element>>        |------------->| <<Visitor>>               |
| FileSystemNode     |              |  + visitFile(file)        |
|  + accept(visitor) |              |  + visitDirectory(dir)    |
+---------^----------+              +-------------^-------------+
          |                                       |
   +------+---------+               +-------------+--------------+
   |                |               |             |              |
+--+-------+ +------+------+  +-----+-----+ +-----+------+ +-----+------+
| FileNode | | Directory   |  | Size      | | Tree       | | LargeFile  |
| accept:  | | Node        |  | Calculator| | Printer    | | Finder     |
| v.visit  | | accept:     |  +-----------+ +------------+ +------------+
| File(me) | | v.visit     |
+----------+ | Directory   |   Double dispatch:
             | (me)        |   node.accept(v) -> v.visitFile(node)
             +-------------+   (runtime type of BOTH picks the code)
```

## Code Example

File-system size/report calculation. Save as `visitor.js` and run with `node visitor.js`.

```javascript
// ----- Element hierarchy: a file system tree -----
// Each element implements accept(visitor) and calls the visitor
// method that matches its own concrete type ("double dispatch").
class FileSystemNode {
  constructor(name) {
    this.name = name;
  }
  accept(visitor) {
    throw new Error('accept() must be implemented');
  }
}

class FileNode extends FileSystemNode {
  constructor(name, sizeInBytes) {
    super(name);
    this.sizeInBytes = sizeInBytes;
  }
  accept(visitor) {
    return visitor.visitFile(this); // "I am a File" — picks the right overload
  }
}

class DirectoryNode extends FileSystemNode {
  #children = [];

  add(node) {
    this.#children.push(node);
    return this;
  }
  get children() {
    return [...this.#children];
  }
  accept(visitor) {
    return visitor.visitDirectory(this); // "I am a Directory"
  }
}

// ----- Visitor 1: compute total size -----
class SizeCalculatorVisitor {
  visitFile(file) {
    return file.sizeInBytes;
  }
  visitDirectory(dir) {
    // The visitor controls the traversal: sum sizes of all children.
    return dir.children.reduce((sum, child) => sum + child.accept(this), 0);
  }
}

// ----- Visitor 2: pretty-print the tree -----
class TreePrinterVisitor {
  #depth = 0;

  visitFile(file) {
    console.log(`${'  '.repeat(this.#depth)}- ${file.name} (${file.sizeInBytes} B)`);
  }
  visitDirectory(dir) {
    console.log(`${'  '.repeat(this.#depth)}+ ${dir.name}/`);
    this.#depth += 1;
    for (const child of dir.children) child.accept(this);
    this.#depth -= 1;
  }
}

// ----- Visitor 3: find large files -----
class LargeFileFinderVisitor {
  #threshold;
  results = [];

  constructor(thresholdBytes) {
    this.#threshold = thresholdBytes;
  }
  visitFile(file) {
    if (file.sizeInBytes >= this.#threshold) this.results.push(file.name);
  }
  visitDirectory(dir) {
    for (const child of dir.children) child.accept(this);
  }
}

// ----- Client code: build a tree, then run visitors over it -----
const root = new DirectoryNode('project')
  .add(new FileNode('README.md', 1200))
  .add(
    new DirectoryNode('src')
      .add(new FileNode('index.js', 4500))
      .add(new FileNode('utils.js', 2300)),
  )
  .add(
    new DirectoryNode('assets')
      .add(new FileNode('logo.png', 150_000))
      .add(new FileNode('demo.mp4', 5_000_000)),
  );

const totalSize = root.accept(new SizeCalculatorVisitor());
console.log(`Total size: ${totalSize} bytes\n`);

root.accept(new TreePrinterVisitor());

const finder = new LargeFileFinderVisitor(100_000);
root.accept(finder);
console.log('\nLarge files:', finder.results);
```

Note that visitors can keep state across visits — `TreePrinterVisitor` tracks depth, `LargeFileFinderVisitor` accumulates results. Also notice all three operations were added without touching `FileNode` or `DirectoryNode` beyond the one-time `accept` method. (In dynamically-typed JS, a shortcut you'll see in the wild is dispatching by name: `visitor['visit' + node.constructor.name](node)` — same idea, less boilerplate, weaker guarantees.)

## When to use / When NOT to use

**Use when:**

- A class hierarchy is **stable** but you keep adding **operations** over it — compilers/linters over ASTs are the canonical case.
- You want unrelated concerns (export, validation, metrics, rendering) *out* of the data classes.
- An operation needs to work across many node types and accumulate state during a structure-wide traversal.

**Avoid when:**

- The element hierarchy changes often — every new node type forces a method into every visitor (the pattern's mirror-image weakness).
- There's only one operation, or operations naturally belong to the elements themselves (`area()` genuinely belongs on `Circle`).
- In JS specifically: if a simple `switch (node.type)` in one function does the job for a small fixed set of node kinds, that's idiomatic and fine (this is exactly how many JS AST tools work internally) — Visitor earns its keep as operations and node kinds grow.
- Visitors would need deep access to element privates — you'd be forced to widen public APIs just for visitors.

## Real-world usages

- Compilers and JS tooling — Babel plugins are literally visitor objects (`{ Identifier(path) {...}, FunctionDeclaration(path) {...} }`) walked over the AST; ESLint rules visit node types the same way; TypeScript's compiler API exposes `ts.forEachChild`/transform visitors.
- Static analysis, code formatters, and interpreters — one AST, dozens of operations, each a visitor.
- Document object models — exporting a rich document (paragraphs, tables, images) to PDF/HTML/Markdown, one exporter-visitor per format.
- File-system and directory-tree tooling — size auditors, virus scanners, backup selectors over a stable File/Directory hierarchy.

## Interview Notes

- **The must-know concept: double dispatch.** Be able to explain why `node.accept(visitor)` + `visitor.visitFile(this)` selects behavior by *two* runtime types, and why plain overloading can't (single dispatch picks a method by one receiver only). This is the question interviewers actually ask about Visitor.
- **The trade-off table:** easy to add operations, hard to add element types — exactly opposite to putting methods on classes. State this trade-off unprompted.
- **Machine-coding usage:** rare as a *requirement*, but shines in File System design ("now compute total size / search / export"), shopping-cart tax-or-discount calculation over mixed item types, and any AST/expression-evaluator design (pairs with Interpreter).
- Know the Babel connection — "Babel plugins are visitors" is a concrete, credible JS example that most candidates can't give.
- Follow-up: Visitor vs Iterator — Iterator abstracts *how to reach* each element; Visitor abstracts *what to do* at each element (and often owns the traversal for heterogeneous trees). They compose.

## Quick Recap

- Groups code by operation (visitor classes) instead of by class (methods on nodes).
- Elements implement one-line `accept(visitor)`; visitors implement `visitX` per node type.
- Double dispatch: behavior chosen by node type × visitor type, no `instanceof` ladders.
- Add operations cheaply; adding node types is expensive — fits stable hierarchies.
- Babel/ESLint AST plugins are Visitor in production JS.
