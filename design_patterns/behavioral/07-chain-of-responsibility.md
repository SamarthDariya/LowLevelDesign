# Chain of Responsibility

## Problem it solves

A customer-support system receives tickets of wildly different difficulty. A password-reset question can be answered by a bot. A refund issue needs a human agent. A corrupted-account problem needs a manager. A full site outage needs to page the on-call engineer. Who decides where each ticket goes?

The naive answer is a dispatcher with a big conditional: `if (bot can handle) ... else if (severity <= 2) ... else if (severity <= 4) ... else ...`. This central dispatcher must know every handler, every rule, and every escalation path. Adding a new tier (say, a "specialist" between agent and manager) means editing the dispatcher. Reordering tiers means rewriting it. And the sender of the ticket is coupled to the entire org chart.

Chain of Responsibility removes the dispatcher. Each handler gets two things: the logic to decide *"can I handle this?"* and a reference to the *next* handler. A request enters at the head of the chain and travels handler to handler until one takes it (or it falls off the end). The sender knows only the head of the chain. Handlers know only their successor. You can add, remove, and reorder handlers by relinking — no central logic to edit. A variation worth knowing: instead of "first one handles it, stop", every handler can do partial work and pass along — that's exactly how middleware pipelines (Express, Koa) work.

## The Pattern

**Intent:** Avoid coupling the sender of a request to its receiver by giving more than one object a chance to handle the request. Chain the receivers and pass the request along the chain until an object handles it.

Participants:

- **Handler (base class/interface)** (`SupportHandler`): declares `handle(request)` and stores the `next` link; default behavior forwards to `next`.
- **Concrete Handlers** (`ChatBot`, `SupportAgent`, `SupportManager`, `EngineeringOnCall`): handle what they can; otherwise call `super.handle` to pass along.
- **Client:** builds the chain (order matters!) and sends requests to the first handler only.

```
            handle(ticket)
  Client ------------------> +----------+   pass   +----------+   pass
                             | ChatBot  |--------->| Support  |--------->
                             +----------+          | Agent    |
                                                   +----------+
             +-----------+   pass    +-------------+
        ---> | Support   |---------> | Engineering |---> (end of chain)
             | Manager   |           | OnCall      |
             +-----------+           +-------------+

  Each handler: if I can handle it -> do it, stop.
                else               -> next.handle(request)
```

## Code Example

Support-ticket escalation. Save as `chain.js` and run with `node chain.js`.

```javascript
// ----- Handler base class: holds the "next" link and default pass-along -----
class SupportHandler {
  #next = null;

  // Returns the next handler so we can chain calls fluently.
  setNext(handler) {
    this.#next = handler;
    return handler;
  }

  handle(ticket) {
    if (this.#next) {
      return this.#next.handle(ticket); // default: pass it along
    }
    console.log(`[Unhandled] Ticket "${ticket.subject}" reached end of chain.`);
    return null;
  }
}

// ----- Concrete handlers: each handles what it can, else delegates -----
class ChatBot extends SupportHandler {
  #knownIssues = new Set(['password reset', 'billing address']);

  handle(ticket) {
    if (this.#knownIssues.has(ticket.subject)) {
      console.log(`[Bot] Auto-resolved "${ticket.subject}" with a help article.`);
      return 'bot';
    }
    return super.handle(ticket); // can't handle it -> pass to next
  }
}

class SupportAgent extends SupportHandler {
  handle(ticket) {
    if (ticket.severity <= 2) {
      console.log(`[Agent] Resolved "${ticket.subject}" (severity ${ticket.severity}).`);
      return 'agent';
    }
    return super.handle(ticket);
  }
}

class SupportManager extends SupportHandler {
  handle(ticket) {
    if (ticket.severity <= 4) {
      console.log(`[Manager] Escalation handled: "${ticket.subject}".`);
      return 'manager';
    }
    return super.handle(ticket);
  }
}

class EngineeringOnCall extends SupportHandler {
  handle(ticket) {
    console.log(`[On-call] Paged for "${ticket.subject}" — investigating outage.`);
    return 'engineering';
  }
}

// ----- Client code: build the chain once, throw tickets at it -----
const chain = new ChatBot();
chain
  .setNext(new SupportAgent())
  .setNext(new SupportManager())
  .setNext(new EngineeringOnCall());

const tickets = [
  { subject: 'password reset', severity: 1 },
  { subject: 'refund not received', severity: 2 },
  { subject: 'account data corrupted', severity: 4 },
  { subject: 'site is down', severity: 5 },
];

for (const ticket of tickets) {
  chain.handle(ticket); // client talks ONLY to the head of the chain
}
```

