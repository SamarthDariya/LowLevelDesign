# Encapsulation

## What is it?

**Encapsulation** means bundling data and the methods that operate on that data into one unit (a class), and **hiding the internal details** so outside code can only interact through a controlled, public interface. The object protects its own state; nobody reaches in and fiddles with its internals directly.

The classic analogy is an **ATM**. Your bank balance lives somewhere inside the bank's systems, but you can't walk into the vault and rearrange the cash. You interact through a small, safe set of operations: insert card, check balance, withdraw. The ATM enforces the rules — you can't withdraw more than you have, and every operation is validated and logged. The complexity and the raw data are hidden; only safe operations are exposed.

In JavaScript, true privacy comes from **`#` private fields** (ES2022): a field declared as `#balance` is genuinely inaccessible from outside the class — `account.#balance` is a syntax error. Before `#` existed, developers used a leading-underscore convention (`_balance`) which was only a polite request, not enforcement. Alongside private fields, JS gives you **getters and setters** (`get balance()` / `set owner(v)`) so you can expose read access or validated write access while keeping the raw field hidden.

The payoff: **invariants**. An invariant is a rule that must always be true — "balance is never negative," "email always contains @." When all writes go through methods you control, you can guarantee invariants hold. When fields are public, any line of code anywhere can silently break them.

## Why does it matter in LLD?

In LLD interviews, encapsulation is judged constantly even when it's never named. If you design a `BankAccount` with a public `balance` field that callers modify directly, the interviewer will ask: *"What stops someone from setting balance to -5000?"* The expected design is private state + public methods (`deposit`, `withdraw`) that validate every change. This pattern — *behavior-rich objects instead of dumb data bags* — is a core signal of design maturity.

In real systems, encapsulation is what makes code changeable. If `Order` exposes its internal `items` array, twenty other modules will mutate it directly, and now you can't add "recalculate total on change" logic without hunting down every call site. If `Order` only exposes `addItem()` / `removeItem()`, there's exactly one place to add that logic. Encapsulation shrinks the "blast radius" of change.

It also underpins later topics: abstraction (hide *how*, expose *what*), the Law of Demeter ("don't dig through objects: `order.customer.address.city` is a smell"), and immutability patterns. Interviewers frequently follow up an LLD design with *"how would you prevent invalid states?"* — encapsulation is the answer.

## Code Example

```javascript
// bankAccount.js — run with: node bankAccount.js

class BankAccount {
  // Private fields: TRULY inaccessible outside this class.
  #balance;
  #owner;
  #transactions = []; // private audit log

  static #nextAccountNumber = 1001; // private static counter

  constructor(owner, initialDeposit = 0) {
    if (initialDeposit < 0) {
      throw new Error("Initial deposit cannot be negative");
    }
    this.#owner = owner;
    this.#balance = initialDeposit;
    this.accountNumber = BankAccount.#nextAccountNumber++;
  }

  // ---- Controlled READ access via getters ----
  get balance() {
    return this.#balance; // read-only from outside: no `set balance` exists
  }

  get owner() {
    return this.#owner;
  }

  // ---- Controlled WRITE access via a validating setter ----
  set owner(newOwner) {
    if (typeof newOwner !== "string" || newOwner.trim() === "") {
      throw new Error("Owner name must be a non-empty string");
    }
    this.#owner = newOwner.trim();
  }

  // ---- All state changes go through methods that enforce rules ----
  deposit(amount) {
    if (amount <= 0) throw new Error("Deposit must be positive");
    this.#balance += amount;
    this.#record("DEPOSIT", amount);
  }

  withdraw(amount) {
    if (amount <= 0) throw new Error("Withdrawal must be positive");
    if (amount > this.#balance) {
      throw new Error(
        `Insufficient funds: balance is $${this.#balance}, requested $${amount}`
      );
    }
    this.#balance -= amount;
    this.#record("WITHDRAW", amount);
  }

  // Private method (#) — an internal helper callers never see
  #record(type, amount) {
    this.#transactions.push({ type, amount, at: new Date().toISOString() });
  }

  // Expose a SAFE COPY of internal data, never the live array
  getStatement() {
    return this.#transactions.map((t) => ({ ...t }));
  }
}

// ---- Using the class ----
const account = new BankAccount("Dariya", 100);

account.deposit(50);
account.withdraw(30);
console.log(account.balance); // 120  (getter — reads like a property)
console.log(account.owner);   // Dariya

account.owner = "Dariya S."; // setter runs validation
console.log(account.owner);   // Dariya S.

// The invariant "balance never negative" CANNOT be broken from outside:
try {
  account.withdraw(1000);
} catch (e) {
  console.log("Blocked:", e.message); // Blocked: Insufficient funds...
}

// Direct access to private state is impossible:
// console.log(account.#balance);  // SyntaxError if uncommented!
console.log(account.balance);      // the only way in: the public getter

// The statement is a copy — mutating it can't corrupt the account:
const stmt = account.getStatement();
stmt.push({ type: "FAKE", amount: 9999 });
console.log(account.getStatement().length); // still 2 — internals protected
```

Notice the three layers of protection:

1. `#balance` cannot be read or written from outside — not even seen.
2. Every mutation (`deposit`, `withdraw`, `set owner`) validates before changing state.
3. `getStatement()` returns a *copy*, so callers can't mutate internal collections.

## Common Mistakes

- **Public fields for everything** — `this.balance = 100` with no `#` means any code can write `account.balance = -999`. Default to private; expose deliberately.
- **Getter/setter pairs for every field, no logic** — auto-generating `get x()/set x(v)` for all fields is just public fields with extra steps. Only add accessors that validate, compute, or restrict.
- **Leaking internal references** — returning `this.#transactions` directly hands the caller your live array. Return copies (or frozen objects) for internal collections.
- **Relying on the `_underscore` convention** — `_balance` is still fully public; nothing stops `account._balance = -1`. Use `#` for real privacy in modern JS.
- **Validating in some paths but not others** — if `deposit` validates but the constructor doesn't, `new BankAccount("x", -500)` breaks your invariant on day one. Validate at *every* entry point.

## Interview Notes

- Expect the probe: *"What prevents an invalid state here?"* Your answer: private fields + validating methods = invariants enforced in one place.
- "Tell, don't ask" is a favorite follow-up: prefer `account.withdraw(50)` (tell the object) over `if (account.balance >= 50) account.balance -= 50` (ask, then mutate externally).
- Know the JS-specific detail: `#field` is enforced privacy (ES2022); `_field` is convention only. Saying this crisply shows current language knowledge.
- When designing classes in interviews, narrate it: *"I'll keep balance private and expose only deposit/withdraw so the 'no negative balance' rule lives in one place."* Naming the invariant is what earns the credit.
- Defensive copying of returned collections is a senior-level detail interviewers notice — mention it when your class holds arrays or maps.

## Quick Recap

- Encapsulation = bundle state + behavior, hide internals, expose a small safe API.
- Use `#privateFields` for real privacy; getters/setters for controlled, validated access.
- The goal is protecting **invariants** — rules about state that must always hold.
- Never leak live references to internal collections; return copies.
- "Tell, don't ask": callers request operations; the object guards its own data.
