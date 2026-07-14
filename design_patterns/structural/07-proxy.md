# Proxy

## Problem it solves

Sometimes you shouldn't (or can't) let clients talk to an object directly. The object might be expensive to create, remote, security-sensitive, or in need of bookkeeping around every call — but you don't want to pollute the object itself with that logic, and you don't want to change client code.

Concrete scenario: a document viewer shows a page of thumbnails. Each `HighResImage` loads a large file from disk the moment it's constructed. Creating 200 of them up front freezes the app, even though the user will scroll past most of them and only ever *display* a few. You want each image to load **lazily** — on first display, not on construction — without the viewer code changing at all.

The Proxy pattern inserts a stand-in object with the **same interface** as the real one. The viewer holds proxies; a proxy defers creating the real image until `display()` is first called (a *virtual proxy*). The same trick supports other gatekeeping: check permissions before delegating (*protection proxy*), return memoized results (*caching proxy*), forward calls over the network (*remote proxy* — e.g. RPC stubs), or log/count accesses (*logging proxy*). In every variant the essence is identical: **control access to the real object, transparently**.

## The Pattern

Participants:

- **Subject** — the common interface (e.g. `Image` with `display()`).
- **Real Subject** — the actual heavyweight/sensitive object (e.g. `HighResImage`).
- **Proxy** — implements Subject, holds (or lazily creates) a Real Subject, and adds access control / laziness / caching around delegation.
- **Client** — uses Subject; can't tell proxy from real object.

```
Client ──▶ Subject (interface: display())
              ▲            ▲
              │            │
        HighResImage   ImageProxy ──lazy-creates──▶ HighResImage
        (loads file     display() {
         in ctor)         if (!real) real = new HighResImage()
                          real.display()
                        }
```

Compare with Decorator: identical wrapping shape, different intent — Proxy manages the object's *lifecycle/access* (and often instantiates the real subject itself); Decorator adds behavior to an object the client already built.

## Code Example

```javascript
// ---------- Subject interface ----------
class Image {
  display() { throw new Error('not implemented'); }
}

// ---------- Real Subject: expensive to construct ----------
class HighResImage extends Image {
  #filename;

  constructor(filename) {
    super();
    this.#filename = filename;
    this.#loadFromDisk(); // heavy work happens at construction time
  }
  #loadFromDisk() {
    console.log(`  (loading ${this.#filename} from disk... slow!)`);
  }
  display() {
    console.log(`  Displaying ${this.#filename}`);
  }
}

// ---------- Virtual Proxy: defers the expensive construction ----------
class ImageProxy extends Image {
  #filename;
  #real = null; // real subject not created yet

  constructor(filename) {
    super();
    this.#filename = filename; // cheap: just remember the name
  }
  display() {
    if (this.#real === null) {
      // First display: NOW pay the loading cost
      this.#real = new HighResImage(this.#filename);
    }
    this.#real.display();
  }
}

// ---------- Client: identical code for real images and proxies ----------
console.log('Creating gallery (should be instant):');
const gallery = [
  new ImageProxy('photo1.png'),
  new ImageProxy('photo2.png'),
  new ImageProxy('photo3.png'),
]; // nothing loaded yet!

console.log('User views photo1:');
gallery[0].display(); // loads, then displays
console.log('User views photo1 again:');
gallery[0].display(); // already loaded — displays immediately
// photo2 and photo3 were never loaded. Cost avoided entirely.

// ---------- Protection + caching proxy: a second mini-example ----------
class SalaryService {
  getSalary(employeeId) {
    console.log(`  (querying DB for ${employeeId}...)`);
    return { employeeId, salary: 100000 };
  }
}

class SalaryServiceProxy {
  #service = new SalaryService();
  #cache = new Map();
  #user;

  constructor(user) { this.#user = user; }

  getSalary(employeeId) {
    // 1. Protection: gate the call
    if (this.#user.role !== 'HR') {
      throw new Error(`Access denied for role "${this.#user.role}"`);
    }
    // 2. Caching: skip the real subject when we already know the answer
    if (!this.#cache.has(employeeId)) {
      this.#cache.set(employeeId, this.#service.getSalary(employeeId));
    }
    return this.#cache.get(employeeId);
  }
}

const hrProxy = new SalaryServiceProxy({ name: 'Priya', role: 'HR' });
console.log(hrProxy.getSalary('E42')); // hits DB
console.log(hrProxy.getSalary('E42')); // served from cache — no DB line

const devProxy = new SalaryServiceProxy({ name: 'Sam', role: 'DEV' });
try {
  devProxy.getSalary('E42');
} catch (e) {
  console.log(`Blocked: ${e.message}`);
}
```

Run with `node proxy.js`. Note that in the gallery, construction is instant and only the viewed image ever loads — and the client loop never knew a proxy was involved.

## When to use / When NOT to use

**Use when:**
- **Lazy initialization (virtual proxy):** the real object is expensive and often unused.
- **Access control (protection proxy):** callers with different privileges share one API.
- **Caching proxy:** repeated calls with the same input can be memoized outside the real object.
- **Remote proxy:** hide network communication behind a local-looking object (RPC/gRPC stubs).
- **Instrumentation:** log, rate-limit, or count references without touching the real class.

**Do NOT use when:**
- The object is cheap and unrestricted — a proxy is pure overhead and indirection.
- You're adding *new user-facing behavior* rather than controlling access — that's Decorator.
- Laziness would hide failures until awkward moments (e.g. auth errors surfacing mid-render); sometimes eager + explicit is better.
- The proxy would need to replicate lots of the real interface by hand and it churns often (in JS, the native `Proxy` object can solve this generically).

## Real-world usages

- **ES6 `Proxy`** is the pattern as a language feature: traps `get`/`set`/`has` on any object. **Vue 3's reactivity** is built on it (property access tracking); so are validation and negative-array-index libraries.
- ORM **lazy loading**: Sequelize/TypeORM relations return proxy-like objects that hit the DB on first access.
- **API gateways / reverse proxies** (nginx, Cloudflare): protection + caching proxies at infrastructure scale; same intent, bigger boxes.
- HTTP client mocks and service stubs in tests (`nock`, `msw`) stand in for real network subjects.

## Interview Notes

- The big one: **"Proxy vs. Decorator?"** — same shape; Proxy *controls access* (may create/own the real subject, client often unaware), Decorator *adds behavior* (client composes wrappers deliberately, can stack many).
- Know the **four classic proxy types** by name: virtual (lazy), protection (auth), remote (network), caching/smart — and give a one-liner for each.
- In a JS interview, mention the built-in `Proxy`/`Reflect` and one real user (Vue 3 reactivity) — instant credibility.
- Machine-coding problems: image gallery lazy-loader, rate limiter in front of a service, cached DB/repository layer, role-based access to admin operations, connection object that reconnects transparently.
- Design nuance worth saying: a proxy should preserve the Subject contract exactly — if it changes the interface it has drifted into Adapter territory.

## Quick Recap

- Proxy = same-interface stand-in that controls access to a real object.
- Main flavors: virtual (lazy creation), protection (permission checks), caching, remote, logging.
- Client code is untouched — it can't (and shouldn't) tell proxy from real subject.
- Unlike Decorator, a proxy often manages the real subject's lifecycle and hides its existence.
- JavaScript ships the idea natively as `new Proxy(target, handlers)` — the backbone of Vue 3 reactivity.