Two design details worth internalizing: `setNext` returns the handler passed in, which makes chain-building read like the chain itself; and the base class owns the "pass along or end gracefully" logic so concrete handlers only write their own decision. Also decide consciously what happens when *nobody* handles a request — log it, throw, or apply a catch-all default handler at the tail (here, on-call is effectively the catch-all).

## When to use / When NOT to use

**Use when:**

- Several handlers *could* process a request and the right one is discovered at runtime (escalation levels, approval limits, event bubbling).
- You want senders decoupled from receivers, and the set/order of handlers configurable at runtime.
- Requests should pass through a *pipeline* of processing stages (auth → logging → validation → rate-limit → business logic) — the middleware variant.
- Approval workflows: expense claims where manager approves ≤ $1k, director ≤ $10k, CFO above.

**Avoid when:**

- Exactly one known object always handles the request — call it directly.
- Every request must be guaranteed handled and you can't tolerate one silently falling off the end (or add an explicit catch-all/error at the tail).
- The chain gets long and hot-path performance matters — each request walks the links.
- Debugging clarity is paramount for your team: "who handled this?" requires tracing the chain at runtime, which can obscure control flow.

## Real-world usages

- Express/Koa middleware — each middleware does work and calls `next()`; exactly the "everyone processes and passes along" variant, including error-handling middleware as a specialized tail.
- DOM event bubbling — a click travels up parent elements until a listener handles it (and may call `stopPropagation()` — literally "I handled it, stop the chain").
- Logging frameworks — loggers pass records through a chain of appenders/filters, each deciding whether to process by level.
- Exception handling / servlet filters / axios interceptors — try/catch propagation up the call stack and request/response interceptor pipelines are the same shape.

## Interview Notes

- **Signature machine-coding problems:** ATM cash dispenser (₹2000 → ₹500 → ₹100 note handlers, each dispensing what it can and passing on the remainder), Logger with levels (INFO → DEBUG → ERROR chain), leave/expense approval workflows, and designing middleware for a web framework.
- **Two flavors — say which you're building:** classic CoR (first capable handler handles, chain stops) vs pipeline/middleware (every handler processes and passes along). Interviewers often ask you to convert one into the other.
- **CoR vs Decorator:** both are linked wrappers. Decorator always passes through and *adds* behavior around the same operation; CoR handlers can *stop* the chain, and each handler represents a genuinely different responsibility.
- Be ready for: "what if no handler handles it?" (tail catch-all vs throw), "how do you reorder handlers at runtime?" (chain is data — rebuild links), and "how does Express implement this?" (array of functions + `next()` closures rather than linked objects).
- Extension question: making handlers async (each `handle` returns a promise) — the pattern holds unchanged, `await super.handle(ticket)`.

## Quick Recap

- Handlers form a linked chain; a request travels until someone handles it.
- Sender knows only the head; each handler knows only its successor — total sender/receiver decoupling.
- Chain composition is data: add, remove, reorder handlers without touching their code.
- Two variants: stop-at-first-handler (escalation) vs process-and-pass (middleware pipelines).
- ATM dispenser, Logger, approval workflows, and Express middleware are the interview staples.
