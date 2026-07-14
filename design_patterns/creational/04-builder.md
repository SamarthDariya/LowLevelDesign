# Builder

## Problem it solves

Some objects need a *lot* of configuration. Think of an HTTP request: method, URL, headers, query params, body, timeout, retries, auth... A constructor that takes all of that becomes the infamous **telescoping constructor**: `new HttpRequest("GET", url, null, null, {}, 3000, null)` — a parade of `null`s where you count commas to figure out which argument is the timeout. Every new optional field makes it worse, and call sites are unreadable and error-prone (swap two string arguments and nothing complains).

The usual dodge — create an empty object and mutate it with setters — trades one problem for two. The object is **temporarily invalid** while it's being set up (someone can use a request that has a body but no URL yet), and because setters must stay open forever, the object can never be **immutable**. There's also nowhere natural to enforce cross-field rules like "a GET request must not have a body": each setter only sees its own field.

Builder separates *configuring* from *being*. A mutable, chainable builder object absorbs all the incremental setup; a single `build()` call validates everything at once and produces the final object — complete, verified, and frozen. Call sites read like a sentence, invalid intermediate states never escape, and validation lives in exactly one place.

## The Pattern

Extract the object's construction into a separate **Builder** with one fluent method per field/part, each returning `this` so calls chain. A terminal `build()` validates the accumulated state and returns the immutable **Product**. Optionally, a **Director** captures reusable "recipes" (fixed sequences of builder calls).

**Participants:**

| Role | In our example | Responsibility |
|---|---|---|
| Product | `HttpRequest` | The complex, ideally immutable object |
| Builder | `HttpRequestBuilder` | Chainable setters + `build()` with validation |
| Director (optional) | `RequestRecipes` | Named, reusable construction sequences |
| Client | demo code | Chains what it needs; never sees a half-built product |

```
Client
  |
  |  HttpRequest.builder()          (get a fresh builder)
  v
+---------------------------+
|    HttpRequestBuilder     |
+---------------------------+
| method, url, headers, ... |  <- mutable working state
| + setUrl(u)      -> this  |
| + setMethod(m)   -> this  |   each setter returns `this`
| + addHeader(k,v) -> this  |   so calls chain fluently
| + build()  ---------------+--> validate all fields together
+---------------------------+         |
                                      v
                          +---------------------+
                          |     HttpRequest     |  <- frozen, complete,
                          |     (immutable)     |     never half-built
                          +---------------------+
```

## Code Example

```javascript
// ---------- Product ----------
// An immutable HTTP request. Note the constructor takes the builder —
// clients are expected to go through HttpRequest.builder().
class HttpRequest {
  constructor(builder) {
    this.method  = builder.method;
    this.url     = builder.url;
    this.headers = { ...builder.headers }; // defensive copy
    this.query   = { ...builder.query };
    this.body    = builder.body;
    this.timeout = builder.timeout;
    Object.freeze(this.headers);
    Object.freeze(this.query);
    Object.freeze(this); // the finished product is immutable
  }

  // Entry point: HttpRequest.builder().setUrl(...)...build()
  static builder() {
    return new HttpRequestBuilder();
  }

  describe() {
    const qs = Object.entries(this.query)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    return `${this.method} ${this.url}${qs ? "?" + qs : ""}` +
      ` | headers: ${JSON.stringify(this.headers)}` +
      ` | timeout: ${this.timeout}ms` +
      (this.body ? ` | body: ${this.body}` : "");
  }
}

// ---------- Builder ----------
class HttpRequestBuilder {
  // Sensible defaults; the caller overrides only what they need
  method  = "GET";
  url     = null;
  headers = {};
  query   = {};
  body    = null;
  timeout = 30_000;

  setMethod(method) {
    this.method = method.toUpperCase();
    return this; // returning `this` is what enables chaining
  }

  setUrl(url) {
    this.url = url;
    return this;
  }

  addHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
    return this;
  }

  addQueryParam(key, value) {
    this.query[key] = value;
    return this;
  }

  setJsonBody(data) {
    this.body = JSON.stringify(data);
    return this.addHeader("Content-Type", "application/json");
  }

  setTimeout(ms) {
    this.timeout = ms;
    return this;
  }

  // build() is the single place for cross-field validation —
  // impossible with plain setters on a half-built object.
  build() {
    if (!this.url) {
      throw new Error("url is required");
    }
    if (this.body && ["GET", "HEAD"].includes(this.method)) {
      throw new Error(`${this.method} requests must not have a body`);
    }
    return new HttpRequest(this);
  }
}

// ---------- Optional: a "Director" — canned recipes over the builder ----------
const RequestRecipes = {
  jsonPost(url, data) {
    return HttpRequest.builder()
      .setMethod("POST")
      .setUrl(url)
      .setJsonBody(data)
      .addHeader("Accept", "application/json")
      .build();
  },
};

// ---------- Demo ----------
const search = HttpRequest.builder()
  .setUrl("https://api.example.com/users")
  .addQueryParam("q", "dariya")
  .addQueryParam("limit", 10)
  .addHeader("Authorization", "Bearer abc123")
  .setTimeout(5_000)
  .build();

console.log(search.describe());

const create = RequestRecipes.jsonPost("https://api.example.com/users", {
  name: "Dariya",
  role: "admin",
});
console.log(create.describe());

// The product is frozen — attempts to redefine a field throw:
try {
  Object.defineProperty(search, "url", { value: "https://evil.example.com" });
} catch (e) {
  console.log("Mutation blocked:", e.constructor.name); // TypeError
}

// Validation catches illegal combinations in ONE place:
try {
  HttpRequest.builder().setUrl("https://x.dev").setJsonBody({ a: 1 }).build();
} catch (e) {
  console.log("Rejected:", e.message); // GET requests must not have a body
}
```

