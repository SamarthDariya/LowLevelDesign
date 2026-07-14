# Composite

## Problem it solves

Some data is naturally a tree: file systems (folders contain files *and* folders), org charts (managers manage employees *and* other managers), UI scenes (containers hold widgets *and* containers). Client code that works with such trees quickly fills up with `if (isFolder) … else …` branches, and every recursive operation (size, search, render, delete) re-implements the same tree walk.

Concrete scenario: you're asked to compute the total size of a folder. A folder contains files (which know their size) and subfolders (whose size is the sum of *their* contents, recursively). If files and folders have unrelated interfaces, the client must constantly type-check: "is this a file? read `size`. Is it a folder? loop and recurse." Add a new operation (`count()`, `find(name)`) and you rewrite the same branching walk again.

The Composite pattern gives leaves and containers a **common interface**, and makes containers implement each operation by **delegating to their children**. Clients then treat a single file and a 10,000-node folder tree *uniformly* — `node.getSize()` just works, whatever `node` is.

## The Pattern

Participants:

- **Component** — the common interface for everything in the tree (e.g. `FileSystemNode` with `getSize()`, `print()`).
- **Leaf** — a node with no children; does the real work directly (e.g. `File`).
- **Composite** — a node that holds child Components; implements operations by iterating/recursing over children (e.g. `Folder`). Also exposes `add`/`remove`.
- **Client** — works only with Component; never distinguishes leaf from composite.

```
            Component
         (getSize, print)
            ▲        ▲
            │        │
          Leaf    Composite ◇────── children: Component[]
         (File)    (Folder)         getSize() = Σ child.getSize()
```

Design choice to know: where do `add/remove` live? On Composite only (**type safety** — you can't add children to a file) or on Component (**uniformity** — but leaves must throw). Most real code puts them on Composite.

## Code Example

```javascript
// ---------- Component ----------
class FileSystemNode {
  #name;
  constructor(name) { this.#name = name; }
  get name() { return this.#name; }

  getSize()      { throw new Error('not implemented'); }
  print(indent = '') { throw new Error('not implemented'); }
}

// ---------- Leaf ----------
class FileNode extends FileSystemNode {
  #size;
  constructor(name, sizeKB) {
    super(name);
    this.#size = sizeKB;
  }
  getSize() { return this.#size; }              // a file knows its own size
  print(indent = '') {
    console.log(`${indent}📄 ${this.name} (${this.#size} KB)`);
  }
}

// ---------- Composite ----------
class Folder extends FileSystemNode {
  #children = [];

  add(node) {
    this.#children.push(node);
    return this; // fluent: folder.add(a).add(b)
  }
  remove(node) {
    this.#children = this.#children.filter((c) => c !== node);
  }

  // The heart of Composite: implement operations by recursing over children.
  // A child may be a FileNode OR another Folder — we don't care which.
  getSize() {
    return this.#children.reduce((sum, child) => sum + child.getSize(), 0);
  }

  print(indent = '') {
    console.log(`${indent}📁 ${this.name}/ (${this.getSize()} KB)`);
    for (const child of this.#children) child.print(indent + '  ');
  }

  // Bonus recursive operation: find a node by name anywhere in the subtree
  find(name) {
    if (this.name === name) return this;
    for (const child of this.#children) {
      if (child.name === name) return child;
      if (child instanceof Folder) {
        const hit = child.find(name);
        if (hit) return hit;
      }
    }
    return null;
  }
}

// ---------- Client: builds a tree, then treats everything uniformly ----------
const root = new Folder('root');
const src = new Folder('src');
const assets = new Folder('assets');

src.add(new FileNode('index.js', 12)).add(new FileNode('utils.js', 8));
assets.add(new FileNode('logo.png', 150));
root.add(src).add(assets).add(new FileNode('README.md', 4));

root.print();
// 📁 root/ (174 KB)
//   📁 src/ (20 KB)
//     📄 index.js (12 KB)
//     ...

// Uniformity: same call works on a leaf and on the whole tree.
console.log('Total:', root.getSize(), 'KB');            // 174
console.log('One file:', src.find('utils.js').getSize(), 'KB'); // 8
```

Run with `node composite.js`. Note that `Folder.getSize()` never checks child types — polymorphism does the branching that `if/else` would otherwise do.

## When to use / When NOT to use

**Use when:**
- Your domain is a part–whole hierarchy (tree): file systems, org charts, menus/submenus, UI component trees, arithmetic expression trees, nested comments.
- Clients should treat individual objects and groups of objects the same way.
- Operations are naturally recursive (sum, count, render, search, serialize).

**Do NOT use when:**
- The structure is flat — a plain array of objects doesn't need a tree pattern.
- Leaves and containers genuinely share almost no operations — forcing a common interface makes both sides awkward (lots of throwing stubs).
- The tree is huge and operations must be fast — naive recursion recomputes everything; you may need caching/aggregation at write-time instead (or pair Composite with cached totals).

## Real-world usages

- The browser DOM: `Element` nodes contain other nodes; `appendChild`, `remove`, and rendering are composite operations over the tree.
- React/Vue component trees: a component renders children which render children; reconciliation walks the composite uniformly.
- Scene graphs in game/graphics engines (Three.js `Object3D` — groups and meshes share one interface; transforms cascade to children).
- Nested validation/serialization schemas (a Zod/Joi object schema validates by delegating to child schemas).

## Interview Notes

- Expect: **"Where do add/remove go — Component or Composite?"** Know the transparency-vs-safety trade-off and defend a choice (safety/Composite-only is the common pick).
- **"How would you handle cycles?"** Trees shouldn't have them; mention parent-pointer checks or visited-sets if arbitrary graphs sneak in.
- Composite pairs naturally with **Iterator** (tree traversal) and **Visitor** (adding new operations without touching node classes) — mentioning this scores points.
- Machine-coding problems that use it: **in-memory file system** (very common), org-hierarchy salary rollup, menu/catalog rendering, calculator with expression trees, Splitwise-style nested groups.
- Complexity note: operations are O(n) over the subtree; discuss caching aggregates (size on Folder, invalidated on add/remove) if interviewer pushes on scale.

## Quick Recap

- Composite = tree of objects where leaves and containers share one interface.
- Composites implement operations by recursing over children; clients never type-check.
- Great for part–whole hierarchies: file systems, org charts, DOM/UI trees.
- Key design decision: child-management methods on Composite (safe) vs. Component (uniform).
- Often combined with Iterator/Visitor; watch recursion cost on big trees.