Output:

```
GET https://api.example.com/users?q=dariya&limit=10 | headers: {"authorization":"Bearer abc123"} | timeout: 5000ms
POST https://api.example.com/users | headers: {"content-type":"application/json","accept":"application/json"} | timeout: 30000ms | body: {"name":"Dariya","role":"admin"}
Mutation blocked: TypeError
Rejected: GET requests must not have a body
```

**A JS note:** because JavaScript has object literals and default/named parameters, `new HttpRequest({ url, method = "GET", timeout = 30_000 })` covers many simple cases without a builder. Reach for Builder when you also want **step-wise assembly** (build a request across several functions before sending), **cross-field validation at one choke point**, **immutability of the result**, or **reusable recipes/directors**.

## When to use / When NOT to use

**Use when:**
- The object has many optional parameters and a telescoping constructor is forming.
- You want the finished object to be **immutable** but its assembly to be incremental.
- Construction requires **validation across fields** that must run once, at the end.
- Different "recipes" produce different representations from the same steps (Director), e.g. a query built for SQL vs for an ORM.

**Do NOT use when:**
- The object has 2-4 fields — a plain constructor or an options-object literal is clearer and shorter.
- The object is mutable anyway and has no invariants — the builder adds a class without adding safety.
- You need *polymorphic creation* (which class?) — that's Factory territory; Builder answers *how to assemble*, not *which type*.

## Real-world usages

- **Knex.js / Prisma / TypeORM query builders** — `knex("users").where("age", ">", 18).orderBy("name").limit(10)` chains steps and materializes on execution.
- **`URL` + `URLSearchParams`** and **fetch `Request` option assembly** — incremental construction of a complex request.
- **Test-data builders** — `aUser().asAdmin().withEmail("x@y.dev").build()` is a beloved testing idiom in every language.
- **Lodash `_.chain()`**, **superagent** (`request.get(url).set(header).query(...)`) — fluent step-wise assembly ending in a terminal call.

## Interview Notes

- Classic question: *"Builder vs Factory?"* — Factory answers **which** object to create (one call, type selection); Builder answers **how** to assemble one complex object (many steps, same type). They compose: a factory can return a builder.
- *"Why not just use setters?"* — half-built objects can escape, the object can never be immutable, and there's no single validation point. This is the core justification; say it crisply.
- Machine-coding problems that use it: **Pizza/Burger ordering** (size, crust, toppings), **HTTP client**, **Resume/Report generator**, **Car configurator**, and constructing complex domain objects in **Splitwise** (an `Expense` with payers, splits, and metadata is the canonical Builder in that problem).
- Know the optional **Director** role: it owns *recipes* (order of steps), the builder owns *how each step is done*. Most modern code skips a formal Director and uses helper functions.
- JS-specific follow-up: *"Doesn't an options object make Builder unnecessary?"* — often yes for simple cases; give the validation/immutability/step-wise-assembly criteria for when Builder still earns its keep.

## Quick Recap

- Builder separates **construction** (mutable, chainable, step-wise) from **representation** (final, validated, frozen).
- Kills telescoping constructors and prevents half-initialized objects from escaping.
- Signature ingredients: fluent setters returning `this`, one terminal `build()` doing all validation, `Object.freeze` on the product.
- Director = optional recipe-keeper; in JS it's usually just a helper function.
- Builder = *how to assemble one complex thing*; Factory = *which thing to make* — a favorite interview contrast.
